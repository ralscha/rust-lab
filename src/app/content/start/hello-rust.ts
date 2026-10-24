import type { Lesson } from '../../course.model';

export const helloRustLesson: Lesson = {
  id: 'hello-rust',
  title: 'Your first program and its output',
  minutes: 16,
  summary:
    'Read a complete Rust program, format values, and understand the compiler-to-executable cycle.',
  objectives: [
    'Identify functions, blocks, statements, and comments',
    'Use Display and Debug formatting',
    'Explain why compilation precedes execution',
  ],
  sections: [
    {
      title: 'Read the structure from the outside in',
      body: [
        'A small executable begins at fn main(). The fn keyword introduces a function, the name identifies it, parentheses contain parameters, and braces delimit its body. The empty parameter list means this main function takes no ordinary Rust arguments. Command-line arguments are obtained through library APIs instead. Indentation makes nesting readable but braces define the structure. Rust identifiers are case sensitive, and function and variable names conventionally use snake_case.',
        'A let statement introduces a binding. A semicolon finishes most statements. A line comment begins with two slashes and extends to the end of the line; block comments use slash-star and star-slash delimiters. Comments explain intent and assumptions but have no runtime behavior. Begin with a small program whose output you can predict, because that gives you a concrete way to check your understanding before adding more syntax.',
      ],
    },
    {
      title: 'Formatting is part of the interface',
      body: [
        'println! is a macro, which the exclamation mark distinguishes from an ordinary function call. It writes formatted text followed by a newline. A pair of braces marks a value to format; named captures can refer directly to local bindings. Ordinary formatting uses the Display trait, intended for human-facing output. The {:?} format uses Debug, useful for inspecting many compound values. A type can support one, both, or neither; later lessons show how traits make that choice explicit.',
        'The format string is checked during compilation. A placeholder without a corresponding argument is an error rather than a surprise at runtime. Use {{ and }} when the output should contain literal braces. Formatting with {:.2} requests two digits after the decimal point for a floating-point value. Formatting changes the text that is printed, not the number stored in memory, so do not confuse display rounding with an arithmetic calculation.',
      ],
    },
    {
      title: 'Follow the whole execution cycle',
      body: [
        'When you run this example, the service first compiles it and then starts the executable. A syntax or type error prevents the program from starting. A runtime panic happens after compilation, while the program executes. Ordinary output and compiler diagnostics are different information streams, even if a playground displays them close together. Learn to identify which phase failed before changing the code.',
        'Try changing a greeting, adding another placeholder, and printing a tuple with Debug. Then deliberately remove a closing parenthesis and inspect the diagnostic before restoring it. These controlled experiments teach the syntax faster than random edits. The exercise asks for exact output so you can notice spaces, punctuation, and newlines. Production programs often test values directly instead of depending on display text, but predictable output is a useful first feedback loop.',
      ],
    },
  ],
  example: `fn main() {
    let language = "Rust";
    let completed = 3;
    println!("Hello, {language}!");
    println!("Progress: {completed}/10");
    println!("Coordinates: {:?}", (2, 5));
    println!("Price: {:.2}", 4.5);
}`,
  expectedOutput: 'Hello, Rust!\nProgress: 3/10\nCoordinates: (2, 5)\nPrice: 4.50',
  exercise: {
    prompt: 'Use a name binding and a score binding to print Ada scored 42 points.',
    hint: 'Named format captures can read local bindings directly.',
    starter: `fn main() {
    let name = "Ada";
    let score = 42;
    // TODO: include both bindings in one sentence.
    println!("{name}: {score}");
}`,
    solution: `fn main() {
    let name = "Ada";
    let score = 42;
    println!("{name} scored {score} points.");
}`,
    expectedOutput: 'Ada scored 42 points.',
  },
  quiz: {
    question: 'Why does println! end with an exclamation mark?',
    options: [
      'It always panics',
      'It is a macro invocation',
      'It runs before compilation',
      'It mutates every argument',
    ],
    answer: 1,
    explanation:
      'The exclamation mark denotes macro invocation. println! expands into code for checked formatting and output.',
  },
  references: [
    { label: 'Hello, World!', url: 'https://doc.rust-lang.org/book/ch01-02-hello-world.html' },
    { label: 'Formatting syntax', url: 'https://doc.rust-lang.org/std/fmt/index.html' },
  ],
  tags: ['main', 'println!', 'formatting', 'syntax'],
};
