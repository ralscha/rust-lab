# rust-lab

An interactive Rust language course built with **Angular**, **TypeScript**, **CodeMirror 6**, and a **Rust backend using Axum and Tokio**. It contains 49 lessons in 11 chapters, from installation and ownership to concurrency, unsafe Rust, and practical capstones.

The course targets **Rust 1.99.1**, the latest stable release verified on **22 October 2026**, and **edition 2024**. The header reads the compiler version from the local Docker runner. Compiler versions and language editions are distinct. The default image pins the compiler to the course version.

## Run locally

Install and start **Docker Desktop with Linux containers** (Windows/macOS), or Docker Engine (Linux). The backend needs access to the Docker CLI and daemon.

Use Node.js, npm or pnpm, and a stable Rust toolchain with Cargo and a platform linker. On Windows, install Visual Studio Build Tools with the **Desktop development with C++** workload for the MSVC toolchain.

```sh
npm ci
npm run runner:build
npm start
```

Open **http://127.0.0.1:4200**. This starts the Angular development server and compiles and starts the Rust API on **127.0.0.1:3001**. Angular proxies `/api` to the backend. Stop both with Ctrl+C. Angular reloads frontend edits automatically; restart after editing the Rust backend. The first start downloads and compiles backend dependencies. Submitted code executes in a new local container for each request.

With pnpm, use `pnpm install --frozen-lockfile`, `pnpm runner:build`, then `pnpm start`. To run the processes separately, use `npm run dev:server` and `npm run dev:client` in two terminals.

The runner image is a one-time build and includes stable Rust 1.99.1 and rustfmt. Execution and formatting always use edition 2024 and work offline once the image is built.

To serve a production build locally:

```sh
npm run build
npm run serve
```

Open **http://127.0.0.1:3001**. The Rust backend serves the Angular files and API. `npm run build` builds both the frontend and release binary; `build:client` and `build:server` build them separately. The binary is `target/release/rust-lab-server` (`.exe` on Windows) and can also be launched directly. Do not run both configurations simultaneously on port 3001.

## Learn and experiment

- Search the curriculum by topic, lesson title, or tag.
- Read each lesson's explanations, objectives, and official references.
- Edit the runnable Rust example in the syntax-aware editor; press **Ctrl+Enter** or **Cmd+Enter** to run it.
- Inspect program output and compiler diagnostics separately. Switch between Run and Test modes and Debug/Release builds. Stable Rust and edition 2024 are fixed.
- Format code with rustfmt, reset an example, or download `main.rs`.
- Try the coding challenge, reveal a hint, and compare against a complete solution. Where a target output is provided, successful output is checked after execution. This checks output, not the general correctness of an algorithm.
- Answer the knowledge check and mark lessons complete at your own pace.
- Code drafts, per-lesson notes, the last visited lesson, and completion state persist in this browser's local storage. They do not sync between devices. A copied lesson link includes only the lesson, not your draft.
- Use the independent Playground for experiments and Field notes for command reminders and authoritative references.

## Course coverage

1. Toolchains, versions and editions, first programs, Cargo, compiler diagnostics, and documentation.
2. Variables, primitive types, functions, expressions, control flow, tuples, and arrays.
3. Ownership, moves, Copy/Clone, borrowing, slices, and lifetime foundations.
4. Structs, methods, enums, exhaustive patterns, Option, Result, and error propagation.
5. Vectors, Unicode strings, maps, iterators, closures, and functional transformations.
6. Generics, traits, associated types, trait objects, lifetimes, and advanced abstraction.
7. Modules, packages, workspaces, features, error design, tests, and project tooling.
8. Box, Rc, Arc, Weak, interior mutability, Deref, Drop, and resource ownership.
9. Threads, channels, shared state, synchronization, atomics, futures, async, and pinning.
10. Macros, unsafe contracts, pointers, FFI, layout, embedded/no_std, and edition changes.
11. Capstones integrating parsing, domain models, abstractions, tests, and application structure.

Every lesson has explanatory sections, a runnable example with its expected output, an exercise starter and solution, a quiz with feedback, and official documentation links. The course is broad language coverage; the full ecosystem and every standard-library API are ongoing study rather than a finite checklist.

## How execution works

```text
Angular browser UI -> local Rust API -> disposable Docker container -> rustc / rustfmt
```

