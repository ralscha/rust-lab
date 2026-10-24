use axum::{
    Json,
    http::{HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
};
use serde_json::{Value, json};

pub struct ApiError {
    status: StatusCode,
    message: String,
    headers: Vec<(header::HeaderName, HeaderValue)>,
}

impl ApiError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
            headers: Vec::new(),
        }
    }

    pub fn with_header(mut self, name: header::HeaderName, value: HeaderValue) -> Self {
        self.headers.push((name, value));
        self
    }

    pub fn internal(error: impl std::fmt::Display) -> Self {
        eprintln!("Server error: {error}");
        Self::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "The server encountered an unexpected error.",
        )
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut response = json_response(json!({ "success": false, "error": self.message }));
        *response.status_mut() = self.status;
        response.headers_mut().extend(self.headers);
        response
    }
}

pub fn json_response(value: Value) -> Response {
    (
        [
            (header::CACHE_CONTROL, "no-store"),
            (header::CONTENT_TYPE, "application/json; charset=utf-8"),
        ],
        Json(value),
    )
        .into_response()
}
