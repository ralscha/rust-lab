import type { Lesson } from '../../course.model';

export const patternsLesson: Lesson = {
  id: 'patterns',
  title: 'Patterns, guards, and concise matching',
  minutes: 25,
  summary: 'Destructure data precisely and choose between match, if let, while let, and let else.',
  objectives: [
    'Destructure tuples, structs, and enums',
    'Use guards, alternatives, and ranges',
    'Apply let else for early exit',
  ],
  sections: [
    {
      title: 'Patterns describe shapes of values',
      body: [
        'A pattern can match a literal, bind a name, destructure a compound value, or ignore parts you do not need. You already use patterns in let bindings and function parameters: let (x, y) = point destructures a tuple. A pattern that always matches the expected type is irrefutable. A pattern such as Some(value) is refutable because None is another possibility, so it needs a construct that handles failure to match.',
        'In match, patterns can include ranges, alternatives separated by a vertical bar, and nested destructuring. An underscore ignores a value without binding it. A name beginning with an underscore still creates a binding and can therefore move a non-Copy value; that differs from the wildcard underscore. The .. pattern can ignore remaining fields where supported, keeping attention on the information relevant to the branch.',
      ],
    },
    {
      title: 'Add conditions without hiding structure',
      body: [
        'A match guard is an if condition attached to an arm. It is useful when matching the structure is not sufficient, such as accepting a coordinate only when x equals y. Guards are evaluated after the pattern matches. Because arbitrary guard conditions do not establish exhaustive coverage, you normally still need a fallback arm for values that fail the guard. Order matters because the first arm whose pattern and guard succeed is selected.',
        'The @ binding operator lets you give a name to a value while also checking it against another pattern. This is useful for a numeric range you both validate and print. Do not turn every decision into a complicated pattern puzzle; use a small helper function when it communicates the predicate more clearly. Pattern matching should expose the shape of data, not obscure the application’s rule.',
      ],
    },
    {
      title: 'Use the smallest construct that expresses the branches',
      body: [
        'if let handles one interesting pattern with an optional else. while let repeats while a pattern keeps matching, such as popping values until a collection is empty. let else binds a successful pattern and requires the else branch to diverge, commonly through return, break, or panic. This makes it useful for early exits while keeping the successful path at the surrounding indentation level.',
        'The example uses let else to handle a missing configuration value, then a guarded match to classify parsed data. The exercise extracts the first item of a slice and returns early when empty. Notice that the success bindings remain in scope after let else. Compare this with an if let block, where the bindings are local to that branch. Selecting the appropriate construct makes both the happy path and the exceptional path easier to read.',
      ],
    },
  ],
  example: `fn classify(input: Option<i32>) -> &'static str {
    let Some(number) = input else {
        return "missing";
    };
    match number {
        0 => "zero",
        1..=9 => "small positive",
        value if value < 0 => "negative",
        _ => "large positive",
    }
}

fn main() {
    println!("{}", classify(None));
    println!("{}", classify(Some(4)));
    println!("{}", classify(Some(-2)));
}`,
  expectedOutput: 'missing\nsmall positive\nnegative',
  exercise: {
    prompt:
      'Implement first_label using let Some(value) = values.first() else to return "empty" for an empty slice and the first number as text otherwise.',
    hint: 'The else branch must return. On success, value.to_string() produces a String.',
    starter: `fn first_label(values: &[i32]) -> String {
    // TODO: return early when there is no first value.
    let _ = values;
    String::from("empty")
}

fn main() {
    println!("{}", first_label(&[]));
    println!("{}", first_label(&[7, 8]));
}`,
    solution: `fn first_label(values: &[i32]) -> String {
    let Some(value) = values.first() else {
        return String::from("empty");
    };
    value.to_string()
}

fn main() {
    println!("{}", first_label(&[]));
    println!("{}", first_label(&[7, 8]));
}`,
    expectedOutput: 'empty\n7',
  },
  quiz: {
    question: 'What must the else branch of let else do?',
    options: [
      'Produce a default value and continue normally',
      'Always panic',
      'Declare another let binding',
      'Diverge, for example by returning',
    ],
    answer: 3,
    explanation:
      'The else branch must leave the current control-flow path, ensuring the successful pattern bindings exist afterward.',
  },
  references: [
    { label: 'Pattern syntax', url: 'https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html' },
    { label: 'Concise control flow', url: 'https://doc.rust-lang.org/book/ch06-03-if-let.html' },
    {
      label: 'let statements',
      url: 'https://doc.rust-lang.org/reference/statements.html#let-statements',
    },
  ],
  tags: ['patterns', 'guards', 'if let', 'while let', 'let else'],
};
