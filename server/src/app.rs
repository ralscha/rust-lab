use std::{net::SocketAddr, path::PathBuf, sync::Arc, time::Duration};

use axum::{
    Router,
    extract::{ConnectInfo, Request, State},
    http::{HeaderValue, Method, StatusCode, header},
    response::{IntoResponse, Response},
};
use serde_json::json;

use crate::{
    config::{Config, MAX_SOURCE_BYTES},
    error::{ApiError, json_response},
    runner::Runner,
    security::Security,
    static_files,
    validation::{choice, read_json, source},
};

struct AppState {
    static_root: PathBuf,
    security: Security,
    runner: Runner,
}

pub fn router(config: Config) -> Router {
    let state = Arc::new(AppState {
        static_root: config.static_root,
        security: Security::new(config.allowed_origins),
        runner: Runner::new(config.runner_image),
    });
    Router::new().fallback(handle).with_state(state)
}

async fn handle(
    State(state): State<Arc<AppState>>,
    ConnectInfo(address): ConnectInfo<SocketAddr>,
    request: Request,
) -> Response {
    let path = request.uri().path();
    let is_api = path == "/api" || path.starts_with("/api/");
    let origin = if is_api {
        state.security.check_origin(request.headers())
    } else {
        Ok(None)
    };
    let (mut response, origin) = match origin {
        Err(error) => (error.into_response(), None),
        Ok(origin) => {
            let response = tokio::time::timeout(
                Duration::from_secs(45),
                dispatch(&state, address, request, is_api),
            )
            .await;
            let response = match response {
                Ok(Ok(response)) => response,
                Ok(Err(error)) => error.into_response(),
                Err(_) => {
                    ApiError::new(StatusCode::REQUEST_TIMEOUT, "Request timed out.").into_response()
                }
            };
            (response, origin)
        }
    };
    let headers = response.headers_mut();
    headers.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        "referrer-policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert("x-frame-options", HeaderValue::from_static("DENY"));
    if let Some(origin) = origin {
        headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, origin);
        headers.insert(header::VARY, HeaderValue::from_static("Origin"));
    }
    response
}

async fn dispatch(
    state: &AppState,
    address: SocketAddr,
    request: Request,
    is_api: bool,
) -> Result<Response, ApiError> {
    let path = request.uri().path();
    let method = request.method();
    if !is_api {
        return static_files::serve(method, path, &state.static_root).await;
    }
    if method == Method::OPTIONS {
        return Ok((
            StatusCode::NO_CONTENT,
            [
                (header::ACCESS_CONTROL_ALLOW_METHODS, "GET, POST, OPTIONS"),
                (header::ACCESS_CONTROL_ALLOW_HEADERS, "Content-Type"),
            ],
        )
            .into_response());
    }
    let valid_method = match path {
        "/api/health" | "/api/version" => "GET",
        "/api/execute" | "/api/format" => "POST",
        _ => {
            return Err(ApiError::new(
                StatusCode::NOT_FOUND,
                "API endpoint not found.",
            ));
        }
    };
    if method.as_str() != valid_method {
        return Err(
            ApiError::new(StatusCode::METHOD_NOT_ALLOWED, "Method not allowed.")
                .with_header(header::ALLOW, HeaderValue::from_static(valid_method)),
        );
    }
    if path == "/api/health" {
        return Ok(json_response(json!({
            "ok": true,
            "provider": "Local Docker",
            "execution": "local",
            "maxSourceBytes": MAX_SOURCE_BYTES,
        })));
    }
    state.security.check_rate(address.ip())?;
    if path == "/api/version" {
        return Ok(json_response(state.runner.version().await?));
    }
    let execute = path == "/api/execute";
    let body = read_json(request).await?;
    let code = source(&body)?;
    if body.get("channel").is_some() || body.get("edition").is_some() {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "The runner uses stable Rust and edition 2024. Channel and edition cannot be configured.",
        ));
    }
    if execute {
        let mode = choice(&body, "mode", &["run", "test"], "run")?;
        let optimization = choice(&body, "optimization", &["debug", "release"], "debug")?;
        Ok(json_response(
            state.runner.execute(code, mode, optimization).await?,
        ))
    } else {
        Ok(json_response(state.runner.format(code).await?))
    }
}
