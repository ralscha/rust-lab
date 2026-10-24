use std::{io, path::Path};

use axum::{
    body::Body,
    http::{HeaderValue, Method, StatusCode, header},
    response::Response,
};
use percent_encoding::percent_decode_str;
use tokio::fs;

use crate::error::ApiError;

pub async fn serve(method: &Method, pathname: &str, root: &Path) -> Result<Response, ApiError> {
    if method != Method::GET && method != Method::HEAD {
        return Err(
            ApiError::new(StatusCode::METHOD_NOT_ALLOWED, "Method not allowed.")
                .with_header(header::ALLOW, HeaderValue::from_static("GET, HEAD")),
        );
    }
    let bytes = pathname.as_bytes();
    for (index, byte) in bytes.iter().enumerate() {
        if *byte == b'%'
            && (index + 2 >= bytes.len()
                || !bytes[index + 1].is_ascii_hexdigit()
                || !bytes[index + 2].is_ascii_hexdigit())
        {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Invalid URL encoding.",
            ));
        }
    }
    let decoded = percent_decode_str(pathname)
        .decode_utf8()
        .map_err(|_| ApiError::new(StatusCode::BAD_REQUEST, "Invalid URL encoding."))?;
    if decoded.contains(['\0', '\\', ':']) || decoded.split('/').any(|part| part.starts_with('.')) {
        return Err(inaccessible());
    }
    let mut target = root.join(decoded.trim_start_matches('/'));
    match fs::metadata(&target).await {
        Ok(metadata) if metadata.is_file() => {}
        Ok(_) => target = root.join("index.html"),
        Err(error)
            if matches!(
                error.kind(),
                io::ErrorKind::NotFound | io::ErrorKind::NotADirectory
            ) =>
        {
            if Path::new(decoded.as_ref()).extension().is_some() {
                return Err(ApiError::new(StatusCode::NOT_FOUND, "File not found."));
            }
            target = root.join("index.html");
        }
        Err(error) => return Err(ApiError::internal(error)),
    }
    let (canonical_root, canonical_file) = tokio::try_join!(fs::canonicalize(root), fs::canonicalize(&target))
        .map_err(|error| {
            if error.kind() == io::ErrorKind::NotFound {
                ApiError::new(StatusCode::NOT_FOUND, "Frontend not built. Run npm run build, or open the Angular development server on port 4200.")
            } else {
                ApiError::internal(error)
            }
        })?;
    if !canonical_file.starts_with(canonical_root) {
        return Err(inaccessible());
    }
    let extension = canonical_file
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("");
    let content_type = match extension {
        "html" => "text/html; charset=utf-8",
        "js" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "ico" => "image/x-icon",
        "woff2" => "font/woff2",
        "webp" => "image/webp",
        "txt" => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    };
    let data = fs::read(&canonical_file)
        .await
        .map_err(ApiError::internal)?;
    let size = data.len();
    let mut response = Response::new(if method == Method::HEAD {
        Body::empty()
    } else {
        Body::from(data)
    });
    let headers = response.headers_mut();
    headers.insert(header::CONTENT_TYPE, HeaderValue::from_static(content_type));
    headers.insert(header::CONTENT_LENGTH, HeaderValue::from(size));
    headers.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static(if extension == "html" {
            "no-cache"
        } else {
            "public, max-age=3600"
        }),
    );
    Ok(response)
}

fn inaccessible() -> ApiError {
    ApiError::new(StatusCode::FORBIDDEN, "This path is not accessible.")
}
