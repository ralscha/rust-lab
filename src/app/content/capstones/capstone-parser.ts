import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const capstoneParserLesson: Lesson = {
  id: 'capstone-parser',
  title: 'Capstone: a validated record parser',
  minutes: 35,
  summary:
    'Turn untrusted text into validated owned records and preserve enough context to explain failures.',
  objectives: [
    'Separate parsing from domain validation',
    'Attach line numbers to errors',
    'Choose all-or-nothing versus partial-success behavior explicitly',
  ],
  sections: [
    section(
      'Specify the format before writing the loop',
      `Our input contains one record per line in the form name,score. Names must be nonempty after trimming, and scores must parse as u16 values in 0..=100. Blank lines are ignored. This is deliberately a small custom format, not a full CSV implementation: quoted commas, escaped quotes, and embedded newlines are outside its contract. A precise scope keeps a concise parser honest and makes the extension path clear when a real CSV library is needed.

The parser first locates the delimiter, then trims the fields, validates the name, parses the score, and checks the domain range. Each step produces a distinct contextual error. Returning an owned Record makes the result independent of the input buffer, which simplifies storing it or moving it to another thread. A borrowing parser could avoid copying names, but would make that lifetime dependency part of its public signature.`,
    ),
    section(
      'Choose a failure policy',
      `The parse_all function uses an iterator returning Result<Record, String> and collects it into Result<Vec<Record>, String>. Collection stops at the first error, so the operation is all-or-nothing from the caller's point of view. Previously created records are dropped normally when the error is propagated. If a product needs every diagnostic at once, gather successes and failures into separate collections instead; that is a different, equally valid contract.

Line numbers are attached at the layer that knows the source position. The inner parser need not know whether a record came from a file, pasted text, or a network message. This separation keeps it easy to test. For a larger library, replace ad hoc strings with a typed error containing line, field, and cause, and implement Display for a friendly presentation.`,
    ),
    section(
      'Extend the parser without weakening its invariants',
      `Add tests for missing delimiters, empty names, invalid numbers, range boundaries, blank lines, and non-ASCII names. Decide whether repeated names are allowed and whether whitespace is meaningful before changing behavior. If records contain sensitive values, avoid dumping the entire input into an error message. Parsing is an input boundary, so resource limits also matter when real files can be large.

To turn this into a local CLI, read the file in a thin outer layer and pass its contents to parse_all. For very large input, stream records and process them incrementally instead of reading everything into memory. Streaming changes the transaction model: earlier records may already have been processed when a later record fails. Write down whether downstream actions must be rolled back or whether partial success is acceptable. The exercise makes the validation rule reusable as a small function, reinforcing that a reliable parser is a collection of explicit decisions rather than a chain of unwrap calls.`,
    ),
  ],
  example: rust`#[derive(Debug)]
struct Record { name: String, score: u16 }
fn parse_record(line: &str) -> Result<Record, String> {
    let (name, score) = line.split_once(',').ok_or("expected name,score")?;
    let name = name.trim();
    if name.is_empty() { return Err("name is empty".into()); }
    let score: u16 = score.trim().parse().map_err(|_| "score is not an integer")?;
    if score > 100 { return Err("score exceeds 100".into()); }
    Ok(Record { name: name.to_owned(), score })
}
fn parse_all(input: &str) -> Result<Vec<Record>, String> {
    input.lines().enumerate().filter(|(_, line)| !line.trim().is_empty())
        .map(|(index, line)| parse_record(line).map_err(|error| format!("line {}: {error}", index + 1)))
        .collect()
}
fn main() {
    for record in parse_all("Ada,95\nGrace,100\n").unwrap() { println!("{}: {}", record.name, record.score); }
    println!("{}", parse_all("Ada,95\nLinus,120").unwrap_err());
}`,
  expectedOutput: 'Ada: 95\nGrace: 100\nline 2: score exceeds 100\n',
  exercise: {
    prompt:
      'Implement parse_score with trim, integer parsing, and a 0..=100 check. Demonstrate 90, 101, and an invalid word.',
    hint: 'Parse to u16, map the parse error, then return a separate range error.',
    starter: rust`fn parse_score(_text: &str) -> Result<u16, &'static str> { Ok(0) }
fn main() { for value in [" 90 ", "101", "oops"] { println!("{:?}", parse_score(value)); } }`,
    solution: rust`fn parse_score(text: &str) -> Result<u16, &'static str> {
    let score = text.trim().parse::<u16>().map_err(|_| "invalid integer")?;
    if score > 100 { Err("out of range") } else { Ok(score) }
}
fn main() { for value in [" 90 ", "101", "oops"] { println!("{:?}", parse_score(value)); } }`,
    expectedOutput: 'Ok(90)\nErr("out of range")\nErr("invalid integer")\n',
  },
  quiz: {
    question:
      'What does collecting Iterator<Item = Result<Record, E>> into Result<Vec<Record>, E> do?',
    options: [
      'Silently skips all errors',
      'Returns the first encountered error or a vector of successful records',
      'Panics on every error',
      'Always returns both a vector and every error',
    ],
    answer: 1,
    explanation:
      'The Result collection behavior propagates failure; accumulating all diagnostics requires an explicit alternative design.',
  },
  references: [
    reference(
      'Standard library: Result iterator collection',
      'https://doc.rust-lang.org/std/result/enum.Result.html#impl-FromIterator%3CResult%3CA,+E%3E%3E-for-Result%3CV,+E%3E',
    ),
    reference(
      'The Book: improving an I/O project',
      'https://doc.rust-lang.org/book/ch12-03-improving-error-handling-and-modularity.html',
    ),
  ],
  tags: ['capstone', 'parsing', 'validation', 'errors'],
};
