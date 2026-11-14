# Server deployment

Deploys `git@github.com:ralscha/rust-lab.git`, branch `main`, to **https://rust-lab.rasc.ch**. The install/update script follows the same clone-and-build workflow as kcal-counter.

| File                  | Purpose                                                        |
| --------------------- | -------------------------------------------------------------- |
| `build-and-deploy.sh` | Clones, builds, installs, checks, and starts a release.        |
| `rust-lab.service`    | Runs the Rust backend as the `rust-lab` system user.           |
| `Caddyfile`           | HTTPS site with Basic Auth, and reverse proxy to `127.0.0.1:3001`. |
| `Caddyfile.public`    | Opt-in public HTTPS site without Basic Auth; deployment-gated on gVisor. |

The Rust backend serves both the Angular frontend and `/api`. Caddy is the public entry point. The runner always uses stable Rust and edition 2024.

## Server prerequisites

Use a Linux server with systemd and these tools available in the **root shell's PATH**:

- Git, curl, a C/C++ linker, and the usual GNU/Linux utilities, including `flock`.
- A Node.js version supported by `package.json`, pnpm 12, and a stable Rust toolchain with Cargo.
- Docker Engine with `docker.service`, a `docker` group, and the local socket `/var/run/docker.sock`.
- Caddy with `caddy.service` and the `caddy` CLI.
- SSH access to `git@github.com:ralscha/rust-lab.git` from the account running the script. Set up its SSH key and GitHub host key before deploying.

The script installs the application, its system account, and service/configuration files. It does not install the build toolchains, Docker, or Caddy.

Point the `rust-lab.rasc.ch` A/AAAA records to this server and allow inbound TCP ports **80** and **443**. Port **3001** stays on loopback. Start Docker before deploying:

```sh
systemctl enable --now docker.service
```

The backend service receives Docker access through `SupplementaryGroups=docker`. Docker access is effectively host-administrator access. The production server is a dedicated Debian 13 VM, and runner containers use gVisor's `runsc` runtime.

## Runner isolation and access

Docker has `runsc` registered as a runtime, and Rust Lab selects it through `/etc/rust-lab/runner-runtime.env`:

```text
RUNNER_RUNTIME=runsc
```

The systemd service reads this administrator-managed file and deployments preserve it. A runner smoke test verifies that Rust jobs execute using the configured runtime.

The backend limits runner work to one active job per client IP and 120 jobs per rolling hour across all clients. It also applies a 30-request-per-minute per-IP limit. The hourly count is in memory and resets when the backend restarts.

Caddy uses Basic Auth by default. Public access is an explicit deployment option:

```sh
PUBLIC_ACCESS=true /opt/rust-lab/deploy-rust-lab
```

The public template is installed only when `PUBLIC_ACCESS=true` is set. Deployment verifies the `runsc` executable, the Docker runtime registration, the runner configuration, and a successful runner job before reloading Caddy. Without this option, deployment installs the authenticated template.

The runner can be disabled immediately without stopping static pages or health checks:

```sh
install -m 0644 /dev/null /etc/rust-lab/runner-disabled
```

The presence of this file blocks new runner requests; a job already in progress may finish. Remove the file to re-enable jobs. `RUNNER_ENABLED=false` in `/etc/rust-lab/runner-runtime.env` disables runner work when the service starts.

## Access credentials

Authenticated mode uses Caddy Basic Auth. Password hashes are kept on the server in `/etc/caddy/auth/rust-lab.users`, which the deployment script does not overwrite. Create the file for authenticated deployments; `caddy hash-password` prompts for the password:

```sh
install -d -m 0750 -o root -g caddy /etc/caddy/auth
printf '%s %s\n' alice "$(caddy hash-password)" > /etc/caddy/auth/rust-lab.users
chown root:caddy /etc/caddy/auth/rust-lab.users
chmod 0640 /etc/caddy/auth/rust-lab.users
```

Each line has the form `username bcrypt-hash`. Append lines for more users. To use the same accounts as go-lab, make one file a symlink to the other. After editing the file outside a deployment, run `systemctl reload caddy.service`. The script requires this file in authenticated mode and checks that it has user lines and is readable by the `caddy` user.

