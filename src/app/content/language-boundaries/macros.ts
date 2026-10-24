import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const macrosLesson: Lesson = {
  id: 'macros',
  title: 'Declarative and procedural macros',
  minutes: 28,
  summary:
    'Generate syntax with macro_rules!, understand repetition and hygiene, and learn when a procedural macro needs its own crate.',
  objectives: [
    'Write a macro with repeated expression arguments',
    'Avoid evaluating arguments more often than promised',
    'Distinguish function-like, derive, and attribute procedural macros',
  ],
  sections: [
    section(
      'Syntax transformation before type checking',
      `A function accepts values; a macro accepts syntax and expands into more syntax. This makes macros useful for variable argument counts, generated implementations, or domain-specific notation that cannot be expressed conveniently through ordinary functions. The generated code is still checked by Rust's type system and borrow checker. A macro is not a loophole around those rules. Prefer a function when normal parameter and return types express the operation clearly.

macro_rules! matches token patterns and expands a selected arm. Fragment specifiers such as expr, ident, ty, and pat describe what kind of syntax a metavariable captures. Repetition uses forms like $(...)* or $(...)+, optionally with separators. The example accepts comma-separated expressions with an optional trailing comma. Its expansion constructs a vector and pushes each expression once.`,
    ),
    section(
      'Expansion should preserve a clear contract',
      `A macro can accidentally evaluate an argument twice, making an invocation such as macro!(next_value()) surprising. Bind expressions to local variables when needed to control evaluation count and order. Use a block expression when the expansion needs local setup and should produce a value. Macro hygiene helps avoid accidental name capture, but exported macros still need deliberate paths to refer to items in their defining crate; $crate is designed for that role.

Diagnostics are part of a macro's user experience. Narrow patterns can produce useful errors, while very broad token captures may fail much later in confusing generated code. Recursive token processing can become difficult to maintain. Test representative invocations, including trailing commas and unusual expressions, and avoid creating a macro language that is harder to learn than the repeated code it replaces. Edition changes can affect fragment matching, so review the edition guide when migrating macro definitions.`,
    ),
    section(
      'Procedural macros use a separate compilation boundary',
      `Procedural macros are Rust functions that consume and produce token streams during compilation. They come in function-like, derive, and attribute forms. A custom procedural macro is defined in a crate whose manifest declares proc-macro = true and is used from another crate. This browser runs one main.rs, so the executable example teaches declarative expansion; the small local-project recipe below illustrates the separate procedural macro crate.

Derive macros usually add implementations for an input type. Attribute macros can transform the annotated item, while function-like macros replace their invocation with generated syntax. Real implementations should parse tokens robustly and emit useful spans and errors. A token stream is structured syntax, so indiscriminate string replacement is brittle. Proc-macro code and build scripts execute during compilation with build-process capabilities; review dependencies accordingly. Reach for a procedural macro when syntax-aware generation provides a clear benefit across many call sites.`,
    ),
    section(
      'A minimal local procedural macro',
      `Create a library package named answer_macro with [lib] proc-macro = true in Cargo.toml. Put the following code in its src/lib.rs, add it as a path dependency from a separate binary package, and invoke answer_macro::answer!() there. This recipe requires multiple crates and is intentionally separate from the one-file Run example.`,
      rust`extern crate proc_macro;
use proc_macro::TokenStream;

#[proc_macro]
pub fn answer(_input: TokenStream) -> TokenStream {
    "42u32".parse().expect("fixed tokens are valid Rust")
}`,
    ),
  ],
  example: rust`macro_rules! list {
    ($($value:expr),* $(,)?) => {{
        let mut output = Vec::new();
        $(output.push($value);)*
        output
    }};
}
fn main() {
    let mut calls = 0;
    let values = list![{ calls += 1; 10 }, 20, 30,];
    println!("{:?}", values);
    println!("evaluations: {calls}");
}`,
  expectedOutput: '[10, 20, 30]\nevaluations: 1\n',
  exercise: {
    prompt:
      'Define a sum! macro accepting one or more comma-separated expressions and an optional trailing comma. sum!(2, 3, 5,) must print 10.',
    hint: 'Expand the repeated expressions into 0 $(+ $value)+ inside parentheses.',
    starter: rust`macro_rules! sum { ($($value:expr),+ $(,)?) => { 0 }; }
fn main() { println!("{}", sum!(2, 3, 5,)); }`,
    solution: rust`macro_rules! sum {
    ($($value:expr),+ $(,)?) => { (0 $(+ $value)+) };
}
fn main() { println!("{}", sum!(2, 3, 5,)); }`,
    expectedOutput: '10\n',
  },
  quiz: {
    question: 'Where is a custom derive procedural macro defined?',
    options: [
      'Inside the same function that invokes it',
      'Only in the standard library',
      'In a proc-macro crate, then imported by a different crate',
      'In a Cargo.lock entry',
    ],
    answer: 2,
    explanation: 'Procedural macros require a dedicated crate type and a separate consuming crate.',
  },
  references: [
    reference(
      'Reference: macros by example',
      'https://doc.rust-lang.org/reference/macros-by-example.html',
    ),
    reference(
      'Reference: procedural macros',
      'https://doc.rust-lang.org/reference/procedural-macros.html',
    ),
    reference(
      'Edition Guide: macro fragment specifiers',
      'https://doc.rust-lang.org/edition-guide/rust-2024/macro-fragment-specifiers.html',
    ),
  ],
  tags: ['macros', 'macro_rules', 'procedural macros', 'hygiene'],
};
