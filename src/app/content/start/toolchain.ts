import type { Lesson } from '../../course.model';

export const toolchainLesson: Lesson = {
  id: 'toolchain',
  title: 'Rust, rustup, and editions',
  minutes: 18,
  summary:
    'Separate compiler releases, language editions, and project toolchains before writing your first program.',
  objectives: [
    'Explain what rustc, Cargo, and rustup each do',
    'Distinguish a compiler version from an edition',
    'Choose a reproducible local toolchain',
  ],
  sections: [
    {
      title: 'The pieces of the toolchain',
      body: [
        'Rust is a compiled language: source text is checked and translated into a program before that program runs. The compiler, rustc, checks types, ownership, and borrowing as part of that translation. Cargo manages projects and invokes the compiler with the appropriate files and options. rustup installs and selects compiler toolchains. These names describe different responsibilities. A successful Cargo build is evidence that your code passed the compiler checks; it is not evidence that every business rule is correct.',
        'On a local machine, follow the official installation instructions for your operating system. Windows installations may also need the C++ build tools and linker selected by the installer. Check rustc --version, cargo --version, and rustup show after installation. A browser playground already provides a compiler, so you can begin this course without installing anything. Your browser does not execute Rust source directly: it sends the program to a compilation service.',
      ],
    },
    {
      title: 'Versions and editions answer different questions',
      body: [
        'A version identifies one compiler release. Stable, beta, and nightly are release channels. Stable is the default choice for this course; nightly may expose experimental features that can change. An edition selects a compatible collection of language changes for a crate, such as keyword and name-resolution changes. This course uses edition 2024. It does not mean the compiler was released in 2024, and upgrading the compiler does not automatically rewrite a project into a newer edition.',
        'Cargo records the edition in Cargo.toml under the package table. Different crates using different editions can work together. For a team project, a rust-toolchain.toml file can select a specific compiler release and components such as rustfmt and Clippy. The package rust-version field expresses a minimum supported compiler; it is not a command to install that compiler. Keeping these distinctions clear prevents confusing installation failures with source compatibility problems.',
      ],
    },
    {
      title: 'Observe, then change one thing',
      body: [
        'The program below computes a small integer result and prints it. Run it once, predict the result after changing one number, then run it again. This prediction cycle is more valuable than merely collecting working snippets. A compiler error is useful feedback about the program you actually wrote. Read the first error, identify its source location, and make one focused correction before addressing later messages that may be consequences of the first.',
        'The examples intentionally use the standard library and established language features. Later lessons explain dependency manifests, tests, memory management, and concurrency separately. For now, know where your compiler comes from, which edition the project selects, and how to distinguish source code from terminal commands. Never paste a command such as cargo run inside fn main; it belongs in your terminal.',
      ],
    },
  ],
  example: `fn main() {
    let lessons = 5;
    let minutes_each = 12;
    println!("Study plan: {} minutes", lessons * minutes_each);
}`,
  expectedOutput: 'Study plan: 60 minutes',
  exercise: {
    prompt:
      'Print Study plan: 90 minutes by calculating the time for six lessons of fifteen minutes.',
    hint: 'Bind two integers and multiply them inside println!.',
    starter: `fn main() {
    // TODO: calculate six lessons of fifteen minutes.
    println!("Study plan: {} minutes", 0);
}`,
    solution: `fn main() {
    let lessons = 6;
    let minutes_each = 15;
    println!("Study plan: {} minutes", lessons * minutes_each);
}`,
    expectedOutput: 'Study plan: 90 minutes',
  },
  quiz: {
    question: 'What does edition = "2024" select?',
    options: [
      'The exact compiler release',
      'The year the program must execute',
      'The operating system target',
      'A language compatibility edition for the crate',
    ],
    answer: 3,
    explanation:
      'An edition controls edition-specific language behavior. A compiler release and a compilation target are separate choices.',
  },
  references: [
    {
      label: 'Official installation guide',
      url: 'https://doc.rust-lang.org/book/ch01-01-installation.html',
    },
    {
      label: 'The Edition Guide',
      url: 'https://doc.rust-lang.org/edition-guide/editions/index.html',
    },
    { label: 'Toolchain selection', url: 'https://rust-lang.github.io/rustup/overrides.html' },
  ],
  tags: ['rustup', 'rustc', 'Cargo', 'edition 2024'],
};
