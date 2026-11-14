use std::{
    collections::{HashMap, VecDeque},
    net::IpAddr,
    path::PathBuf,
    process::{ExitStatus, Stdio},
    sync::{
        Arc, Mutex as StdMutex,
        atomic::{AtomicU64, AtomicUsize, Ordering},
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use axum::http::{HeaderValue, StatusCode, header};
use serde_json::{Value, json};
use tokio::{
    io::{AsyncRead, AsyncReadExt, AsyncWriteExt},
    process::Command,
    sync::{Mutex, Semaphore, oneshot},
};

use crate::error::ApiError;

const MAX_OUTPUT_BYTES: usize = 1024 * 1024;
const MAX_JOBS_PER_HOUR: usize = 120;
const JOB_WINDOW: Duration = Duration::from_secs(60 * 60);
const MAX_ACTIVE_JOBS_PER_IP: usize = 1;
const RUNNER_STARTED: &str = "rust-lab:runner-started\n";
static NEXT_JOB: AtomicU64 = AtomicU64::new(0);

pub struct Runner {
    image: String,
    runtime: Option<&'static str>,
    enabled: bool,
    disabled_file: PathBuf,
    slots: Arc<Semaphore>,
    admission: Admission,
    version_cache: Mutex<Option<(Instant, Value)>>,
}

struct Admission {
    state: Arc<StdMutex<AdmissionState>>,
}

#[derive(Default)]
struct AdmissionState {
    job_starts: VecDeque<Instant>,
    active_by_ip: HashMap<IpAddr, usize>,
}

struct AdmissionPermit {
    state: Arc<StdMutex<AdmissionState>>,
    address: IpAddr,
}

struct Output {
    status: ExitStatus,
    stdout: String,
    stderr: String,
}

impl Runner {
    pub fn new(
        image: String,
        runtime: Option<&'static str>,
        enabled: bool,
        disabled_file: PathBuf,
    ) -> Self {
        Self {
            image,
            runtime,
            enabled,
            disabled_file,
            slots: Arc::new(Semaphore::new(4)),
            admission: Admission {
                state: Arc::new(StdMutex::new(AdmissionState::default())),
            },
            version_cache: Mutex::new(None),
        }
    }

    pub async fn execute(
        &self,
        code: &str,
        mode: &str,
        optimization: &str,
        client_ip: IpAddr,
    ) -> Result<Value, ApiError> {
        let start = Instant::now();
        let output = self.invoke(mode, optimization, code, client_ip).await?;
        Ok(json!({
            "success": output.status.success(),
            "stdout": output.stdout,
            "stderr": output.stderr,
            "elapsedMs": start.elapsed().as_millis() as u64,
        }))
    }

    pub async fn format(&self, code: &str, client_ip: IpAddr) -> Result<Value, ApiError> {
        let output = self.invoke("format", "debug", code, client_ip).await?;
        Ok(json!({
            "success": output.status.success(),
            "code": if output.status.success() { output.stdout.as_str() } else { code },
            "stdout": "",
            "stderr": output.stderr,
        }))
    }

    pub async fn version(&self, client_ip: IpAddr) -> Result<Value, ApiError> {
        self.ensure_enabled()?;
        let mut cache = self.version_cache.lock().await;
        if let Some((expires, value)) = cache.as_ref()
            && Instant::now() < *expires
        {
            return Ok(value.clone());
        }
        let output = self.invoke("version", "debug", "", client_ip).await?;
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
                "The local runner did not return compiler metadata. Rebuild it with pnpm run runner:build.",
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
            "referenceVersion": "1.100.0", "verifiedAt": "2026-11-13",
        });
        *cache = Some((Instant::now() + Duration::from_secs(300), value.clone()));
        Ok(value)
    }

    async fn invoke(
        &self,
        operation: &str,
        optimization: &str,
        code: &str,
        client_ip: IpAddr,
    ) -> Result<Output, ApiError> {
        self.ensure_enabled()?;
        let permit = self.slots.clone().try_acquire_owned().map_err(|_| {
            ApiError::new(
                StatusCode::TOO_MANY_REQUESTS,
                "All local runner slots are busy. Please retry shortly.",
            )
        })?;
        let admission_permit = self.admission.reserve(client_ip)?;
        let image = self.image.clone();
        let runtime = self.runtime;
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
                let job = run_container(&name, &image, runtime, &args, &code);
                tokio::select! {
                    result = tokio::time::timeout(Duration::from_secs(35), job) => {
                        result.unwrap_or_else(|_| Err(ApiError::new(StatusCode::GATEWAY_TIMEOUT, "Local execution timed out. The container was stopped.")))
                    }
                    _ = sender.closed() => Err(ApiError::new(StatusCode::REQUEST_TIMEOUT, "Request was cancelled.")),
                }
            };
            remove_container(&name).await;
            drop(permit);
            drop(admission_permit);
            let _ = sender.send(result);
        });
        receiver.await.map_err(ApiError::internal)?
    }

    fn ensure_enabled(&self) -> Result<(), ApiError> {
        if !self.enabled {
            return Err(runner_disabled());
        }
        match std::fs::symlink_metadata(&self.disabled_file) {
            Ok(_) => Err(runner_disabled()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(ApiError::internal(error)),
        }
    }
}

