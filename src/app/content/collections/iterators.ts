import type { Lesson } from '../../course.model';

export const iteratorsLesson: Lesson = {
  id: 'iterators',
  title: 'Iterator pipelines and lazy evaluation',
  minutes: 28,
  summary: 'Compose transformations while understanding when work happens and what each item owns.',
  objectives: [
    'Distinguish iterator adapters from consumers',
    'Use map, filter, fold, zip, and collect',
    'Track the item type through a pipeline',
  ],
  sections: [
    {
      title: 'Iteration is a protocol',
      body: [
        'An iterator yields a sequence through next, returning Some(item) when another item is available and None at exhaustion. The Iterator trait gives this protocol an associated Item type. A for loop uses iteration behind the scenes, and many standard types can become iterators through IntoIterator. The iterator object records progression, so repeatedly calling next advances it rather than restarting from the first element.',
        'The item type is central. A slice iterator yields references, an iterator over an owned vector can yield owned elements, and a numeric range yields numbers directly. When a closure parameter appears to have an unexpected reference level, inspect the current Item type and the adapter’s signature. copied and cloned convert suitable borrowed items into owned values with different duplication semantics. Understanding the types is more reliable than adding dereferences by trial and error.',
      ],
    },
    {
      title: 'Adapters describe work; consumers perform it',
      body: [
        'Methods such as map, filter, take, skip, enumerate, and zip create adapted iterators. They are generally lazy: constructing a pipeline does not immediately process every element. A consumer such as collect, sum, count, fold, or a for loop requests items and drives the pipeline. Dropping an unused map iterator does not run its closure over all elements. Avoid hiding necessary side effects inside an adapter that might never be consumed.',
        'map transforms each item, while filter keeps items satisfying a predicate. filter borrows each item for the decision, which can introduce another reference level. filter_map combines filtering with a transformation that returns Option. zip pairs two sequences and stops when either is exhausted. enumerate pairs each item with a zero-based index. Compose only as much as remains readable; a direct loop is still an excellent tool when stateful branching becomes complicated.',
      ],
    },
    {
      title: 'Choose the output and stopping behavior',
      body: [
        'collect uses its destination type to decide how to assemble items. A Vec annotation or turbofish such as collect::<Vec<_>>() supplies that context. Collecting Result items into Result<Vec<_>, E> stops at the first error, which is useful for parsing an all-or-nothing input sequence. fold combines items into an accumulator you define, while specialized methods such as sum often communicate common reductions more directly.',
        'The example selects even numbers, squares them, collects the results, and sums them. The exercise parses text tokens, retaining only valid integers with filter_map. That deliberate omission policy differs from returning an error on any invalid token; use it only when skipping malformed data is the intended requirement. After completing it, rewrite the pipeline as a loop and compare the behavior. Both forms should make the same input policy and output ownership clear.',
      ],
    },
  ],
  example: `fn main() {
    let values = [1, 2, 3, 4, 5, 6];
    let squares: Vec<i32> = values
        .iter()
        .copied()
        .filter(|value| value % 2 == 0)
        .map(|value| value * value)
        .collect();
    let total: i32 = squares.iter().sum();
    println!("Even squares: {squares:?}");
    println!("Total: {total}");
}`,
  expectedOutput: 'Even squares: [4, 16, 36]\nTotal: 56',
  exercise: {
    prompt:
      'Parse "10 bad 20 nope 3", skip invalid tokens deliberately, and print Values: [10, 20, 3] followed by Sum: 33.',
    hint: 'split_whitespace().filter_map(|word| word.parse::<i32>().ok()) yields only successful parses.',
    starter: `fn main() {
    let input = "10 bad 20 nope 3";
    // TODO: collect successfully parsed integers.
    let values: Vec<i32> = Vec::new();
    let _ = input;
    println!("Values: {values:?}");
    println!("Sum: {}", values.iter().sum::<i32>());
}`,
    solution: `fn main() {
    let input = "10 bad 20 nope 3";
    let values: Vec<i32> = input
        .split_whitespace()
        .filter_map(|word| word.parse::<i32>().ok())
        .collect();
    println!("Values: {values:?}");
    println!("Sum: {}", values.iter().sum::<i32>());
}`,
    expectedOutput: 'Values: [10, 20, 3]\nSum: 33',
  },
  quiz: {
    question: 'What normally causes a lazy map pipeline to process its items?',
    options: [
      'Merely assigning it to a binding',
      'Importing Iterator',
      'Formatting the source file',
      'A consumer such as collect or a for loop',
    ],
    answer: 3,
    explanation:
      'Adapters create iterator values. Consumers request items, which drives the transformations.',
  },
  references: [
    { label: 'Iterator API', url: 'https://doc.rust-lang.org/std/iter/trait.Iterator.html' },
    { label: 'Iterator module overview', url: 'https://doc.rust-lang.org/std/iter/index.html' },
    {
      label: 'Processing items with iterators',
      url: 'https://doc.rust-lang.org/book/ch13-02-iterators.html',
    },
  ],
  tags: ['Iterator', 'lazy', 'map', 'filter', 'fold', 'collect', 'filter_map'],
};
