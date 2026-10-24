use std::{collections::HashSet, env, io, path::PathBuf};

pub const MAX_BODY_BYTES: usize = 64 * 1024;
pub const MAX_SOURCE_BYTES: usize = 48 * 1024;

pub struct Config {
    pub host: String,
    pub port: u16,
    pub static_root: PathBuf,
    pub allowed_origins: HashSet<String>,
    pub runner_image: String,
}

impl Config {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        let port = env::var("PORT").unwrap_or_else(|_| "3001".into());
        let port = port
            .parse::<u16>()
            .ok()
            .filter(|port| *port > 0)
            .ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::InvalidInput,
                    "PORT must be a valid TCP port.",
                )
            })?;
        Ok(Self {
            host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".into()),
            port,
            runner_image: env::var("RUNNER_IMAGE")
                .unwrap_or_else(|_| "rust-lab-runner:stable".into()),
            static_root: env::var_os("STATIC_ROOT")
                .map(PathBuf::from)
                .unwrap_or_else(|| {
                    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../dist/rust-lab/browser")
                }),
            allowed_origins: env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:4200,http://127.0.0.1:4200".into())
                .split(',')
                .map(str::trim)
                .filter(|origin| !origin.is_empty())
                .map(str::to_owned)
                .collect(),
        })
    }
}