impl Admission {
    fn reserve(&self, address: IpAddr) -> Result<AdmissionPermit, ApiError> {
        let now = Instant::now();
        let mut state = self.state.lock().map_err(ApiError::internal)?;
        while state
            .job_starts
            .front()
            .is_some_and(|started| now.duration_since(*started) >= JOB_WINDOW)
        {
            state.job_starts.pop_front();
        }
        if state
            .active_by_ip
            .get(&address)
            .copied()
            .unwrap_or_default()
            >= MAX_ACTIVE_JOBS_PER_IP
        {
            return Err(ApiError::new(
                StatusCode::TOO_MANY_REQUESTS,
                "You already have a runner job in progress. Please wait for it to finish.",
            )
            .with_header(header::RETRY_AFTER, HeaderValue::from_static("40")));
        }
        if state.job_starts.len() >= MAX_JOBS_PER_HOUR {
            let retry_after = state
                .job_starts
                .front()
                .map(|started| {
                    let remaining = JOB_WINDOW.saturating_sub(now.duration_since(*started));
                    remaining.as_secs() + if remaining.subsec_nanos() > 0 { 1 } else { 0 }
                })
                .unwrap_or(1);
            return Err(ApiError::new(
                StatusCode::TOO_MANY_REQUESTS,
                "The shared runner quota is exhausted. Please retry after the hourly limit resets.",
            )
            .with_header(header::RETRY_AFTER, HeaderValue::from(retry_after)));
        }
        state.job_starts.push_back(now);
        state.active_by_ip.insert(address, 1);
        Ok(AdmissionPermit {
            state: self.state.clone(),
            address,
        })
    }
}

impl Drop for AdmissionPermit {
    fn drop(&mut self) {
        if let Ok(mut state) = self.state.lock() {
            state.active_by_ip.remove(&self.address);
        }
    }
}

fn runner_disabled() -> ApiError {
    ApiError::new(
        StatusCode::SERVICE_UNAVAILABLE,
        "The local runner is disabled by the administrator.",
    )
}

#[cfg(test)]
mod tests {
    use std::net::{IpAddr, Ipv4Addr};

    use super::{Admission, AdmissionState, Arc, MAX_JOBS_PER_HOUR, Runner, StdMutex};

    fn admission() -> Admission {
        Admission {
            state: Arc::new(StdMutex::new(AdmissionState::default())),
        }
    }

    #[test]
    fn a_client_can_hold_only_one_active_job() {
        let admission = admission();
        let client: IpAddr = "192.0.2.1".parse().unwrap();
        let permit = admission
            .reserve(client)
            .unwrap_or_else(|_| panic!("first client job should be admitted"));
        assert!(admission.reserve(client).is_err());
        drop(permit);
        assert!(admission.reserve(client).is_ok());
    }

    #[test]
    fn runner_job_quota_is_shared_across_clients() {
        let admission = admission();
        let permits: Vec<_> = (1..=MAX_JOBS_PER_HOUR)
            .map(|last| {
                admission
                    .reserve(IpAddr::V4(Ipv4Addr::new(192, 0, 2, last as u8)))
                    .unwrap_or_else(|_| panic!("job should fit within the global quota"))
            })
            .collect();
        let next_client: IpAddr = "198.51.100.1".parse().unwrap();
        assert!(admission.reserve(next_client).is_err());
        drop(permits);
    }

    #[test]
    fn disable_file_stops_runner_jobs_without_restart() {
        let disabled_file = std::env::temp_dir().join(format!(
            "rust-lab-runner-disabled-{}-{}",
            std::process::id(),
            super::NEXT_JOB.fetch_add(1, super::Ordering::Relaxed)
        ));
        let runner = Runner::new(
            "rust-lab-runner:test".into(),
            None,
            true,
            disabled_file.clone(),
        );
        assert!(runner.ensure_enabled().is_ok());
        std::fs::write(&disabled_file, []).expect("create emergency-disable marker");
        assert!(runner.ensure_enabled().is_err());
        std::fs::remove_file(disabled_file).expect("remove emergency-disable marker");
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
    runtime: Option<&str>,
    args: &[String; 2],
    code: &str,
) -> Result<Output, ApiError> {
    let mut command = docker();
    command.args([
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
    ]);
    if let Some(runtime) = runtime {
        command.args(["--runtime", runtime]);
    }
    let mut child = command
        .arg(image)
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
        "Local Docker runner unavailable. Start Docker with Linux containers and run pnpm run runner:build.",
    )
}
