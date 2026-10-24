mod app;
mod config;
mod error;
mod runner;
mod security;
mod static_files;
mod validation;

use std::net::SocketAddr;

use config::Config;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::from_env()?;
    let listener = TcpListener::bind((config.host.as_str(), config.port)).await?;
    let address = listener.local_addr()?;
    let router = app::router(config);
    println!("rust-lab server: http://{address} (execution: local Docker)");
    axum::serve(
        listener,
        router.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;
    Ok(())
}

async fn shutdown_signal() {
    let interrupt = async {
        if let Err(error) = tokio::signal::ctrl_c().await {
            eprintln!("Cannot listen for Ctrl+C: {error}");
        }
    };
    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(error) => eprintln!("Cannot listen for SIGTERM: {error}"),
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();
    tokio::select! {
        () = interrupt => {},
        () = terminate => {},
    }
}
