import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const errorDesignLesson: Lesson = {
  id: 'error-design',
  title: 'Errors, propagation, and recovery',
  minutes: 23,
  summary:
    'Use typed failures, the question-mark operator, and useful error messages to make recovery possible.',
  objectives: [
    'Define an error enum implementing Error and Display',
    'Use ? with compatible error conversion',
    'Choose Result, Option, or panic according to the contract',
  ],
  sections: [
    section(
      'A failure is part of the interface',
      `Result<T, E> says that an operation may produce either a value or a specific failure. Option<T> expresses absence without explaining why. Choose between them based on what a caller needs to decide. A configuration parser should distinguish malformed input from a valid missing optional field. A map lookup can naturally return None. Avoid using a sentinel such as zero when zero is also a meaningful value.

A library's error enum can expose categories that callers match on. Display provides a human-readable explanation, while Debug helps investigation. Implementing std::error::Error allows the value to participate in the standard error ecosystem and, when appropriate, expose a source error. Preserve useful causes rather than flattening every failure into a vague string. At the same time, avoid making private implementation details permanent public variants without considering future evolution.`,
    ),
    section(
      'Propagation is ordinary control flow',
      `The ? operator returns early from the enclosing function or compatible closure when it encounters failure. On Result, it can convert the error through From when the surrounding return type supports that conversion. It does not catch panics. map_err is useful when conversion needs context or when a lower-level error should become a domain-specific category. In the example, parse failures and out-of-range values have different meanings and remain distinguishable.

Keep validation near the input boundary, then pass validated types deeper into the program. A newtype such as Port can make an invalid number unrepresentable after construction. Returning Result from main is convenient for small command-line programs; a larger application may translate error categories into messages and exit statuses itself. Recovery belongs at the layer that has enough context to decide whether to retry, substitute a value, or stop.`,
    ),
    section(
      'Panics and cleanup',
      `panic! reports an unrecoverable condition or violated assumption. unwrap and expect are explicit panic points. They can be appropriate in a concise example with a known literal, or where an invariant has been established, but using them on ordinary user input changes a recoverable failure into process-level disruption. An expect message should explain the invariant you rely on, rather than restating the failed operation.

With unwinding enabled, destructors normally run while the stack unwinds. An aborting panic strategy terminates the process without this cleanup. catch_unwind is a specialized boundary, not a general replacement for Result and not a way to recover from undefined behavior. Avoid panicking from Drop, especially during another panic. In the exercise, make both input syntax and semantic range visible, then test success and each failure path. Good errors shorten debugging because they describe the action that failed and the relevant context.`,
    ),
  ],
  example: rust`use std::{error::Error, fmt};
#[derive(Debug)]
enum PortError { InvalidNumber, OutOfRange }
impl fmt::Display for PortError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self { Self::InvalidNumber => "not a number", Self::OutOfRange => "port outside 1..=65535" })
    }
}
impl Error for PortError {}
fn parse_port(input: &str) -> Result<u16, PortError> {
    let value: u32 = input.parse().map_err(|_| PortError::InvalidNumber)?;
    if !(1..=65535).contains(&value) { return Err(PortError::OutOfRange); }
    Ok(value as u16)
}
fn main() {
    for input in ["8080", "0", "abc"] {
        match parse_port(input) { Ok(port) => println!("port {port}"), Err(error) => println!("error: {error}") }
    }
}`,
  expectedOutput: 'port 8080\nerror: port outside 1..=65535\nerror: not a number\n',
  exercise: {
    prompt:
      'Parse a positive i32 and return "not an integer" for invalid syntax or "must be positive" for zero or negative values.',
    hint: 'Use parse::<i32>().map_err(...)? before checking the numeric value.',
    starter: rust`fn positive(_text: &str) -> Result<i32, &'static str> { Ok(0) }
fn main() { for text in ["12", "0", "no"] { println!("{:?}", positive(text)); } }`,
    solution: rust`fn positive(text: &str) -> Result<i32, &'static str> {
    let value = text.parse::<i32>().map_err(|_| "not an integer")?;
    if value <= 0 { return Err("must be positive"); }
    Ok(value)
}
fn main() { for text in ["12", "0", "no"] { println!("{:?}", positive(text)); } }`,
    expectedOutput: 'Ok(12)\nErr("must be positive")\nErr("not an integer")\n',
  },
  quiz: {
    question: 'What does ? do when a Result contains Err?',
    options: [
      'Retries the operation',
      'Returns early, using a compatible error conversion when required',
      'Panics immediately',
      'Converts the failure to None in every function',
    ],
    answer: 1,
    explanation:
      'On Result, ? propagates the error to the surrounding Result-returning context; it does not catch or create a panic.',
  },
  references: [
    reference(
      'The Book: recoverable errors',
      'https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html',
    ),
    reference('Standard library: Error', 'https://doc.rust-lang.org/std/error/trait.Error.html'),
  ],
  tags: ['Result', 'errors', 'question mark', 'panic'],
};
