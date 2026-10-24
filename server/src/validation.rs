use std::error::Error;

use axum::{
    body::to_bytes,
    extract::Request,
    http::{StatusCode, header},
};
use serde_json::Value;

use crate::{
    config::{MAX_BODY_BYTES, MAX_SOURCE_BYTES},
    error::ApiError,
};

pub async fn read_json(request: Request) -> Result<Value, ApiError> {
    let content_type = request
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("");
    if !content_type
        .split(';')
        .next()
        .unwrap_or("")
        .trim()
        .eq_ignore_ascii_case("application/json")
    {
        return Err(ApiError::new(
            StatusCode::UNSUPPORTED_MEDIA_TYPE,
            "Send requests as application/json.",
        ));
    }
    if request
        .headers()
        .get(header::CONTENT_LENGTH)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.parse::<u64>().ok())
        .is_some_and(|size| size > MAX_BODY_BYTES as u64)
    {
        return Err(body_too_large());
    }
    let bytes = to_bytes(request.into_body(), MAX_BODY_BYTES)
        .await
        .map_err(|error| {
            if error
                .source()
                .is_some_and(|source| source.is::<http_body_util::LengthLimitError>())
            {
                body_too_large()
            } else {
                ApiError::new(StatusCode::BAD_REQUEST, "Request was interrupted.")
            }
        })?;
    let body: Value = serde_json::from_slice(&bytes).map_err(|_| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            "The request body must be valid JSON.",
        )
    })?;
    if !body.is_object() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "The request body must be a JSON object.",
        ));
    }
    Ok(body)
}

fn body_too_large() -> ApiError {
    ApiError::new(
        StatusCode::PAYLOAD_TOO_LARGE,
        "Request is too large. The limit is 64 KiB.",
    )
}

pub fn source(body: &Value) -> Result<&str, ApiError> {
    let code = body
        .get("code")
        .and_then(Value::as_str)
        .filter(|code| !code.trim().is_empty())
        .ok_or_else(|| {
            ApiError::new(
                StatusCode::BAD_REQUEST,
                "code must be a nonempty Rust source string.",
            )
        })?;
    if code.len() > MAX_SOURCE_BYTES {
        return Err(ApiError::new(
            StatusCode::PAYLOAD_TOO_LARGE,
            "Rust source must be at most 48 KiB.",
        ));
    }
    Ok(code)
}

pub fn choice<'a>(
    body: &'a Value,
    key: &str,
    values: &[&str],
    fallback: &'a str,
) -> Result<&'a str, ApiError> {
    let value = match body.get(key) {
        None | Some(Value::Null) => Some(fallback),
        Some(value) => value.as_str(),
    };
    value.filter(|value| values.contains(value)).ok_or_else(|| {
        ApiError::new(
            StatusCode::BAD_REQUEST,
            format!("{key} must be one of: {}.", values.join(", ")),
        )
    })
}
