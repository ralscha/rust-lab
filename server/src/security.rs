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
    requests: Mutex<HashMap<IpAddr, Bucket>>,
}

impl Security {
    pub fn new(allowed_origins: HashSet<String>) -> Self {
        Self {
            allowed_origins,
            requests: Mutex::new(HashMap::new()),
        }
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
