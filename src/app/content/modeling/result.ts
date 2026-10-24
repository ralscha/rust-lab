import type { Lesson } from '../../course.model';

export const resultLesson: Lesson = {
  id: 'result',
  title: 'Result and recoverable errors',
  minutes: 27,
  summary: 'Return useful failure information and propagate it with the question-mark operator.',
  objectives: [
    'Model success and failure with Result',
    'Propagate errors using ?',
    'Distinguish expected failures from panics',
  ],
  sections: [
    {
      title: 'A failed operation can still return normally',
      body: [
        'Result<T, E> has an Ok(T) success variant and an Err(E) failure variant. Parsing user input, opening a file, and validating a request may fail as part of normal operation. Returning Result gives the caller a choice about recovery, reporting, or propagation. The error type can be a simple message for an introductory example, but a reusable library often benefits from a structured error enum with variants that callers can inspect.',
        'Result differs from Option because it explains failure through E. Use Option when absence alone communicates the outcome, and Result when the reason matters. A panic indicates that the current computation cannot proceed under its assumptions; it is not a substitute for ordinary input validation. Libraries should avoid surprising callers with panics for conditions that their API presents as expected failures. Documentation should identify relevant panic conditions.',
      ],
    },
    {
      title: 'Propagate without repeating the same branch',
      body: [
        'The ? operator extracts the successful value or returns early with the error from the enclosing compatible function. This reduces repeated match expressions when each step should stop on failure. It does not ignore errors or turn them into default values. Error conversion may occur through the appropriate From relationship, so the enclosing error type must be compatible. A function returning plain u32 cannot casually use ? on a Result without changing its return contract.',
        'map transforms a successful value, while map_err transforms the error. and_then chains operations that themselves return Result. Start with explicit matches when learning the flow, then use these methods when they improve readability. Avoid mapping every distinct error to an identical vague message if a caller needs to distinguish the causes. Good error design preserves useful context without exposing unnecessary internal details.',
      ],
    },
    {
      title: 'Handle errors at an intentional boundary',
      body: [
        'Lower-level functions usually return errors upward, while an application boundary decides how to present them to a user or log them. Repeatedly printing and rethrowing the same error can produce noisy duplicate messages. In this example, parsing and validation are separate steps, and main is the display boundary. The small string error type keeps the focus on control flow; more advanced lessons introduce custom error types and standard error traits.',
        'The exercise parses two integers and adds them while preserving malformed-input errors. An overflow-aware operation then makes the numeric boundary explicit as well. Test a valid pair and an invalid token before changing the inputs yourself. Notice that a failed call does not prevent main from handling a later independent call: returning Err is ordinary control flow, and the caller decides whether the overall application should continue.',
      ],
    },
  ],
  example: `fn parse_port(text: &str) -> Result<u16, &'static str> {
    let port = text.parse::<u16>().map_err(|_| "not a valid u16")?;
    if port == 0 {
        return Err("port must be nonzero");
    }
    Ok(port)
}

fn main() {
    for input in ["8080", "0", "oops"] {
        match parse_port(input) {
            Ok(port) => println!("Port: {port}"),
            Err(error) => println!("Error: {error}"),
        }
    }
}`,
  expectedOutput: 'Port: 8080\nError: port must be nonzero\nError: not a valid u16',
  exercise: {
    prompt:
      'Implement parse_sum: parse two i32 values, report "invalid integer" for malformed text, and "sum overflow" for overflow. Print Ok(12) and Err("invalid integer").',
    hint: 'Use parse::<i32>().map_err(...)? for each input, then checked_add(...).ok_or(...).',
    starter: `fn parse_sum(left: &str, right: &str) -> Result<i32, &'static str> {
    // TODO: parse both values and add with an explicit overflow policy.
    let _ = (left, right);
    Ok(0)
}

fn main() {
    println!("{:?}", parse_sum("5", "7"));
    println!("{:?}", parse_sum("bad", "7"));
}`,
    solution: `fn parse_sum(left: &str, right: &str) -> Result<i32, &'static str> {
    let left = left.parse::<i32>().map_err(|_| "invalid integer")?;
    let right = right.parse::<i32>().map_err(|_| "invalid integer")?;
    left.checked_add(right).ok_or("sum overflow")
}

fn main() {
    println!("{:?}", parse_sum("5", "7"));
    println!("{:?}", parse_sum("bad", "7"));
}`,
    expectedOutput: 'Ok(12)\nErr("invalid integer")',
  },
  quiz: {
    question: 'What does ? do when applied to an Err in a compatible Result-returning function?',
    options: [
      'Silently discards the error',
      'Returns early with the error, converting it when supported',
      'Always panics',
      'Retries the operation',
    ],
    answer: 1,
    explanation:
      '? propagates the failure to the caller. It neither retries nor substitutes a default result.',
  },
  references: [
    {
      label: 'Recoverable errors with Result',
      url: 'https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html',
    },
    { label: 'Result API', url: 'https://doc.rust-lang.org/std/result/enum.Result.html' },
  ],
  tags: ['Result', 'errors', '?', 'map_err', 'parsing'],
};
