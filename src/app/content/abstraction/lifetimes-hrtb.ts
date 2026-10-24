import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const lifetimesHrtbLesson: Lesson = {
  id: 'lifetimes-hrtb',
  title: 'Lifetimes and higher-ranked bounds',
  minutes: 26,
  summary:
    'Read lifetime annotations as relationships, then express callbacks that work for every borrow lifetime.',
  objectives: [
    'Explain why annotations cannot extend a value lifetime',
    'Write borrowing structs and methods',
    "Read for<'a> bounds and distinguish T: 'static from &'static T",
  ],
  sections: [
    section(
      'Relationships, not timers',
      `A lifetime annotation describes how references relate. It does not keep an allocation alive, change when a destructor runs, or turn local data into global data. In fn first<'a>(input: &'a str) -> &'a str, the output may borrow from the input, so the caller cannot use that output after the relevant input storage stops being valid. The compiler chooses valid regions of use from the program; a name helps express relationships across the function boundary.

When several input references share a lifetime parameter, the function promises a result usable within a region where those references are all valid. This is often explained as the overlap of their usable lifetimes. It does not require that their original variables were created or destroyed together. Many straightforward signatures need no explicit names because lifetime elision rules make the relationship unambiguous, especially methods that return a borrow tied to &self.`,
    ),
    section(
      'Borrowing data structures and static bounds',
      `A struct that stores a reference normally needs a lifetime parameter, as Record<'a> does below. This makes the dependency visible to anyone storing a Record. Such a view can avoid allocation when parsing a larger document, but it also means the document must outlive the view. Choose owned fields when you need to return independent data, move it into long-lived storage, or simplify an API boundary.

The bound T: 'static says T contains no borrowed references with shorter required lifetimes. An owned String satisfies it even if the String is dropped one line later. A &'static str is an actual reference whose referent remains valid for the entire program, such as a string literal. Confusing these two forms often leads to unnecessary leaks or clones. A thread's 'static bound restricts what its closure may borrow; it does not demand that every owned value live forever.`,
    ),
    section(
      'A function valid for every borrow',
      `A higher-ranked trait bound uses for<'a> to say that a capability holds for every lifetime the caller chooses. The inspect_twice callback must accept a borrowed string regardless of which local string is currently being inspected. A function item naturally satisfies this requirement. This is stronger than selecting one lifetime outside the function and asking a callback to support only that lifetime.

Higher-ranked bounds appear in callback APIs, parsers, and abstractions over borrowed data. When a lifetime error is difficult, identify the owner first, then each reference, then the last use of each reference. Shortening a borrow scope, returning owned data, or separating independent lifetime parameters often expresses the intended design. Adding 'static indiscriminately merely asks for a stronger condition. For mutable references, exclusive access and variance can make relationships stricter than the similar-looking shared-reference case.`,
    ),
  ],
  example: rust`struct Record<'a> { name: &'a str }
impl<'a> Record<'a> {
    fn name(&self) -> &str { self.name }
}
fn inspect_twice<F>(inspect: F) where F: for<'a> Fn(&'a str) -> usize {
    let first = String::from("Rust");
    let second = String::from("borrows");
    println!("{} {}", inspect(&first), inspect(&second));
}
fn main() {
    let text = String::from("Ada");
    let record = Record { name: &text };
    println!("{}", record.name());
    inspect_twice(str::len);
}`,
  expectedOutput: 'Ada\n4 7\n',
  exercise: {
    prompt:
      'Implement before_colon so it returns a slice borrowed from its input, using the entire input when no colon exists.',
    hint: 'str::split_once returns borrowed slices. Both return paths can borrow from the same input lifetime.',
    starter: rust`fn before_colon<'a>(_text: &'a str) -> &'a str { "" }
fn main() {
    let input = String::from("name:Ada");
    println!("{}", before_colon(&input));
    println!("{}", before_colon("whole"));
}`,
    solution: rust`fn before_colon(text: &str) -> &str {
    match text.split_once(':') { Some((head, _)) => head, None => text }
}
fn main() {
    let input = String::from("name:Ada");
    println!("{}", before_colon(&input));
    println!("{}", before_colon("whole"));
}`,
    expectedOutput: 'name\nwhole\n',
  },
  quiz: {
    question: "What does T: 'static mean for an owned String?",
    options: [
      'It must never be dropped',
      'It must be stored in static memory',
      'It becomes Copy',
      'It has no non-static borrowed references and may still be dropped normally',
    ],
    answer: 3,
    explanation:
      'A lifetime bound constrains contained borrowing; it does not extend the lifetime of an owned value.',
  },
  references: [
    reference('The Book: lifetimes', 'https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html'),
    reference(
      'Reference: higher-ranked bounds',
      'https://doc.rust-lang.org/reference/trait-bounds.html#higher-ranked-trait-bounds',
    ),
  ],
  tags: ['lifetimes', 'HRTB', 'borrowing', 'static'],
};
