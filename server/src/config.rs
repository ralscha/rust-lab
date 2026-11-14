use std::{collections::HashSet, env, io, path::PathBuf};

pub const MAX_BODY_BYTES: usize = 64 * 1024;
pub const MAX_SOURCE_BYTES: usize = 48 * 1024;

pub struct Config {
    pub host: String,
    pub port: u16,
    pub static_root: PathBuf,
    pub allowed_origins: HashSet<String>,
    pub trust_forwarded_for: bool,
    pub runner_image: String,
    pub runner_runtime: Option<&'static str>,
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
        let runner_runtime = match env::var("RUNNER_RUNTIME") {
            Ok(value) => parse_runner_runtime(Some(&value))?,
            Err(env::VarError::NotPresent) => parse_runner_runtime(None)?,
            Err(error) => return Err(error.into()),
        };
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
            trust_forwarded_for: env::var("TRUST_FORWARDED_FOR").is_ok_and(|value| value == "true"),
            runner_runtime,
        })
    }
}

fn parse_runner_runtime(value: Option<&str>) -> Result<Option<&'static str>, io::Error> {
    match value {
        None | Some("") => Ok(None),
        Some("runsc") => Ok(Some("runsc")),
        Some(_) => Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "RUNNER_RUNTIME must be empty or runsc.",
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::parse_runner_runtime;

    #[test]
    fn runner_runtime_is_optional_or_runsc() {
        assert_eq!(parse_runner_runtime(None).unwrap(), None);
        assert_eq!(parse_runner_runtime(Some("")).unwrap(), None);
        assert_eq!(parse_runner_runtime(Some("runsc")).unwrap(), Some("runsc"));
        assert!(parse_runner_runtime(Some("unknown")).is_err());
    }
}
