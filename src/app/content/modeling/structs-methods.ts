import type { Lesson } from '../../course.model';

export const structsMethodsLesson: Lesson = {
  id: 'structs-methods',
  title: 'Structs, methods, and associated functions',
  minutes: 24,
  summary: 'Give related data a name and define operations with clear ownership receivers.',
  objectives: [
    'Define named-field structs',
    'Choose self, &self, or &mut self receivers',
    'Use associated constructors and derive Debug',
  ],
  sections: [
    {
      title: 'Name the concept as well as its fields',
      body: [
        'A struct groups related fields into a new type. Named fields make the meaning of each value explicit at construction and use sites. A rectangle with width and height is easier to understand than a tuple whose positions must be remembered. Rust also supports tuple structs and unit-like structs; choose the form that best communicates the domain rather than treating one representation as universally best.',
        'A struct can own its fields, borrow them through references, or combine both. Starting with owned Strings is often simpler than putting lifetimes on every model. Ownership inside a struct follows the same rules as ownership in local bindings: moving an owned field can partially move the enclosing value, and cloning a struct depends on what its Clone implementation does. A struct’s shape establishes data organization; additional validation may be needed to establish domain invariants.',
      ],
    },
    {
      title: 'Methods express operations on a value',
      body: [
        'An impl block defines methods and associated functions for a type. A method receives self in some form. &self permits inspection through a shared borrow, &mut self permits exclusive mutation, and self consumes the receiver by value. These receiver types communicate the operation’s ownership contract. A method that computes an area naturally borrows; a method that resizes the rectangle needs exclusive access; a conversion that dismantles the rectangle may take ownership.',
        'An associated function without a self parameter is called using Type::function. A constructor named new is a convention rather than a language keyword. Constructors can return a plain value, Option, or Result depending on whether input validation can fail. Field shorthand avoids repeating a local variable name when it matches the field name. Struct update syntax can fill remaining fields from another value, but remember that non-Copy fields may move from that source.',
      ],
    },
    {
      title: 'Make inspection and invariants intentional',
      body: [
        '#[derive(Debug)] asks the compiler to generate a debugging representation when the fields support it. Debug output is helpful during development but is not a stable external serialization format. Derived traits are capabilities selected per type, not automatic behavior shared by every struct. Later lessons explore equality, cloning, and custom trait implementations in more depth.',
        'The example defines a compact counter with a constructor, a read-only method, and a mutating method. The exercise uses the same organization for a rectangle. Consider whether dimensions should be public in a larger library: private fields plus validated constructors can prevent invalid states from being created accidentally. For this introductory calculation, u32 already excludes negative dimensions, while arithmetic overflow remains a separate constraint to consider for untrusted or very large inputs.',
      ],
    },
  ],
  example: `#[derive(Debug)]
struct Counter {
    value: u32,
}

impl Counter {
    fn new() -> Self {
        Self { value: 0 }
    }

    fn increment(&mut self) {
        self.value += 1;
    }

    fn value(&self) -> u32 {
        self.value
    }
}

fn main() {
    let mut counter = Counter::new();
    counter.increment();
    counter.increment();
    println!("Counter: {}", counter.value());
}`,
  expectedOutput: 'Counter: 2',
  exercise: {
    prompt: 'Add an area(&self) method to Rectangle and print Area: 24 for width 6 and height 4.',
    hint: 'Place the method inside impl Rectangle and multiply the two fields.',
    starter: `struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        // TODO: compute area.
        let _ = (self.width, self.height);
        0
    }
}

fn main() {
    let rectangle = Rectangle { width: 6, height: 4 };
    println!("Area: {}", rectangle.area());
}`,
    solution: `struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rectangle = Rectangle { width: 6, height: 4 };
    println!("Area: {}", rectangle.area());
}`,
    expectedOutput: 'Area: 24',
  },
  quiz: {
    question:
      'Which receiver lets a method inspect a value without consuming it or requesting exclusive mutation?',
    options: ['self', '&self', '&mut self', 'No receiver in every case'],
    answer: 1,
    explanation:
      '&self borrows the receiver through a shared reference. self consumes by value, and &mut self requests exclusive access.',
  },
  references: [
    {
      label: 'Defining structs',
      url: 'https://doc.rust-lang.org/book/ch05-01-defining-structs.html',
    },
    { label: 'Method syntax', url: 'https://doc.rust-lang.org/book/ch05-03-method-syntax.html' },
  ],
  tags: ['struct', 'impl', 'methods', 'Self', 'Debug'],
};
