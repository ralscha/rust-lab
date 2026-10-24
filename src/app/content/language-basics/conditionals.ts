import type { Lesson } from '../../course.model';

export const conditionalsLesson: Lesson = {
  id: 'conditionals',
  title: 'Conditions, Boolean logic, and ranges',
  minutes: 18,
  summary: 'Make decisions with Boolean conditions and use if as a value-producing expression.',
  objectives: [
    'Combine comparisons with short-circuit Boolean operators',
    'Return values from if branches',
    'Recognize exclusive and inclusive ranges',
  ],
  sections: [
    {
      title: 'Conditions must be Boolean',
      body: [
        'An if expression chooses a branch using a bool. Rust does not implicitly treat zero, empty strings, or empty collections as false. Write the condition you mean, such as count != 0 or !items.is_empty(). This requirement avoids hidden truthiness rules and makes the predicate visible to a reviewer. Comparisons such as <, >=, and == produce bool values; assignment uses a single equals sign and has a different role.',
        'Use && for logical and, || for logical or, and ! for negation. The first two short-circuit: the right side is evaluated only when needed to decide the result. This matters when the right side is expensive or requires a condition established on the left. For example, divisor != 0 && numerator / divisor > 2 avoids division by zero. Parentheses can clarify a complex expression even when operator precedence would make them optional.',
      ],
    },
    {
      title: 'Branches can produce a result',
      body: [
        'Because if is an expression, you can bind its result directly. Both branches must produce compatible types. Returning a string slice in one branch and an integer in another does not create a dynamically typed value; it is a type error. When alternatives genuinely contain different kinds of data, an enum is often the correct model. Keep the expression short enough that the assignment remains easy to read.',
        'An else if chain evaluates conditions from top to bottom and takes the first matching branch. Order therefore matters when conditions overlap. Check the most specific threshold first, or structure conditions so they are mutually exclusive. A final else documents what happens when none of the previous conditions hold. Without an else, an ordinary if expression is useful for effects and has unit as its result.',
      ],
    },
    {
      title: 'Express boundaries precisely',
      body: [
        'A range written start..end excludes end. A range written start..=end includes it. These values appear in loops, pattern matching, and membership checks. For example, (1..=5).contains(&rating) expresses a valid rating range directly. Boundary decisions are a common source of bugs, so choose examples at the first valid value, the last valid value, and just outside each boundary.',
        'The example classifies a temperature and checks a score range. Predict the behavior at each threshold before running changes. In the exercise, distinguish a child ticket from a senior ticket, with the ordinary price as the remaining case. Resist compressing the entire decision into clever arithmetic: the goal is to make the business rule legible. Later, tests can preserve those exact boundaries when requirements change. Clear conditions are especially valuable because the compiler checks their types but cannot infer the intended pricing policy.',
      ],
    },
  ],
  example: `fn main() {
    let temperature = 18;
    let forecast = if temperature < 10 {
        "cold"
    } else if temperature < 25 {
        "mild"
    } else {
        "hot"
    };
    let score = 4;
    println!("Forecast: {forecast}");
    println!("Valid rating: {}", (1..=5).contains(&score));
}`,
  expectedOutput: 'Forecast: mild\nValid rating: true',
  exercise: {
    prompt:
      'Return a ticket price of 5 for ages below 12, 7 for ages 65 and above, and 10 otherwise. Print prices for ages 8, 30, and 70.',
    hint: 'Use an if / else if / else expression and check the boundary operators carefully.',
    starter: `fn ticket_price(age: u32) -> u32 {
    // TODO: implement all three age bands.
    let _ = age;
    10
}

fn main() {
    println!("{} {} {}", ticket_price(8), ticket_price(30), ticket_price(70));
}`,
    solution: `fn ticket_price(age: u32) -> u32 {
    if age < 12 {
        5
    } else if age >= 65 {
        7
    } else {
        10
    }
}

fn main() {
    println!("{} {} {}", ticket_price(8), ticket_price(30), ticket_price(70));
}`,
    expectedOutput: '5 10 7',
  },
  quiz: {
    question: 'Which expression includes both endpoints?',
    options: ['1..5', '1...5', '1 < 5', '1..=5'],
    answer: 3,
    explanation:
      'The ..= operator constructs an inclusive range, while .. excludes the upper endpoint.',
  },
  references: [
    { label: 'Control flow', url: 'https://doc.rust-lang.org/book/ch03-05-control-flow.html' },
    {
      label: 'Operator expressions',
      url: 'https://doc.rust-lang.org/reference/expressions/operator-expr.html',
    },
  ],
  tags: ['if', 'bool', 'ranges', 'short-circuit'],
};