## Install and start

Run `build-and-deploy.sh` as root on the server, with the prerequisites available:

```sh
bash ./build-and-deploy.sh
```

It will:

1. Clone `main` into a temporary build directory under `/opt/rust-lab`.
2. Install frontend dependencies with the frozen pnpm lockfile, build Angular, and build the release backend with the locked Cargo dependencies.
3. Build the stable Rust Docker runner with a unique tag for this release.
4. Stage the binary, frontend, and runner image setting in a new release directory.
5. Create the `rust-lab` system account and install the systemd unit.
6. Install the authenticated or public Caddy site template. Add an import to `/etc/caddy/Caddyfile` if the site is not already included, then validate the full Caddy configuration.
7. Switch `/opt/rust-lab/current`, start the backend, check its health/compiler metadata, and compile and run a small Rust program.
8. Reload Caddy, or enable and start it.
9. Install the update command at `/opt/rust-lab/deploy-rust-lab`.

The Rust Lab site is managed at `/etc/caddy/sites/rust-lab.caddy` and imported by `/etc/caddy/Caddyfile`. Keep the hostname defined in that site only.

## Install a new version

Push the changes to `main`, then run as root:

```sh
/opt/rust-lab/deploy-rust-lab
```

To use another branch or clone URL:

```sh
BRANCH=staging /opt/rust-lab/deploy-rust-lab
REPO_URL=https://github.com/ralscha/rust-lab.git /opt/rust-lab/deploy-rust-lab
```

The service keeps running while a release builds. Activation requires a short restart. A lock prevents concurrent deployments, and the deployment validates the candidate release before switching the active service.

The deployment script refreshes the installed update command after a successful deployment. Customizations to the service or Caddy site should be made in the repository templates because each deployment installs them again.

## Installed paths

```text
/opt/rust-lab/current                         -> active release
/opt/rust-lab/releases/<timestamp>-<commit>.<id>/
  bin/rust-lab-server
  frontend/
  runner.env                                release-specific Docker image
  REVISION                                  full Git commit
/opt/rust-lab/cache/cargo/                    reusable build cache
/opt/rust-lab/deploy-rust-lab                 install/update command
/var/lib/rust-lab/                           systemd-managed runtime state
/etc/systemd/system/rust-lab.service
/etc/caddy/sites/rust-lab.caddy
/etc/caddy/auth/rust-lab.users                Basic Auth users (administrator-managed)
/etc/rust-lab/runner-runtime.env              gVisor runtime setting (administrator-managed)
/etc/rust-lab/runner-disabled                 emergency runner-disable switch (optional)
```

Each release contains the backend, frontend, runner image setting, and source revision. `/opt/rust-lab/current` points to the active release. Temporary build directories are removed automatically.

## Status and troubleshooting

```sh
systemctl status rust-lab.service caddy.service
journalctl -u rust-lab.service -n 100 --no-pager
journalctl -u caddy.service -n 100 --no-pager
curl --fail http://127.0.0.1:3001/api/health
curl --fail http://127.0.0.1:3001/api/version
cat /opt/rust-lab/current/REVISION
```

The deployment check uses local HTTP; DNS and certificate issuance must also work for the public HTTPS URL. If port 3001 is occupied by another process, stop that process before deploying.

The backend applies a 30-request/minute per-IP limit, one active job per IP, and a shared 120-job rolling hourly quota. Health checks are exempt; cached compiler metadata does not consume a job slot. The service sets `TRUST_FORWARDED_FOR=true`, so for connections from loopback the backend uses the rightmost `X-Forwarded-For` entry, which Caddy sets to the real client address. Other connections and other entries in the header are ignored, so clients cannot choose their rate-limit identity. These in-process limits reset when the backend restarts and do not prevent distributed denial of service; use upstream network controls and monitoring as well.

For manual configuration changes, validate before reloading:

```sh
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy.service
```

Configuration references: [Caddy imports](https://caddyserver.com/docs/caddyfile/directives/import), [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), and [systemd service execution settings](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html).
