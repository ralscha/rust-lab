# Server deployment

Deploys `git@github.com:ralscha/rust-lab.git`, branch `main`, to **https://rust-lab.rasc.ch**. The install/update script follows the same clone-and-build workflow as kcal-counter.

| File                  | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| `build-and-deploy.sh` | Clones, builds, installs, checks, and starts a release. |
| `rust-lab.service`    | Runs the Rust backend as the `rust-lab` system user.    |
| `Caddyfile`           | HTTPS site and reverse proxy to `127.0.0.1:3001`.       |

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

The backend service receives Docker access through `SupplementaryGroups=docker`. Docker access is effectively host-administrator access; the application runs user-submitted code, so use a host appropriate for that workload. Existing container limits remain in effect.

## First installation

Copy `build-and-deploy.sh` from this folder to the server. In a root shell with the prerequisites available, run:

```sh
bash ./build-and-deploy.sh
```

It will:

1. Clone `main` into a temporary build directory under `/opt/rust-lab`.
2. Install frontend dependencies with the frozen pnpm lockfile, build Angular, and build the release backend with the locked Cargo dependencies.
3. Build the stable Rust Docker runner with a unique tag for this release.
4. Stage the binary, frontend, and runner image setting in a new release directory.
5. Create the `rust-lab` system account and install the systemd unit.
6. Install `/etc/caddy/sites/rust-lab.caddy`. Add an import to `/etc/caddy/Caddyfile` if the site is not already included, then validate the full Caddy configuration.
7. Switch `/opt/rust-lab/current`, start the backend, check its health/compiler metadata, and compile and run a small Rust program.
8. Reload Caddy, or enable and start it on the first installation.
9. Install the update command at `/usr/local/sbin/deploy-rust-lab`.

Existing Caddy sites stay in the main configuration. An existing glob import that includes the installed site is reused. If `rust-lab.rasc.ch` is already defined in a different file, move that site to `/etc/caddy/sites/rust-lab.caddy` before the first deployment. This file is managed by the deployment script.

## Install a new version

Push the changes to `main`, then run as root:

```sh
deploy-rust-lab
```

To use another branch or clone URL:

```sh
BRANCH=staging deploy-rust-lab
REPO_URL=https://github.com/ralscha/rust-lab.git deploy-rust-lab
```

The current service keeps running while the new version builds. Activation requires a short restart. Concurrent deployments are prevented with a lock. If activation or verification fails, the previous release and configuration files are restored and the previously running service is restarted. Build failures leave the current release active.

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
/var/lib/rust-lab/                           systemd-managed runtime state
/etc/systemd/system/rust-lab.service
/etc/caddy/sites/rust-lab.caddy
/usr/local/sbin/deploy-rust-lab
```

Each release includes its own Docker image setting so a rollback uses the matching runner. Previous release directories and Docker image tags are retained. Remove old versions you no longer need after checking `readlink -f /opt/rust-lab/current`; keep the matching image for any release you may restore. Temporary clone directories are removed automatically.

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

The current backend rate limit is 30 runner requests per minute per connection-source IP. Behind Caddy, visitors share the loopback address and therefore share that limit. Health checks are exempt. The deployment does not change that application behavior.

For manual configuration changes, validate before reloading:

```sh
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy.service
```

Configuration references: [Caddy imports](https://caddyserver.com/docs/caddyfile/directives/import), [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), and [systemd service execution settings](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html).
