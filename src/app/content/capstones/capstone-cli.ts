import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const capstoneCliLesson: Lesson = {
  id: 'capstone-cli',
  title: 'Capstone: a testable text-search CLI core',
  minutes: 38,
  summary:
    'Build a reusable search operation and a small argument parser, keeping process I/O at the edge.',
  objectives: [
    'Borrow matching lines from the input',
    'Parse arguments into a validated configuration',
    'Separate pure behavior from files, environment, and exit status',
  ],
  sections: [
    section(
      'Keep the core independent of the terminal',
      `A command-line application has at least two responsibilities: interpreting the process environment and performing the useful operation. Separating them lets the search algorithm run in a test, a browser example, or a different application without pretending to be a terminal. The example accepts an explicit argument slice and explicit text, so its behavior is deterministic. A local executable can replace those literals with std::env::args and file reading.

Our configuration accepts a query followed by an optional --ignore-case flag. It rejects a missing or empty query and unexpected arguments. Real command-line interfaces need decisions about help, repeated flags, values beginning with dashes, and non-Unicode paths. std::env::args_os handles operating-system strings where full Unicode conversion is not appropriate. A mature argument-parser crate can handle these conventions, but understanding the small version makes the boundary clearer.`,
    ),
    section(
      'Borrow the matching lines',
      `The search function returns slices of its input. Its output lifetime is tied to the text, not to the query, because each result points into a line of the original text. This avoids allocating a new String for each match while letting the caller decide how to display or store results. If results must outlive the input buffer, convert them to owned strings at that boundary.

Case-insensitive matching in this exercise uses ASCII lowercasing and states that policy explicitly. It allocates normalized strings for comparison while still returning the original line slices. Full Unicode case folding and locale-sensitive matching are separate requirements, and byte-oriented matching may be appropriate for arbitrary files. Avoid promising more than the algorithm implements. For large files, a streaming line reader reduces memory use but typically changes the result representation because each line buffer is reused.`,
    ),
    section(
      'Make the outer adapter small',
      `A local main can parse arguments, open the file, call the pure search function, write matches to stdout, send diagnostics to stderr, and choose an exit status. Keep those steps explicit so users can distinguish invalid arguments from a missing file or simply no matches. Return io::Result from I/O helpers and propagate failures instead of silently producing an empty result. Broken pipes can be an ordinary outcome when output is piped into another command.

Test the search function with empty input, no matches, several matches, CRLF line endings, and the exact case policy. Test argument parsing independently, including unknown flags. Once the contracts are established, add line numbers or a maximum result count as explicit configuration. The exercise implements a borrowed search core; the extension is to create a real Cargo binary whose outer layer supplies the text and handles process behavior.`,
    ),
  ],
  example: rust`struct Config<'a> { query: &'a str, ignore_case: bool }
fn config<'a>(args: &[&'a str]) -> Result<Config<'a>, &'static str> {
    let query = *args.first().ok_or("missing query")?;
    if query.is_empty() { return Err("empty query"); }
    match &args[1..] {
        [] => Ok(Config { query, ignore_case: false }),
        ["--ignore-case"] => Ok(Config { query, ignore_case: true }),
        _ => Err("unexpected arguments"),
    }
}
fn search<'a>(text: &'a str, config: &Config<'_>) -> Vec<&'a str> {
    let query = if config.ignore_case { config.query.to_ascii_lowercase() } else { config.query.to_owned() };
    text.lines().filter(|line| {
        if config.ignore_case { line.to_ascii_lowercase().contains(&query) } else { line.contains(&query) }
    }).collect()
}
fn main() {
    let config = config(&["rust", "--ignore-case"]).unwrap();
    for line in search("Rust is expressive\nGo is concise\nTrust ownership", &config) { println!("{line}"); }
}`,
  expectedOutput: 'Rust is expressive\nTrust ownership\n',
  exercise: {
    prompt:
      'Implement matching_lines returning borrowed lines containing the query, preserving their original order.',
    hint: 'Use text.lines().filter(...).collect(). The output lifetime belongs to text.',
    starter: rust`fn matching_lines<'a>(_text: &'a str, _query: &str) -> Vec<&'a str> { Vec::new() }
fn main() { for line in matching_lines("red apple\nblue sky\nred kite", "red") { println!("{line}"); } }`,
    solution: rust`fn matching_lines<'a>(text: &'a str, query: &str) -> Vec<&'a str> {
    text.lines().filter(|line| line.contains(query)).collect()
}
fn main() { for line in matching_lines("red apple\nblue sky\nred kite", "red") { println!("{line}"); } }`,
    expectedOutput: 'red apple\nred kite\n',
  },
  quiz: {
    question: 'Why is the output lifetime of matching_lines tied to text rather than query?',
    options: [
      'Queries must always be static',
      'Vec requires all elements to be static',
      'The compiler cannot distinguish the inputs',
      'The returned slices point into text',
    ],
    answer: 3,
    explanation:
      'Each result borrows the storage of an input line; the query is only inspected while selecting matches.',
  },
  references: [
    reference(
      'The Book: building a CLI',
      'https://doc.rust-lang.org/book/ch12-00-an-io-project.html',
    ),
    reference('Standard library: args_os', 'https://doc.rust-lang.org/std/env/fn.args_os.html'),
    reference('Standard library: BufRead', 'https://doc.rust-lang.org/std/io/trait.BufRead.html'),
  ],
  tags: ['capstone', 'CLI', 'lifetimes', 'architecture'],
};
