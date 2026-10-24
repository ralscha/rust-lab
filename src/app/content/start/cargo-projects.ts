import type { Lesson } from '../../course.model';

export const cargoProjectsLesson: Lesson = {
  id: 'cargo-projects',
  title: 'Cargo projects, packages, and crates',
  minutes: 20,
  summary:
    'Understand project layout and choose the right Cargo command while keeping examples runnable.',
  objectives: [
    'Distinguish a package from a crate',
    'Read the essential Cargo.toml fields',
    'Use check, build, run, and release profiles',
  ],
  sections: [
    {
      title: 'A project has source and a manifest',
      body: [
        'Locally, cargo new temperature creates a directory containing a Cargo.toml manifest and src/main.rs. The manifest describes a package: its name, version, edition, dependencies, and optional configuration. The source file is the root of a binary crate. A crate is a compilation unit; a package is a Cargo organizational unit that can contain one library crate and multiple binary crates. Keeping these terms distinct becomes useful when you split reusable code from a command-line interface.',
        'A library crate conventionally begins at src/lib.rs and exposes items that another crate can use. A binary crate has an entry point and produces an executable. A package can contain both. Additional executables can live under src/bin. A workspace groups packages under shared configuration and dependency resolution. You do not need a workspace for a first project; start with a single package and introduce additional boundaries when there is a clear ownership or reuse reason.',
      ],
    },
    {
      title: 'Use the cheapest useful feedback',
      body: [
        'cargo check analyzes the program without producing a final executable, making it useful during frequent edits. cargo build produces build artifacts, normally under target/debug. cargo run builds as needed and runs the executable. cargo build --release uses the release profile, whose defaults include stronger optimization. Optimization can substantially affect performance, so measure production performance using an appropriate release configuration rather than drawing conclusions from a development build.',
        'Cargo tracks inputs and reuses completed work when it can. It is usually unnecessary to clean the project after each edit. Run cargo clean when you actually need to remove build artifacts, not as a routine debugging ritual. Cargo commands operate on a manifest found from the working directory, so verify which project you are in when a command reports an unexpected package name. Terminal commands belong outside Rust source files.',
      ],
    },
    {
      title: 'Separate reusable logic from presentation',
      body: [
        'The example keeps a conversion function separate from main. Even in one file, this creates a useful boundary: the function transforms a value, while main decides how to display the result. As an application grows, the function can move into a library crate without changing its essential job. Small, explicit inputs and outputs make code easier to test than functions that mix calculation, file access, and presentation.',
        'The browser editor represents one source file, so it cannot demonstrate every Cargo directory layout directly. You can still practice the same architecture by writing helper functions above main. On your machine, create a package, put the example into src/main.rs, and run cargo check followed by cargo run. Then modify the conversion function and observe that Cargo rebuilds what changed. Treat the generated manifest as project configuration you should understand, not mysterious boilerplate.',
      ],
    },
  ],
  example: `fn celsius_to_fahrenheit(celsius: f64) -> f64 {
    celsius * 9.0 / 5.0 + 32.0
}

fn main() {
    println!("20 C = {:.1} F", celsius_to_fahrenheit(20.0));
}`,
  expectedOutput: '20 C = 68.0 F',
  exercise: {
    prompt: 'Implement a kilometers_to_meters helper and print 2.5 km = 2500 m.',
    hint: 'Use f64 inputs and multiply by 1000.0. Format meters with zero decimal places.',
    starter: `fn kilometers_to_meters(kilometers: f64) -> f64 {
    // TODO: convert the input.
    kilometers
}

fn main() {
    println!("2.5 km = {:.0} m", kilometers_to_meters(2.5));
}`,
    solution: `fn kilometers_to_meters(kilometers: f64) -> f64 {
    kilometers * 1000.0
}

fn main() {
    println!("2.5 km = {:.0} m", kilometers_to_meters(2.5));
}`,
    expectedOutput: '2.5 km = 2500 m',
  },
  quiz: {
    question: 'Which command checks types without producing the final executable?',
    options: ['cargo check', 'cargo clean', 'cargo new', 'rustup update'],
    answer: 0,
    explanation:
      'cargo check runs the relevant compiler checks while skipping final executable generation.',
  },
  references: [
    { label: 'Hello, Cargo!', url: 'https://doc.rust-lang.org/book/ch01-03-hello-cargo.html' },
    {
      label: 'Cargo package layout',
      url: 'https://doc.rust-lang.org/cargo/guide/project-layout.html',
    },
    { label: 'Cargo profiles', url: 'https://doc.rust-lang.org/cargo/reference/profiles.html' },
  ],
  tags: ['Cargo', 'packages', 'crates', 'profiles'],
};
