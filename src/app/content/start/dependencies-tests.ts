import type { Lesson } from '../../course.model';

export const dependenciesTestsLesson: Lesson = {
  id: 'dependencies-tests',
  title: 'Dependencies, lockfiles, and first tests',
  minutes: 22,
  summary: 'Understand dependency resolution and verify small calculations with assertions.',
  objectives: [
    'Explain dependency requirements and Cargo.lock',
    'Distinguish assertions from a test harness',
    'Write a focused regression check',
  ],
  sections: [
    {
      title: 'Dependencies are explicit project inputs',
      body: [
        'A dependency is another crate that your package uses. Cargo.toml declares version requirements, features, and sometimes alternative sources. Cargo resolves these requirements into concrete versions and records that resolution in Cargo.lock. A requirement is a constraint; a lockfile records a selection. Updating dependencies is a deliberate project change because new code can affect behavior, build requirements, and security. Follow your repository policy for committing the lockfile and review changes instead of deleting it whenever a build fails.',
        'Cargo features are named configuration switches selected at build time. Enabling a dependency feature may expose additional APIs or pull in optional dependencies. They are different from the experimental compiler features that require nightly Rust. For these introductory examples, all functionality comes from the standard library, so you can paste each program into a single-file runner. In a real project, read a dependency’s documentation and license, evaluate maintenance, and add it only when its value justifies the extra dependency.',
      ],
    },
    {
      title: 'Turn expectations into executable checks',
      body: [
        'assert_eq! compares two values and panics with diagnostic information if they differ. assert! checks a Boolean condition. These macros work inside ordinary functions as well as tests, so the example can demonstrate automated checks in a standalone main function. A successful assertion prints nothing by itself. The final message is reached only when every earlier assertion succeeds, making it a simple visible signal for the browser exercise.',
        'In a Cargo project, a function annotated with #[test] is run by cargo test. Such functions often live in a module marked #[cfg(test)], which includes it only in test builds. Test names should describe behavior, and each test should arrange inputs, perform the operation, and compare the result to an independently chosen expectation. Repeating the implementation formula inside the expected value can reproduce the same bug instead of detecting it.',
      ],
    },
    {
      title: 'Test boundaries and preserve discoveries',
      body: [
        'The example tests zero items, one item, and several items. These cases exercise meaningful boundaries for a simple total calculation. For more complex code, include invalid input, empty collections, and behavior around limits. A regression test captures a previously failing scenario so the same mistake is less likely to return. Tests complement the type system: the compiler can reject adding a string to an integer, but it cannot know that your shop intended a discount above a particular quantity.',
        'Run the starter before completing the exercise and compare its result with the stated requirement. Add the requested assertions to expose the incomplete behavior. The starter remains valid Rust; its mathematical result is wrong. Distinguishing a compilation failure from a failed assertion is an important habit. When a test fails, inspect the inputs and expected behavior before changing the test to accept the implementation. A green test suite is useful evidence within the cases it covers, not a proof of all possible behavior.',
      ],
    },
  ],
  example: `fn total_cents(quantity: u32, unit_price: u32) -> u32 {
    quantity * unit_price
}

fn main() {
    assert_eq!(total_cents(0, 250), 0);
    assert_eq!(total_cents(1, 250), 250);
    assert_eq!(total_cents(3, 250), 750);
    println!("All price checks passed");
}`,
  expectedOutput: 'All price checks passed',
  exercise: {
    prompt:
      'Implement square and add assertions for 0, 3, and -4. Print All square checks passed after the checks.',
    hint: 'Multiplying a signed integer by itself makes both 4 and -4 produce 16.',
    starter: `fn square(value: i32) -> i32 {
    // TODO: return the square.
    value
}

fn main() {
    println!("square(3) = {}", square(3));
}`,
    solution: `fn square(value: i32) -> i32 {
    value * value
}

fn main() {
    assert_eq!(square(0), 0);
    assert_eq!(square(3), 9);
    assert_eq!(square(-4), 16);
    println!("All square checks passed");
}`,
    expectedOutput: 'All square checks passed',
  },
  quiz: {
    question: 'What does Cargo.lock record?',
    options: [
      'Only the minimum compiler version',
      'Every source-code edit',
      'Concrete resolved dependency versions',
      'Only test output',
    ],
    answer: 2,
    explanation:
      'The manifest declares requirements; the lockfile records the concrete dependency resolution.',
  },
  references: [
    {
      label: 'Cargo.toml versus Cargo.lock',
      url: 'https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html',
    },
    {
      label: 'Writing automated tests',
      url: 'https://doc.rust-lang.org/book/ch11-01-writing-tests.html',
    },
  ],
  tags: ['dependencies', 'Cargo.lock', 'assertions', 'tests'],
};
