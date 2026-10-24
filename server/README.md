# rust-lab backend

The Rust backend uses Axum and Tokio. It serves the Angular production build and compiles, runs, and formats source in disposable local Docker containers. It makes no requests to the public Rust Playground and never runs submitted code directly on the host.

## Setup

Install a stable Rust toolchain, a platform linker, and Docker. On Windows, use the MSVC C++ Build Tools and Docker Desktop in Linux container mode. Start Docker, then run from the repository root:

```sh
npm run runner:build
cargo run --locked -p rust-lab-server
```

The one-time image build downloads the [official Rust image](https://hub.docker.com/_/rust) and installs rustfmt. Subsequent execution, formatting, and metadata lookup require no internet connection. The default image pins Rust 1.99.1. Building the Angular frontend still requires Node.js and its dependencies.

`npm start` starts both Angular on port 4200 and the backend on port 3001. For production, `npm run build` builds the frontend and Rust release binary; `npm run serve` serves both on port 3001. The runner image is built separately. A deployed backend needs the Docker CLI, access to a **local Linux Docker daemon**, and the stable runner image. Select the local Docker context before starting it; the CLI honors Docker's normal context/environment settings.

The runner uses only stable Rust and edition 2024 for execution, tests, and formatting. A missing image or unavailable Docker daemon produces an explicit 503 error with the setup command. Runtime jobs use `--pull=never` and never download images or dependencies automatically.

## Configuration

| Variable          | Default                                            | Purpose                                                               |
| ----------------- | -------------------------------------------------- | --------------------------------------------------------------------- |
| `HOST`            | `127.0.0.1`                                        | Backend bind address                                                  |
| `PORT`            | `3001`                                             | Backend TCP port, 1–65535                                             |
| `STATIC_ROOT`     | `dist/rust-lab/browser` in the build-time checkout | Angular build directory; relative overrides use the working directory |
| `ALLOWED_ORIGINS` | `http://localhost:4200,http://127.0.0.1:4200`      | Additional browser origins; replaces defaults when set                |
| `RUNNER_IMAGE`    | `rust-lab-runner:stable`                           | Stable compiler image                                                 |

Image overrides must use a stable compiler and implement `runner/run.sh`'s entrypoint contract: operation and optimization arguments, edition 2024, the startup marker on stderr, and the internal timeout. Only configure images you trust. Submitted requests cannot select a compiler image, channel, or edition.

## API

POST requests use `Content-Type: application/json`. Errors return an HTTP error status and `{ "success": false, "error": "An explanation" }`. Compilation errors and unsuccessful programs return HTTP 200 with `success: false` and their actual diagnostics.

### `POST /api/execute`

```json
{
  "code": "fn main() { println!(\"Hello, local Rust!\"); }",
  "mode": "run",
  "optimization": "debug"
}
```

Only `code` is required. Defaults are shown above. `mode` accepts `run` or `test`; `optimization` accepts `debug` or `release`. The compiler is stable Rust and the edition is always 2024. Requests containing `channel` or `edition` are rejected with HTTP 400. Returns `success`, `stdout`, `stderr`, and `elapsedMs`. Test mode compiles the submitted source with `rustc --test` as a course feature.

### `POST /api/format`

Accepts `code`. Runs rustfmt with edition 2024 inside a fresh stable Rust container and returns `success`, `code`, `stdout`, and `stderr`. Requests containing `channel` or `edition` are rejected with HTTP 400. Failed formatting preserves the submitted source.

### `GET /api/version`

Runs `rustc --version --verbose` inside the stable runner image and returns `version`, `hash`, `date`, `channel: "stable"`, `edition: "2024"`, `provider: "Local Docker"`, and `execution: "local"`. `referenceVersion` and `verifiedAt` describe the existing curriculum baseline. Successful metadata is cached for five minutes. Restart the backend to refresh immediately after replacing an image.

### `GET /api/health`

Reports backend availability, `provider: "Local Docker"`, `execution: "local"`, and the source-size limit. This does not probe Docker or start a container.

## Isolation and limits

The backend starts one fresh container per execution, formatting, or uncached metadata request:

- Non-root UID/GID 10001, no Linux capabilities, and `no-new-privileges`.
- Networking disabled; no host folders, host namespaces, devices, or Docker socket exposed to the container. Source arrives on standard input, without shell interpolation.
- Read-only root filesystem. `/work` is a 128 MiB tmpfs; `/tmp` is a 32 MiB tmpfs. Neither persists between runs. Shared-memory IPC is disabled.
- One CPU, 512 MiB memory with no extra swap allowance, and at most 128 processes/threads. Each file is limited to 64 MiB and open file descriptors to 256.
- An internal 30-second compilation/execution deadline. The backend allows 35 seconds including Docker startup, then force-removes the named container. HTTP handling has a 45-second deadline.
- A combined 1 MiB stdout/stderr limit. Docker logging is disabled for these containers so output is not retained by the daemon's log driver.
- At most four concurrent jobs. Each permit stays held through cleanup. Cancellation and output overflow trigger container removal; `--rm` removes containers on normal exit. The image's internal deadline also limits jobs if the backend exits unexpectedly.
- Request bodies are limited to 64 KiB and source to 48 KiB. API operations are limited to 30 per client IP per minute. Health and preflight requests are exempt. Forwarded IP headers are not trusted.

Single-file source can use the standard library. Cargo manifests, downloaded crates, interactive stdin, host files, and outbound network access are unavailable.

Docker provides useful isolation for a local learning tool, but shares a kernel and is not a complete hostile-code security boundary. Docker daemon access is powerful: keep this backend local and never mount its Docker socket into runner containers. A public multi-user deployment needs a separately designed isolation boundary, such as dedicated VMs or a sandbox runtime, plus authentication and admission controls. See [Docker runtime controls](https://docs.docker.com/engine/containers/run/) and [Docker security](https://docs.docker.com/engine/security/).

## Code layout

| File                   | Responsibility                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| `src/main.rs`          | Listener and graceful shutdown                                        |
| `src/app.rs`           | API routes and response mapping                                       |
| `src/config.rs`        | Environment settings and input limits                                 |
| `src/runner.rs`        | Docker jobs, output limits, cancellation, cleanup, and metadata cache |
| `src/error.rs`         | JSON responses and errors                                             |
| `src/security.rs`      | Browser-origin and request-rate checks                                |
| `src/validation.rs`    | Bounded JSON parsing and compiler options                             |
| `src/static_files.rs`  | Angular assets and route fallback                                     |
| `../runner/Dockerfile` | Compiler image and internal deadline                                  |
| `../runner/run.sh`     | Fixed compilation, execution, formatting, and metadata commands       |

Use `cargo check --locked`, `cargo clippy --locked -- -D warnings`, and `npm run format:check` for build and style checks. No automated test suite is included.
