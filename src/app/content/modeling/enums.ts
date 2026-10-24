import type { Lesson } from '../../course.model';

export const enumsLesson: Lesson = {
  id: 'enums',
  title: 'Enums and valid states',
  minutes: 24,
  summary: 'Model alternatives with payloads and let exhaustive matching check your decisions.',
  objectives: [
    'Define unit, tuple, and struct variants',
    'Use exhaustive match expressions',
    'Replace contradictory flags with explicit states',
  ],
  sections: [
    {
      title: 'One value, one alternative',
      body: [
        'An enum defines a type with a finite set of named variants. A value is one variant at a time. Unlike a group of independent Boolean flags, an enum prevents contradictory alternatives from being represented simultaneously. A download can be Idle, Running with progress, or Finished with a file name. Each state can carry exactly the information relevant to it, so the model does not need unrelated optional fields for every possible situation.',
        'Variants can contain no data, positional fields, or named fields. The enum’s type is shared across all variants, allowing a function or collection to work with the alternatives uniformly. Construct a variant with EnumName::VariantName. Rust enums are richer than integer labels found in some other languages: their payloads participate in ownership, borrowing, and cleanup like any other values.',
      ],
    },
    {
      title: 'Match asks you to handle the possibilities',
      body: [
        'A match expression compares a value against patterns and evaluates the first matching arm. Each arm can bind the payload it needs. The compiler checks exhaustiveness, requiring coverage for every possible case. This becomes especially valuable when a new variant is added: existing matches may stop compiling until the new behavior is considered. A wildcard arm can be appropriate, but it also opts out of that future reminder for the cases it catches.',
        'All ordinary arms of a value-producing match must return compatible types. You can return a string description, a number, another enum, or any other suitable value. Matching by value may move owned payloads; matching a reference lets you inspect without consuming the enum. Method receiver types and match input types work together to determine whether you are borrowing or taking ownership.',
      ],
    },
    {
      title: 'Let the model guide the algorithm',
      body: [
        'Good enums describe meaningful domain alternatives rather than arbitrary implementation details. A Message enum can distinguish Quit from Move { x, y } and Text(String), allowing each action to carry its required input. A state machine can limit transitions through methods that consume one state and construct the next. You do not need advanced type-level techniques immediately; even a straightforward enum removes many invalid combinations.',
        'The example uses a delivery status whose variants have different payload shapes. The exercise models a shape and computes its area by matching. Consider what changes when a third shape is introduced: the compiler identifies the decision points that need another branch. That maintenance benefit is one reason exhaustive modeling is useful even when an if chain or string comparison could appear shorter in the first version.',
      ],
    },
  ],
  example: `enum Delivery {
    Preparing,
    InTransit { stops_left: u32 },
    Delivered(String),
}

fn describe(delivery: &Delivery) -> String {
    match delivery {
        Delivery::Preparing => String::from("Preparing"),
        Delivery::InTransit { stops_left } => format!("{stops_left} stops left"),
        Delivery::Delivered(person) => format!("Delivered to {person}"),
    }
}

fn main() {
    for status in [Delivery::Preparing, Delivery::InTransit { stops_left: 2 }, Delivery::Delivered(String::from("Ada"))] {
        println!("{}", describe(&status));
    }
}`,
  expectedOutput: 'Preparing\n2 stops left\nDelivered to Ada',
  exercise: {
    prompt:
      'Implement area for Square(u32) and Rectangle { width, height }. Print 9 and 20 for the supplied shapes.',
    hint: 'Match each variant and bind its dimensions.',
    starter: `enum Shape {
    Square(u32),
    Rectangle { width: u32, height: u32 },
}

fn area(shape: Shape) -> u32 {
    // TODO: handle each variant.
    let _ = shape;
    0
}

fn main() {
    println!("{}", area(Shape::Square(3)));
    println!("{}", area(Shape::Rectangle { width: 4, height: 5 }));
}`,
    solution: `enum Shape {
    Square(u32),
    Rectangle { width: u32, height: u32 },
}

fn area(shape: Shape) -> u32 {
    match shape {
        Shape::Square(side) => side * side,
        Shape::Rectangle { width, height } => width * height,
    }
}

fn main() {
    println!("{}", area(Shape::Square(3)));
    println!("{}", area(Shape::Rectangle { width: 4, height: 5 }));
}`,
    expectedOutput: '9\n20',
  },
  quiz: {
    question: 'What is a key benefit of an exhaustive match over an enum?',
    options: [
      'It silently ignores new variants',
      'It removes all runtime branching',
      'The compiler checks that all possible variants are handled',
      'It makes every payload Copy',
    ],
    answer: 2,
    explanation:
      'Exhaustiveness checking ensures the match covers the possible values, helping reveal missing behavior when variants change.',
  },
  references: [
    {
      label: 'Defining an enum',
      url: 'https://doc.rust-lang.org/book/ch06-01-defining-an-enum.html',
    },
    {
      label: 'The match control flow construct',
      url: 'https://doc.rust-lang.org/book/ch06-02-match.html',
    },
  ],
  tags: ['enum', 'match', 'variants', 'state modeling'],
};
