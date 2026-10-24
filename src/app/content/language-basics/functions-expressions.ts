import type { Lesson } from '../../course.model';

export const functionsExpressionsLesson: Lesson = {
  id: 'functions-expressions',
  title: 'Functions and expression-oriented code',
  minutes: 20,
  summary:
    'Write functions with explicit contracts and understand why a trailing semicolon matters.',
  objectives: [
    'Declare typed parameters and return values',
    'Distinguish statements from expressions',
    'Use block expressions and early returns',
  ],
  sections: [
    {
      title: 'A signature is a compact contract',
      body: [
        'A function names a reusable operation. Parameters declare the values it receives, including their types, and an arrow introduces its return type. Rust generally requires explicit parameter and return types at function boundaries while inferring local details inside the body. This division makes interfaces readable without filling every local binding with annotations. A caller can understand what to provide and what to expect before reading the implementation.',
        'Function names conventionally use snake_case and should describe the operation. Prefer parameters that represent the minimum information required. A function calculating a rectangle’s area can take two lengths instead of an entire application state. This makes it easier to test and reuse. Types express some requirements, but documentation or validation may still be needed for constraints such as a maximum supported dimension or a nonempty input.',
      ],
    },
    {
      title: 'Expressions produce values',
      body: [
        'A literal, function call, arithmetic operation, if expression, or block can produce a value. A let statement introduces a binding and does not itself provide the assigned value as a useful expression result. The last expression in a block becomes that block’s value when it has no terminating semicolon. This is why a function returning an integer often ends with width * height instead of an explicit return statement.',
        'Adding a semicolon turns that final expression into a statement, leaving the block with the unit value (). If the declared return type is i32, the compiler then reports a mismatch between i32 and (). Unit is a real type with one value and commonly represents successful completion without a separate result. A function with no written return type returns unit. The distinction is syntactic but important: punctuation affects the value a block computes.',
      ],
    },
    {
      title: 'Use early returns to simplify exceptional paths',
      body: [
        'return exits the current function immediately and can provide its return value. It is useful for short guard clauses that handle invalid or special inputs before the main computation. The ordinary successful path often reads naturally as the final expression. There is no universal rule that one style is always better; use whichever makes the flow and result easiest to understand.',
        'The example uses a block expression to name an intermediate width while producing only its final area. That binding is local to the block, so it cannot accidentally be used later. The exercise uses an early return for a zero denominator and a normal expression for valid input. Its sentinel result is deliberately simple; in later lessons you will replace ambiguous sentinel values with Option and Result so the type distinguishes absence or failure from a legitimate numeric answer.',
      ],
    },
  ],
  example: `fn area(width: u32, height: u32) -> u32 {
    width * height
}

fn main() {
    let result = {
        let width = 6;
        area(width, 4)
    };
    println!("Area: {result}");
}`,
  expectedOutput: 'Area: 24',
  exercise: {
    prompt:
      'Implement safe_ratio: return 0.0 when the denominator is zero; otherwise return numerator / denominator. Print 2.5 and 0.0 on separate lines.',
    hint: 'An early return handles the zero case. Leave the final division without a semicolon.',
    starter: `fn safe_ratio(numerator: f64, denominator: f64) -> f64 {
    // TODO: handle zero, then compute the ratio.
    let _ = (numerator, denominator);
    0.0
}

fn main() {
    println!("{:.1}", safe_ratio(5.0, 2.0));
    println!("{:.1}", safe_ratio(5.0, 0.0));
}`,
    solution: `fn safe_ratio(numerator: f64, denominator: f64) -> f64 {
    if denominator == 0.0 {
        return 0.0;
    }
    numerator / denominator
}

fn main() {
    println!("{:.1}", safe_ratio(5.0, 2.0));
    println!("{:.1}", safe_ratio(5.0, 0.0));
}`,
    expectedOutput: '2.5\n0.0',
  },
  quiz: {
    question:
      'What value does a block normally produce if all of its expressions end in semicolons?',
    options: [
      'The last integer it mentioned',
      'An empty String',
      'A compiler-selected value',
      'The unit value ()',
    ],
    answer: 3,
    explanation:
      'A block without a final value expression normally evaluates to unit, unless control flow diverges.',
  },
  references: [
    { label: 'Functions', url: 'https://doc.rust-lang.org/book/ch03-03-how-functions-work.html' },
    {
      label: 'Block expressions',
      url: 'https://doc.rust-lang.org/reference/expressions/block-expr.html',
    },
  ],
  tags: ['functions', 'expressions', 'unit', 'return'],
};
