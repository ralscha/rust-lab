use std::{
    collections::{HashMap, HashSet},
    net::IpAddr,
    sync::Mutex,
    time::{Duration, Instant},
};

use axum::http::{HeaderMap, HeaderValue, StatusCode, header};

use crate::error::ApiError;

struct Bucket {
    count: u32,
    until: Instant,
}

pub struct Security {
    allowed_origins: HashSet<String>,
    trust_forwarded_for: bool,
    requests: Mutex<HashMap<IpAddr, Bucket>>,
}

impl Security {
    pub fn new(allowed_origins: HashSet<String>, trust_forwarded_for: bool) -> Self {
        Self {
            allowed_origins,
            trust_forwarded_for,
            requests: Mutex::new(HashMap::new()),
        }
    }

    /// Uses the rightmost X-Forwarded-For entry only when a loopback reverse proxy sent it.
    pub fn client_ip(&self, address: IpAddr, headers: &HeaderMap) -> IpAddr {
        if !self.trust_forwarded_for || !address.is_loopback() {
            return address;
        }
        headers
            .get_all("x-forwarded-for")
            .iter()
            .next_back()
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.rsplit(',').next())
            .and_then(|value| value.trim().parse().ok())
            .unwrap_or(address)
    }

    pub fn check_origin(&self, headers: &HeaderMap) -> Result<Option<HeaderValue>, ApiError> {
        let origin = headers.get(header::ORIGIN);
        let origin_text = origin.and_then(|value| value.to_str().ok());
        let host = headers
            .get(header::HOST)
            .and_then(|value| value.to_str().ok())
            .unwrap_or("");
        let allowed = origin_text.is_some_and(|origin| self.allowed_origins.contains(origin));
        let same_origin = origin_text.is_some_and(|origin| {
            origin == format!("http://{host}") || origin == format!("https://{host}")
        });
        if origin.is_some() && !allowed && !same_origin {
            return Err(ApiError::new(
                StatusCode::FORBIDDEN,
                "Requests from this origin are not allowed.",
            ));
        }
        if headers
            .get("sec-fetch-site")
            .is_some_and(|value| value == "cross-site")
            && !allowed
        {
            return Err(ApiError::new(
                StatusCode::FORBIDDEN,
                "Cross-site requests are not allowed.",
            ));
        }
        Ok(origin.cloned())
    }

    pub fn check_rate(&self, address: IpAddr) -> Result<(), ApiError> {
        let now = Instant::now();
        let mut requests = self.requests.lock().map_err(ApiError::internal)?;
        requests.retain(|_, entry| now < entry.until);
        if !requests.contains_key(&address) && requests.len() >= 10_000 {
            return Err(ApiError::new(
                StatusCode::SERVICE_UNAVAILABLE,
                "Server is busy. Please retry shortly.",
            ));
        }
        let entry = requests.entry(address).or_insert(Bucket {
            count: 0,
            until: now + Duration::from_secs(60),
        });
        if entry.count >= 30 {
            let seconds = entry.until.duration_since(now).as_secs_f64().ceil() as u64;
            return Err(ApiError::new(
                StatusCode::TOO_MANY_REQUESTS,
                "Too many runner requests. Please wait a minute and try again.",
            )
            .with_header(header::RETRY_AFTER, HeaderValue::from(seconds)));
        }
        entry.count += 1;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn forwarded(value: &str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert("x-forwarded-for", HeaderValue::from_str(value).unwrap());
        headers
    }

    #[test]
    fn client_ip_trusts_only_rightmost_entry_from_loopback() {
        let security = Security::new(HashSet::new(), true);
        let proxy: IpAddr = "127.0.0.1".parse().unwrap();
        let client: IpAddr = "203.0.113.1".parse().unwrap();
        assert_eq!(
            security.client_ip(proxy, &forwarded("198.51.100.9, 203.0.113.1")),
            client
        );
        assert_eq!(security.client_ip(proxy, &forwarded("not-an-ip")), proxy);
        let remote: IpAddr = "192.0.2.5".parse().unwrap();
        assert_eq!(
            security.client_ip(remote, &forwarded("203.0.113.1")),
            remote
        );
    }

    #[test]
    fn client_ip_ignores_header_when_disabled() {
        let security = Security::new(HashSet::new(), false);
        let proxy: IpAddr = "127.0.0.1".parse().unwrap();
        assert_eq!(security.client_ip(proxy, &forwarded("203.0.113.1")), proxy);
    }

    #[test]
    fn forwarded_clients_get_separate_limits() {
        let security = Security::new(HashSet::new(), true);
        let proxy: IpAddr = "127.0.0.1".parse().unwrap();
        let first = security.client_ip(proxy, &forwarded("203.0.113.1"));
        let second = security.client_ip(proxy, &forwarded("203.0.113.2"));
        for _ in 0..30 {
            assert!(security.check_rate(first).is_ok());
        }
        assert!(security.check_rate(first).is_err());
        assert!(security.check_rate(second).is_ok());
    }
}
