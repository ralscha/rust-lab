import type { Lesson } from '../../course.model';

export const compilerWorkflowLesson: Lesson = {
  id: 'compiler-workflow',
  title: 'Read diagnostics and build good habits',
  minutes: 18,
  summary:
    'Use formatting, lints, documentation, and small experiments as part of everyday development.',
  objectives: [
    'Read a diagnostic from its first error',
    'Distinguish rustfmt, Clippy, and compiler checks',
    'Use rustdoc examples and type signatures',
  ],
  sections: [
    {
      title: 'Treat diagnostics as evidence',
      body: [
        'A compiler diagnostic usually identifies a source location, describes the problem, and may suggest a correction. Start with the earliest meaningful error because one missing delimiter can make later lines look broken. Read the expected and found types carefully. If a function expects an integer and receives text, ask where conversion belongs in the program rather than trying random punctuation until the message disappears. Error codes can be explored locally with rustc --explain followed by the code.',
        'A compiler suggestion is a proposed mechanical fix, not a complete explanation of your intent. Adding clone may satisfy ownership rules while introducing an unnecessary allocation; adding a reference may be the appropriate design. Understand the type and ownership boundary before choosing. Reduce confusing code to a small reproduction when needed. The runnable editor is especially useful for isolating one operation from a larger application and testing your prediction about its behavior.',
      ],
    },
    {
      title: 'Use tools with different responsibilities',
      body: [
        'cargo fmt applies rustfmt’s formatting conventions, reducing discussion about whitespace. cargo clippy runs additional lints that can identify suspicious or needlessly complicated code. cargo check performs compiler analysis, and cargo test executes tests. These commands overlap in the files they inspect but answer different questions. A formatted program can still be incorrect, and a program accepted by the compiler can still violate your application’s requirements.',
        'Run formatting automatically and keep compiler warnings visible. An unused variable may indicate unfinished code or a mistaken assumption about which value is used. Prefix a deliberately unused binding with an underscore when that choice is intentional; do not hide warnings globally merely to make output quieter. In a shared repository, follow its documented checks and toolchain version so local results match continuous integration as closely as possible.',
      ],
    },
    {
      title: 'Read API signatures before guessing',
      body: [
        'Standard library documentation explains what methods take, what they return, when they panic, and which examples illustrate normal use. A signature such as fn len(&self) -> usize already tells you that a method borrows its receiver and returns a platform-sized unsigned integer. You will learn these pieces gradually. Documentation comments beginning with three slashes describe public items, and cargo doc can render your crate’s documentation together with dependency documentation.',
        'The example presents a documented pagination function with assertions and predictable output. It divides the nonnegative item count into groups of ten, adding a page only when a remainder exists. This avoids the potential overflow of adding nine before division. A zero item count requires zero pages; twenty-one items require three. This small boundary-aware formula illustrates how an explanation, an implementation, and a test should agree. In the exercise, make the implementation match its plain-language contract and use an assertion to preserve that agreement.',
      ],
    },
  ],
  example: `/// Return the number of pages needed for items, with ten items per page.
fn page_count(items: u32) -> u32 {
    items / 10 + u32::from(items % 10 != 0)
}

fn main() {
    assert_eq!(page_count(0), 0);
    assert_eq!(page_count(21), 3);
    println!("Pages for 21 items: {}", page_count(21));
}`,
  expectedOutput: 'Pages for 21 items: 3',
  exercise: {
    prompt: 'Complete is_even, assert that 8 is even and 7 is not, then print 8 is even: true.',
    hint: 'The remainder operator is %. An even integer has remainder zero when divided by two.',
    starter: `/// Return whether a number is divisible by two.
fn is_even(number: i32) -> bool {
    // TODO: inspect the remainder.
    let _ = number;
    false
}

fn main() {
    println!("8 is even: {}", is_even(8));
}`,
    solution: `/// Return whether a number is divisible by two.
fn is_even(number: i32) -> bool {
    number % 2 == 0
}

fn main() {
    assert!(is_even(8));
    assert!(!is_even(7));
    println!("8 is even: {}", is_even(8));
}`,
    expectedOutput: '8 is even: true',
  },
  quiz: {
    question: 'Which tool primarily standardizes source formatting?',
    options: [
      'The operating system linker',
      'Cargo.lock',
      'rustfmt through cargo fmt',
      'The test harness',
    ],
    answer: 2,
    explanation:
      'rustfmt formats Rust source. Clippy checks additional lints, while tests check program behavior.',
  },
  references: [
    {
      label: 'Compiler error index',
      url: 'https://doc.rust-lang.org/error_codes/error-index.html',
    },
    { label: 'Clippy', url: 'https://doc.rust-lang.org/clippy/' },
    { label: 'rustdoc', url: 'https://doc.rust-lang.org/rustdoc/what-is-rustdoc.html' },
  ],
  tags: ['diagnostics', 'rustfmt', 'Clippy', 'rustdoc'],
};
