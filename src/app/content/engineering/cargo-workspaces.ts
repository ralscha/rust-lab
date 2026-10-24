import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const cargoWorkspacesLesson: Lesson = {
  id: 'cargo-workspaces',
  title: 'Cargo, features, workspaces, and editions',
  minutes: 24,
  summary:
    'Manage dependencies and build configurations, then plan a deliberate Rust 2024 migration.',
  objectives: [
    'Explain lockfiles and dependency requirements',
    'Treat features as additive capabilities',
    'Distinguish a compiler release, edition, and minimum Rust version',
  ],
  sections: [
    section(
      'A reproducible project graph',
      `Cargo.toml declares package metadata, targets, dependency requirements, and build settings. Cargo.lock records the dependency versions selected for a particular resolution. A version requirement is not itself a lock: compatible updates may be selected during resolution. Commit the lockfile for reproducible applications and follow your project's policy for library packages. cargo check type-checks without producing the final executable, cargo build creates artifacts, and cargo run builds and launches a binary.

A workspace groups related packages under one manifest and coordinates a shared lockfile and target directory. Members can depend on one another through path dependencies while developing together. Separate a library crate when it creates a meaningful API or build boundary, rather than because a directory has become large. Package names, library crate names, and module names are related conventions, not interchangeable concepts.`,
    ),
    section(
      'Features add capabilities',
      `Cargo features select optional capabilities and dependencies. They are generally unified additively when packages in the graph request them. Therefore a feature should usually enable something rather than mean disable something; two downstream users can request different feature sets at the same time. Use cfg attributes to include or exclude code and cfg! when you need a boolean expression. Code inside an ordinary if cfg!(...) branch must still type-check because cfg! does not remove the branch.

Test the supported combinations of default features, minimal features, and important optional capabilities. Avoid treating --all-features as proof that every valid configuration works. Build scripts execute during builds and can generate code or locate native libraries. Procedural macros also execute at compile time. Evaluate dependencies as executable parts of your build process, and keep application behavior independent of accidental local machine settings.`,
    ),
    section(
      'Stable 1.99.1 and edition 2024',
      `This course targets the latest verified stable compiler, Rust 1.99.1, with edition 2024. A compiler release adds implementations and library APIs; an edition opts a crate into a coordinated set of language rules. Dependencies using older editions can coexist with your edition-2024 crate. The rust-version manifest field declares the compiler version your package intends to support, which may be lower than the compiler currently installed.

For an existing crate, start from passing checks, run cargo fix --edition, review the changes, then update the edition and rerun tests. Rust 2024 includes changes involving match ergonomics, temporary scopes, return-position impl Trait lifetime capture, the reserved gen keyword, and explicit unsafe boundaries. Automatic migration cannot establish that an unsafe contract is correct. Read the edition guide for code patterns your project uses, and verify your claimed minimum supported compiler in CI. The example below demonstrates conditional compilation without requiring files beyond main.rs.`,
    ),
    section(
      'A workspace manifest to use locally',
      `The browser executes one source file. Create these manifests in a local multi-package project when practicing workspace design. In a member package, use edition = "2024" under [package], and add dependencies under [dependencies]. The explicit resolver makes workspace dependency behavior clear even when the root manifest is virtual.`,
      `[workspace]\nmembers = ["core", "cli"]\nresolver = "3"\n\n[workspace.package]\nedition = "2024"\nrust-version = "1.99"`,
    ),
  ],
  example: rust`#[cfg(debug_assertions)]
fn build_kind() -> &'static str { "debug" }
#[cfg(not(debug_assertions))]
fn build_kind() -> &'static str { "release" }
fn main() {
    assert!(matches!(build_kind(), "debug" | "release"));
    println!("conditional implementation selected");
    println!("byte width: {}", u8::BITS);
}`,
  expectedOutput: 'conditional implementation selected\nbyte width: 8\n',
  exercise: {
    prompt:
      'Use cfg attributes to provide a supported() function for 32-bit and 64-bit pointer targets, plus a fallback for other targets. Print whether the current target is supported.',
    hint: 'Combine cfg(target_pointer_width = "32") and cfg(target_pointer_width = "64") with any. Use not(any(...)) for the fallback.',
    starter: rust`fn supported() -> bool { false }
fn main() { println!("supported: {}", supported()); }`,
    solution: rust`#[cfg(any(target_pointer_width = "32", target_pointer_width = "64"))]
fn supported() -> bool { true }
#[cfg(not(any(target_pointer_width = "32", target_pointer_width = "64")))]
fn supported() -> bool { false }
fn main() { println!("supported: {}", supported()); }`,
    expectedOutput: 'supported: true\n',
  },
  quiz: {
    question:
      'What happens when two dependencies request different additive features of the same resolved package?',
    options: [
      'Cargo always builds only the first request',
      'All features are disabled',
      'Requested features are generally unified',
      'Their Rust editions must become identical',
    ],
    answer: 2,
    explanation:
      'Feature unification combines requested capabilities, so feature design should account for additive use.',
  },
  references: [
    reference('Cargo: features', 'https://doc.rust-lang.org/cargo/reference/features.html'),
    reference('Cargo: workspaces', 'https://doc.rust-lang.org/cargo/reference/workspaces.html'),
    reference(
      'Edition Guide: Rust 2024',
      'https://doc.rust-lang.org/edition-guide/rust-2024/index.html',
    ),
  ],
  tags: ['Cargo', 'features', 'workspaces', 'edition 2024'],
};
