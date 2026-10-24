import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const capstoneParallelReviewLesson: Lesson = {
  id: 'capstone-parallel-review',
  title: 'Capstone: a parallel report and final review',
  minutes: 40,
  summary:
    'Combine scoped threads, deterministic aggregation, explicit contracts, and a practical path beyond this course.',
  objectives: [
    'Partition a CPU task without shared mutation',
    'Aggregate owned worker results deterministically',
    'Audit a program for correctness, resource use, and maintainability',
  ],
  sections: [
    section(
      'Parallelize the independent part',
      `The report counts words across several text fragments. Each worker borrows one fragment, computes a local BTreeMap<String, usize>, and returns ownership of its map. The coordinator joins workers and merges the results. This design avoids a shared mutex in the hot loop, because workers do not need to mutate the same map. The final BTreeMap orders keys, so printed output is stable regardless of worker scheduling.

The tokenizer uses split_whitespace and ASCII lowercasing. Punctuation remains attached to words, and non-ASCII case equivalence is outside the contract. These choices are simple and explicit. Improving tokenization is a separate task from parallelization; establish expected counting behavior first so a faster version can be checked against the sequential implementation.`,
    ),
    section(
      'Measure costs and define limits',
      `A thread per fragment is easy to understand but can be inefficient when there are many tiny fragments or more fragments than useful CPU parallelism. A production design might partition input into a bounded number of chunks or use an established worker pool. Each worker allocates a local map and owned keys, trading extra intermediate memory for reduced contention. Whether that tradeoff helps depends on input size, vocabulary size, and the target machine.

Benchmark a representative workload in an appropriate optimized build. Compare against a clear sequential baseline, and check that outputs match. Avoid measuring only startup or printing when the question is counting speed. Keep resource limits explicit for untrusted input: enormous files, unusually long tokens, or huge vocabularies can consume significant memory even when the code is memory-safe. Safety guarantees do not replace capacity planning.`,
    ),
    section(
      'Review a Rust program as a set of contracts',
      `Trace ownership from input to final output. Identify which functions borrow, which allocate, and which transfer values. Inspect every unwrap and unsafe block and explain the assumption that makes it acceptable. Review errors, shutdown, cancellation, and cleanup paths alongside successful behavior. Ensure public types cannot be placed into invalid states through ordinary safe calls. Check feature combinations and the compiler version the package claims to support.

You now have a foundation across the language's core and advanced areas. Continue with the standard library documentation for concrete APIs, the Reference for exact language rules, the Cargo Book for project behavior, and the Rustonomicon when designing unsafe abstractions. Domain expertise remains separate: web services, embedded systems, game engines, and operating systems each add protocols and constraints. A useful next project combines a tested pure core with one real adapter, such as a file-backed CLI or a small service, then measures and refines that complete path rather than collecting isolated syntax tricks.`,
    ),
  ],
  example: rust`use std::{collections::BTreeMap, thread};
fn count(text: &str) -> BTreeMap<String, usize> {
    let mut counts = BTreeMap::new();
    for word in text.split_whitespace() { *counts.entry(word.to_ascii_lowercase()).or_insert(0) += 1; }
    counts
}
fn main() {
    let parts = ["Rust makes ownership explicit", "Rust makes concurrency safer"];
    let totals = thread::scope(|scope| {
        let handles: Vec<_> = parts.iter().map(|part| scope.spawn(move || count(part))).collect();
        let mut total = BTreeMap::new();
        for handle in handles {
            for (word, amount) in handle.join().unwrap() { *total.entry(word).or_insert(0) += amount; }
        }
        total
    });
    for (word, count) in totals { println!("{word}: {count}"); }
}`,
  expectedOutput: 'concurrency: 1\nexplicit: 1\nmakes: 2\nownership: 1\nrust: 2\nsafer: 1\n',
  exercise: {
    prompt:
      'Implement merge so two word-count maps combine matching counts and retain unique words. Print keys in sorted order.',
    hint: 'Consume the second map and use entry(word).or_insert(0) on the first.',
    starter: rust`use std::collections::BTreeMap;
fn merge(_into: &mut BTreeMap<String, usize>, _from: BTreeMap<String, usize>) {}
fn main() {
    let mut first = BTreeMap::from([(String::from("rust"), 2)]);
    let second = BTreeMap::from([(String::from("rust"), 3), (String::from("safe"), 1)]);
    merge(&mut first, second);
    for (word, count) in first { println!("{word}: {count}"); }
}`,
    solution: rust`use std::collections::BTreeMap;
fn merge(into: &mut BTreeMap<String, usize>, from: BTreeMap<String, usize>) {
    for (word, count) in from { *into.entry(word).or_insert(0) += count; }
}
fn main() {
    let mut first = BTreeMap::from([(String::from("rust"), 2)]);
    let second = BTreeMap::from([(String::from("rust"), 3), (String::from("safe"), 1)]);
    merge(&mut first, second);
    for (word, count) in first { println!("{word}: {count}"); }
}`,
    expectedOutput: 'rust: 5\nsafe: 1\n',
  },
  quiz: {
    question: 'Why does the parallel report produce deterministic printed output?',
    options: [
      'The threads always finish in creation order',
      'Rust disables operating-system scheduling',
      'The final BTreeMap orders keys independently of thread scheduling',
      'A channel sorts all messages automatically',
    ],
    answer: 2,
    explanation:
      'Aggregation into an ordered map gives a stable presentation even though worker completion order may vary.',
  },
  references: [
    reference(
      'Standard library: BTreeMap',
      'https://doc.rust-lang.org/std/collections/struct.BTreeMap.html',
    ),
    reference('The Rust Reference', 'https://doc.rust-lang.org/reference/'),
    reference('The Rustonomicon', 'https://doc.rust-lang.org/nomicon/'),
  ],
  tags: ['capstone', 'parallelism', 'performance', 'review'],
};