The backend compiles and executes submitted code inside a fresh Linux container built from the [official Rust image](https://hub.docker.com/_/rust). Formatting and compiler metadata also use the local image. Source is passed over standard input and never sent to a public execution service. There is no fallback to native host execution.

Each job runs as an unprivileged user with networking disabled, a read-only root filesystem, all Linux capabilities dropped, and no host directories or Docker socket mounted. Writable files live on bounded temporary filesystems. Each container is limited to one CPU, 512 MiB memory, 128 processes, and 30 seconds; combined output is limited to 1 MiB. The backend stops containers on cancellation, output overflow, or its own deadline. Containers are automatically removed on exit.

The runner supports single-file Rust programs and test harnesses using the standard library. Third-party crates, custom manifests, interactive stdin, persistent files, networking, and multi-file projects are outside this runner's interface. All curated course examples use the standard library.

Docker reduces the impact of mistakes in local experiments, but containers share a kernel and are not a complete security boundary for hostile public workloads. The backend controls Docker and should stay bound to loopback. Do not expose its Docker socket to submitted code. See [server/README.md](server/README.md) for the API contract, configuration, and exact limits.

## Build and formatting

For installation and updates on a Linux server with Caddy and systemd, see [deployment/README.md](deployment/README.md). The deployment script clones, builds, and installs the application at `rust-lab.rasc.ch`.

```sh
npm run build             # Angular production build and Rust release binary
cargo check --locked      # Rust compilation checks without producing a binary
npm run format:check      # Prettier and rustfmt checks
```

The repository has no automated test suites or test runners. Rust testing lessons and the Playground's Test mode are course features.

## Project map

```text
src/app/app.component.*        Page shell and browser event forwarding
src/app/layout/                Header and searchable curriculum sidebar
src/app/features/overview/     Course overview
src/app/features/workspace/    Lesson/playground page layout
src/app/features/lesson/       Reader, quiz, exercise, and notes components
src/app/features/playground/   Editor controls and runner output components
src/app/features/reference/    Field notes and documentation links
src/app/state/                 Course and editor state
src/app/services/              Browser persistence and local runner API transport
src/app/content/index.ts       Ordered course entry point
src/app/content/<chapter>/     Chapter index and one TypeScript file per lesson
src/app/course.model.ts        Typed course/lesson schema
src/app/editor.component.ts    CodeMirror Rust integration
src/styles.css                Stylesheet import order
src/styles/                   Base, shell, feature, and responsive styles
Cargo.toml                    Rust workspace
Cargo.lock                    Locked backend dependencies
server/Cargo.toml             Backend crate and dependencies
server/src/main.rs            Server startup and shutdown
server/src/app.rs             API routes and response mapping
server/src/config.rs          Environment configuration and body/source limits
server/src/error.rs           JSON errors and responses
server/src/security.rs        Browser origins and per-client rate limits
server/src/static_files.rs    Angular assets and client-side route fallback
server/src/validation.rs      JSON, source, and compiler option validation
server/src/runner.rs          Docker job lifecycle, limits, and compiler metadata
runner/                       Local compiler image and container entrypoint
scripts/dev.mjs               Angular and Rust development launcher
```

The lesson content is stored in TypeScript, independent of the presentation. Add a lesson file inside its chapter directory, follow `Lesson` in `course.model.ts`, and import it into that chapter's `index.ts`. Include complete executable examples and a meaningful exercise. Keep IDs stable to preserve saved progress. The small `foundations.ts` and `advanced.ts` files assemble the chapters in order; `content/index.ts` exposes the full course.

View components share the root `LearningStore`, which coordinates navigation, progress, and lesson context. `EditorState` handles execution and cancellation; the storage and API services own persistence and HTTP requests. The root component forwards browser events without owning those responsibilities. Shared styles remain global to preserve the existing layout; edit the matching file under `src/styles/` and put viewport overrides in `responsive.css`.

Run `npm run format` to format the frontend and documentation with Prettier and the backend with rustfmt, or `npm run format:check` to check formatting without changing files.

## Primary references

- [Rust 1.99.1 release](https://github.com/rust-lang/rust/releases/tag/1.99.1)
- [The Rust Programming Language](https://doc.rust-lang.org/book/)
- [The Rust Reference](https://doc.rust-lang.org/reference/)
- [Standard library documentation](https://doc.rust-lang.org/std/)
- [Rust 2024 Edition Guide](https://doc.rust-lang.org/edition-guide/rust-2024/)
- [Angular version compatibility](https://angular.dev/reference/versions)

The explanatory prose is original. References are included for precise semantics and continued study. Interface fonts use Google Fonts when available, with local fallbacks.
