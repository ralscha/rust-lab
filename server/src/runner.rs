use std::{
    process::{ExitStatus, Stdio},
    sync::{
        Arc,
        atomic::{AtomicU64, AtomicUsize, Ordering},
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use axum::http::StatusCode;
use serde_json::{Value, json};
use tokio::{
    io::{AsyncRead, AsyncReadExt, AsyncWriteExt},
    process::Command,
    sync::{Mutex, Semaphore, oneshot},
};

use crate::error::ApiError;

const MAX_OUTPUT_BYTES: usize = 1024 * 1024;
const RUNNER_STARTED: &str = "rust-lab:runner-started\n";
static NEXT_JOB: AtomicU64 = AtomicU64::new(0);

pub struct Runner {
    image: String,
    slots: Arc<Semaphore>,
    version_cache: Mutex<Option<(Instant, Value)>>,
}

struct Output {
    status: ExitStatus,
    stdout: String,
    stderr: String,
}

impl Runner {
    pub fn new(image: String) -> Self {
        Self {
            image,
            slots: Arc::new(Semaphore::new(4)),
            version_cache: Mutex::new(None),
        }
    }

    pub async fn execute(
        &self,
        code: &str,
        mode: &str,
        optimization: &str,
    ) -> Result<Value, ApiError> {
        let start = Instant::now();
        let output = self.invoke(mode, optimization, code).await?;
        Ok(json!({
            "success": output.status.success(),
            "stdout": output.stdout,
            "stderr": output.stderr,
            "elapsedMs": start.elapsed().as_millis() as u64,
        }))
    }

    pub async fn format(&self, code: &str) -> Result<Value, ApiError> {
        let output = self.invoke("format", "debug", code).await?;
        Ok(json!({
            "success": output.status.success(),
            "code": if output.status.success() { output.stdout.as_str() } else { code },
            "stdout": "",
            "stderr": output.stderr,
        }))
    }

    pub async fn version(&self) -> Result<Value, ApiError> {
        let mut cache = self.version_cache.lock().await;
        if let Some((expires, value)) = cache.as_ref()
            && Instant::now() < *expires
        {
            return Ok(value.clone());
        }
        let output = self.invoke("version", "debug", "").await?;
        let field = |name: &str| {
            output
                .stdout
                .lines()
                .find_map(|line| line.strip_prefix(name))
        };
        let version = field("release: ");
        let hash = field("commit-hash: ");
        let date = field("commit-date: ");
        let (Some(version), Some(hash), Some(date)) = (version, hash, date) else {
            return Err(ApiError::new(
                StatusCode::SERVICE_UNAVAILABLE,
                "The local runner did not return compiler metadata. Rebuild it with npm run runner:build.",
            ));
        };
        if !output.status.success() {
            return Err(ApiError::new(
                StatusCode::SERVICE_UNAVAILABLE,
                "The local compiler could not start.",
            ));
        }
        let value = json!({
            "version": version, "hash": hash, "date": date,
            "channel": "stable", "edition": "2024", "provider": "Local Docker", "execution": "local",
            "referenceVersion": "1.99.1", "verifiedAt": "2026-10-22",
        });
        *cache = Some((Instant::now() + Duration::from_secs(300), value.clone()));
        Ok(value)
    }

    async fn invoke(
        &self,
        operation: &str,
        optimization: &str,
        code: &str,
    ) -> Result<Output, ApiError> {
        let permit = self.slots.clone().try_acquire_owned().map_err(|_| {
            ApiError::new(
                StatusCode::TOO_MANY_REQUESTS,
                "All local runner slots are busy. Please retry shortly.",
            )
        })?;
        let image = self.image.clone();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(ApiError::internal)?
            .as_nanos();
        let name = format!(
            "rust-lab-{}-{timestamp}-{}",
            std::process::id(),
            NEXT_JOB.fetch_add(1, Ordering::Relaxed)
        );
        let args = [operation.to_owned(), optimization.to_owned()];
        let code = code.to_owned();
        let (mut sender, receiver) = oneshot::channel();

        // Cleanup outlives the HTTP request. Keep its slot until the container is removed.
        tokio::spawn(async move {
            let result = {
                let job = run_container(&name, &image, &args, &code);
                tokio::select! {
                    result = tokio::time::timeout(Duration::from_secs(35), job) => {
                        result.unwrap_or_else(|_| Err(ApiError::new(StatusCode::GATEWAY_TIMEOUT, "Local execution timed out. The container was stopped.")))
                    }
                    _ = sender.closed() => Err(ApiError::new(StatusCode::REQUEST_TIMEOUT, "Request was cancelled.")),
                }
            };
            remove_container(&name).await;
            drop(permit);
            let _ = sender.send(result);
        });
        receiver.await.map_err(ApiError::internal)?
    }
}

fn docker() -> Command {
    let mut command = Command::new("docker");
    command.kill_on_drop(true);
    #[cfg(windows)]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    command
}

async fn run_container(
    name: &str,
    image: &str,
    args: &[String; 2],
    code: &str,
) -> Result<Output, ApiError> {
    let mut child = docker()
        .args([
            "run",
            "--rm",
            "--init",
            "--interactive",
            "--pull=never",
            "--name",
            name,
            "--label",
            "rust-lab.runner=true",
            "--network=none",
            "--read-only",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges=true",
            "--user=10001:10001",
            "--pids-limit=128",
            "--cpus=1",
            "--memory=512m",
            "--memory-swap=512m",
            "--ulimit=nofile=256:256",
            "--ulimit=fsize=67108864:67108864",
            "--ipc=none",
            "--log-driver=none",
            "--workdir=/work",
            "--tmpfs",
            "/work:rw,exec,nosuid,nodev,size=128m,uid=10001,gid=10001,mode=0700",
            "--tmpfs",
            "/tmp:rw,noexec,nosuid,nodev,size=32m,uid=10001,gid=10001,mode=0700",
            "--env=RUST_BACKTRACE=0",
            image,
        ])
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|_| unavailable())?;
    let mut input = child
        .stdin
        .take()
        .ok_or_else(|| ApiError::internal("Missing runner stdin"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| ApiError::internal("Missing runner stdout"))?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| ApiError::internal("Missing runner stderr"))?;
    let budget = Arc::new(AtomicUsize::new(0));
    let write = async move {
        // Docker can close stdin early when an image or daemon is unavailable.
        let result = input.write_all(code.as_bytes()).await;
        drop(input);
        result
    };
    let read = async {
        let (stdout, stderr, status) = tokio::try_join!(
            read_output(stdout, budget.clone()),
            read_output(stderr, budget),
            async { child.wait().await.map_err(ApiError::internal) },
        )?;
        Ok::<_, ApiError>((stdout, stderr, status))
    };
    let (write_result, result) = tokio::join!(write, read);
    let (stdout, mut stderr, status) = result?;
    if let Some(marker) = stderr.find(RUNNER_STARTED) {
        stderr.replace_range(marker..marker + RUNNER_STARTED.len(), "");
    } else {
        eprintln!("Docker runner failed: {stderr}");
        return Err(unavailable());
    }
    if let Err(error) = write_result
        && status.success()
    {
        return Err(ApiError::internal(error));
    }
    if matches!(status.code(), Some(124 | 137)) {
        stderr.push_str(
            "\nThe runner exited with status 124 or 137. This can indicate a time or memory limit, or a killed process.\n",
        );
    }
    Ok(Output {
        status,
        stdout,
        stderr,
    })
}

async fn read_output(
    mut stream: impl AsyncRead + Unpin,
    budget: Arc<AtomicUsize>,
) -> Result<String, ApiError> {
    let mut output = Vec::new();
    let mut buffer = [0_u8; 8192];
    loop {
        let count = stream.read(&mut buffer).await.map_err(ApiError::internal)?;
        if count == 0 {
            break;
        }
        if budget.fetch_add(count, Ordering::Relaxed) + count > MAX_OUTPUT_BYTES {
            return Err(ApiError::new(
                StatusCode::PAYLOAD_TOO_LARGE,
                "Program output exceeded the 1 MiB limit. Print less output and retry.",
            ));
        }
        output.extend_from_slice(&buffer[..count]);
    }
    Ok(String::from_utf8_lossy(&output).into_owned())
}

async fn remove_container(name: &str) {
    // Retry to cover cancellation while Docker is still creating the container.
    for attempt in 0..3 {
        let result = tokio::time::timeout(
            Duration::from_secs(2),
            docker()
                .args(["rm", "--force", name])
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status(),
        )
        .await;
        if matches!(result, Ok(Ok(status)) if status.success()) {
            return;
        }
        if attempt < 2 {
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
    }
}

fn unavailable() -> ApiError {
    ApiError::new(
        StatusCode::SERVICE_UNAVAILABLE,
        "Local Docker runner unavailable. Start Docker with Linux containers and run npm run runner:build.",
    )
}
