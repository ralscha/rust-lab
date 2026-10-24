import type { Lesson } from '../../course.model';

export const bindingsLesson: Lesson = {
  id: 'bindings',
  title: 'Bindings, mutability, and shadowing',
  minutes: 18,
  summary: 'Choose between changing a value and introducing a new binding with a clearer type.',
  objectives: [
    'Use immutable and mutable bindings deliberately',
    'Explain shadowing and scope',
    'Distinguish const items from local bindings',
  ],
  sections: [
    {
      title: 'A binding names a value',
      body: [
        'let creates a binding between a name and a value. Bindings are immutable by default: after initialization, ordinary assignment cannot replace their value. This default makes local reasoning easier because you can trust that an unmodified binding still denotes the same value later in its scope. Add mut when the algorithm genuinely needs reassignment or mutation through that binding. Mutability is permission to change, not a requirement to change.',
        'Rust can infer many local types from initializers and later uses. You can write an annotation such as let count: u32 = 3 when it clarifies a boundary or resolves ambiguity. A binding may be declared before its value is assigned, but the compiler ensures initialization occurs before every use. Avoid splitting declaration from initialization without a reason; keeping them together normally makes the value’s origin easier to see.',
      ],
    },
    {
      title: 'Shadowing starts a new binding',
      body: [
        'A second let with the same name shadows the previous binding. This is different from assignment: it introduces a new binding, so the type may change. Turning text into its length is a useful example. Shadowing lets you preserve a meaningful domain name while passing through a sequence of transformations. Reassignment to a mutable binding must preserve the original type. A String binding cannot become an integer merely because it was declared mut.',
        'Braces create a scope. A binding created inside a nested block is available within that block, and shadowing there does not replace the outer binding after the block ends. This is helpful for temporary transformations and for limiting how long a resource or borrow remains relevant. Do not use shadowing so aggressively that readers lose track of the current meaning; a new descriptive name is often clearer when the conceptual role changes.',
      ],
    },
    {
      title: 'Constants express compile-time values',
      body: [
        'A const item has an explicit type and a value evaluated in a constant context. It is useful for stable domain values such as a maximum batch size. Constants can appear outside functions and conventionally use SCREAMING_SNAKE_CASE. They are different from static items, which represent a particular memory location and have additional rules. A local immutable binding can hold a value computed at runtime; immutability alone does not make something a constant.',
        'Trace the example by writing down which binding exists at each line. The inner block briefly changes the visible value of steps, while the outer steps remains four. The exercise asks you to combine mutation with shadowing so you can observe their distinct effects. After it works, try replacing the second let with assignment and explain the type error. Restore the working version and describe why the original transformation was allowed.',
      ],
    },
  ],
  example: `const DAILY_GOAL: u32 = 10;

fn main() {
    let mut steps = 3;
    steps += 1;
    {
        let steps = steps * 2;
        println!("Preview: {steps}");
    }
    let label = "Rust";
    let label = label.len();
    println!("Progress: {steps}/{DAILY_GOAL}; label bytes: {label}");
}`,
  expectedOutput: 'Preview: 8\nProgress: 4/10; label bytes: 4',
  exercise: {
    prompt:
      'Start with a mutable score of 10, add 5, then shadow score with a formatted String and print Score: 15.',
    hint: 'format! creates an owned String using the same placeholders as println!.',
    starter: `fn main() {
    let mut score = 10;
    // TODO: increase score, then shadow it with formatted text.
    score += 0;
    println!("{score}");
}`,
    solution: `fn main() {
    let mut score = 10;
    score += 5;
    let score = format!("Score: {score}");
    println!("{score}");
}`,
    expectedOutput: 'Score: 15',
  },
  quiz: {
    question: 'Why can let value = value.len(); change the type of value?',
    options: [
      'All variables are dynamically typed',
      'len modifies the original variable',
      'Shadowing disables type checks',
      'let introduces a new binding that shadows the old one',
    ],
    answer: 3,
    explanation:
      'The second let creates a distinct binding. Each binding still has one statically known type.',
  },
  references: [
    {
      label: 'Variables and mutability',
      url: 'https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html',
    },
    {
      label: 'Constant items',
      url: 'https://doc.rust-lang.org/reference/items/constant-items.html',
    },
  ],
  tags: ['let', 'mut', 'shadowing', 'const', 'scope'],
};
