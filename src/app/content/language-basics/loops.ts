import type { Lesson } from '../../course.model';

export const loopsLesson: Lesson = {
  id: 'loops',
  title: 'Loops, iteration, and early exits',
  minutes: 22,
  summary: 'Choose for, while, or loop and express termination explicitly.',
  objectives: [
    'Iterate over values and ranges',
    'Use break and continue correctly',
    'Return a value from loop and understand labels',
  ],
  sections: [
    {
      title: 'Choose the loop that communicates intent',
      body: [
        'A for loop consumes an iterator and visits each yielded item. It is the usual choice when processing a collection or a known range because the iterator handles progression and termination. A while loop repeats while a Boolean condition remains true and is useful when the number of iterations depends on changing state. A loop expression repeats until control explicitly exits it, making it suitable for retry logic or a computation that discovers its result over time.',
        'Avoid manually indexing a collection when you only need its values. Direct iteration removes an index variable and many off-by-one opportunities. If both position and value matter, enumerate supplies them together. A range such as 0..3 visits zero, one, and two. Inclusive ranges use ..=. Read the boundary syntax carefully when translating a mathematical description into code.',
      ],
    },
    {
      title: 'Control the current iteration',
      body: [
        'continue skips the remainder of the current iteration and starts the next one. break exits the loop. Put these operations close to the conditions that justify them, and keep the resulting control flow easy to follow. A short continue can make filtering logic clear; a long sequence of nested branches, breaks, and continues may be better expressed as smaller functions or iterator adapters.',
        'A loop can produce a value through break value. The receiving binding then gets the discovered result. A while or for loop does not support an ordinary break value in the same way. When loops are nested, a label such as an apostrophe followed by outer can identify the target of break or continue. Labels solve specific control-flow problems, but they are not a reason to keep an algorithm more deeply nested than necessary.',
      ],
    },
    {
      title: 'Prove that progress happens',
      body: [
        'For every open-ended loop, identify what changes and what will eventually make the stopping condition true. An accidentally infinite loop is still valid Rust and passes type checking. In a browser runner, it may be terminated by a time limit. This operational limit protects the service but is not part of the language semantics. Use small deterministic examples while learning and avoid depending on keyboard input inside this single-file environment.',
        'The example sums only even values and uses loop to discover the first square above a threshold. The exercise asks for a factorial over a small positive input; it also has a natural answer for zero because an empty product is one. Check that edge case after the requested example works. Larger inputs would require an explicit overflow policy or a larger numeric representation, connecting loop correctness with the numeric-type decisions from the previous lesson.',
      ],
    },
  ],
  example: `fn main() {
    let mut total = 0;
    for number in 1..=6 {
        if number % 2 != 0 {
            continue;
        }
        total += number;
    }
    let mut candidate = 1;
    let square = loop {
        if candidate * candidate > 30 {
            break candidate * candidate;
        }
        candidate += 1;
    };
    println!("Even total: {total}");
    println!("First square above 30: {square}");
}`,
  expectedOutput: 'Even total: 12\nFirst square above 30: 36',
  exercise: {
    prompt:
      'Implement factorial for small u32 inputs using a for loop. Print 5! = 120 and assert that factorial(0) is 1.',
    hint: 'Start the product at 1 and multiply each value in 1..=number.',
    starter: `fn factorial(number: u32) -> u32 {
    // TODO: multiply the integers from 1 through number.
    let _ = number;
    1
}

fn main() {
    println!("5! = {}", factorial(5));
}`,
    solution: `fn factorial(number: u32) -> u32 {
    let mut product = 1;
    for factor in 1..=number {
        product *= factor;
    }
    product
}

fn main() {
    assert_eq!(factorial(0), 1);
    println!("5! = {}", factorial(5));
}`,
    expectedOutput: '5! = 120',
  },
  quiz: {
    question: 'What does continue do?',
    options: [
      'Skips to the next loop iteration',
      'Exits the entire function',
      'Returns a value from main',
      'Restarts the executable',
    ],
    answer: 0,
    explanation: 'continue skips the rest of the current iteration. break exits the targeted loop.',
  },
  references: [
    {
      label: 'Repetition with loops',
      url: 'https://doc.rust-lang.org/book/ch03-05-control-flow.html#repetition-with-loops',
    },
    {
      label: 'Loop expressions',
      url: 'https://doc.rust-lang.org/reference/expressions/loop-expr.html',
    },
  ],
  tags: ['for', 'while', 'loop', 'break', 'continue'],
};
