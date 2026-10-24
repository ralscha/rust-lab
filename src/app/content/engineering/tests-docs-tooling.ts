import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const testsDocsToolingLesson: Lesson = {
  id: 'tests-docs-tooling',
  title: 'Testing, documentation, and tooling',
  minutes: 25,
  summary:
    'Test observable contracts, explain APIs through executable documentation, and create a useful local quality loop.',
  objectives: [
    'Write unit tests for boundary behavior',
    'Distinguish unit, integration, and documentation tests',
    'Use rustfmt, Clippy, and cargo doc appropriately',
  ],
  sections: [
    section(
      'Tests make a claim precise',
      `A useful test names a behavior and constructs inputs that could reveal a mistake in that behavior. The checked average below must reject an empty slice and avoid overflow while accumulating u32 values. A happy-path test alone would not establish either property. Assertions should express observable results, not reproduce the implementation line by line. Test boundaries, invalid inputs, and interactions where ownership or state changes make mistakes plausible.

Unit tests commonly live in a cfg(test) module beside the implementation. Because that module is part of the same crate, it can access private implementation details through the module privacy rules. Integration tests under tests/ are separate crates and exercise the public API. Prefer integration tests for promises made to consumers, while small unit tests can isolate complex internal logic. The playground's Test action compiles its single source file with Rust's built-in test harness.`,
    ),
    section(
      'Documentation is part of a usable API',
      `Triple-slash comments document the following item; //! documents the containing module or crate. Explain what the operation guarantees, how arguments are interpreted, what errors mean, and whether it can panic. Rustdoc can execute Rust examples in documentation as doctests, so examples can catch stale API usage. Hidden setup lines can keep an example readable while still compiling, but the visible excerpt should teach an honest usage pattern.

Document safety requirements on unsafe functions in a dedicated Safety section. Document cancellation behavior on asynchronous operations when interruption could lose progress. State relevant complexity or allocation behavior when it helps callers choose an algorithm. A function named parse is not self-documenting when several formats or encodings are plausible. Think of documentation as a conversation with someone who cannot inspect your implementation.`,
    ),
    section(
      'A focused feedback loop',
      `Use cargo fmt or cargo fmt --check to apply or verify standard formatting. Use cargo clippy for additional correctness and style diagnostics, and evaluate warnings in context rather than mechanically rewriting everything. cargo test runs the relevant test targets, and cargo doc --open generates browsable API documentation. A CI pipeline can run these commands across supported platforms, feature combinations, and the minimum supported compiler.

Tests normally run concurrently, so avoid relying on execution order, shared mutable global state, or a common temporary filename. Inject a clock or input stream when real time or external services would make behavior unpredictable. Property tests and fuzzing can explore broader inputs when the domain warrants them; they complement carefully selected examples. Benchmarks answer performance questions, while tests establish correctness. Before optimizing, measure a representative workload in a suitable build profile and preserve a clear correctness test for the behavior you are accelerating.`,
    ),
  ],
  example: rust`/// Returns an integer average, or None for no values.
fn average(values: &[u32]) -> Option<u64> {
    if values.is_empty() { return None; }
    let total: u64 = values.iter().map(|&value| u64::from(value)).sum();
    Some(total / values.len() as u64)
}
#[cfg(test)]
mod tests {
    use super::average;
    #[test] fn averages_values() { assert_eq!(average(&[2, 4, 6]), Some(4)); }
    #[test] fn empty_has_no_average() { assert_eq!(average(&[]), None); }
    #[test] fn widens_before_adding() { assert_eq!(average(&[u32::MAX, u32::MAX]), Some(u64::from(u32::MAX))); }
}`,
  mode: 'test',
  exercise: {
    prompt:
      'Implement clamp_score and add tests for below zero, inside the interval, and above 100. Values must remain in 0..=100.',
    hint: 'i32::clamp supplies the implementation. Each test should assert a specific boundary behavior.',
    starter: rust`fn clamp_score(value: i32) -> i32 { value }
#[test] fn inside_range() { assert_eq!(clamp_score(50), 50); }`,
    solution: rust`fn clamp_score(value: i32) -> i32 { value.clamp(0, 100) }
#[test] fn below_range() { assert_eq!(clamp_score(-3), 0); }
#[test] fn inside_range() { assert_eq!(clamp_score(50), 50); }
#[test] fn above_range() { assert_eq!(clamp_score(120), 100); }`,
  },
  quiz: {
    question:
      'Why can a tests/ integration test catch a different class of API problems than a nearby unit test?',
    options: [
      'It ignores type checking',
      'It is compiled as a separate crate using the public interface',
      'It always runs on another computer',
      'It disables ownership checking',
    ],
    answer: 1,
    explanation:
      'Integration tests consume the crate like an external caller and therefore reveal missing exports or inconvenient public contracts.',
  },
  references: [
    reference(
      'The Book: test organization',
      'https://doc.rust-lang.org/book/ch11-03-test-organization.html',
    ),
    reference(
      'Rustdoc: documentation tests',
      'https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html',
    ),
    reference('Clippy documentation', 'https://doc.rust-lang.org/clippy/'),
  ],
  tags: ['testing', 'rustdoc', 'Clippy', 'tooling'],
};
