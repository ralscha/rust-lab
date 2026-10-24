import type { Lesson } from '../../course.model';

export const ownershipMovesLesson: Lesson = {
  id: 'ownership-moves',
  title: 'Ownership, moves, and resource cleanup',
  minutes: 26,
  summary:
    'Follow ownership through assignments and calls, and understand when resources are released.',
  objectives: [
    'Trace the owner of a String',
    'Explain a move without assuming a deep copy',
    'Recognize scope-based cleanup and Drop',
  ],
  sections: [
    {
      title: 'A value has an owner',
      body: [
        'Ownership determines who is responsible for a value and its cleanup. A String owns a growable text buffer. When its owner leaves scope, the buffer is normally released automatically. This gives resource management a predictable connection to program structure, without requiring a tracing garbage collector. Ownership applies beyond memory: file handles, locks, and other resources can use the same scope-based cleanup pattern through their types.',
        'Do not equate a variable with a permanent memory location. The compiler may optimize away moves or keep values in registers. The useful language-level question is which binding or data structure may use the value now. For a non-Copy type such as String, assigning it to another binding transfers ownership. The original binding can no longer be used as if it still owned the transferred value. This prevents two independent owners from both freeing the same allocation.',
      ],
    },
    {
      title: 'Calls and returns also transfer values',
      body: [
        'Passing a String to a parameter of type String moves it into the function. Returning that String transfers it back to the caller or onward to another owner. These are ordinary consequences of the parameter and return types. If a function only needs to inspect text, accepting a borrow is usually more flexible, which the next lessons explore. If it needs to store or consume the text, taking ownership can be exactly the right contract.',
        'A move does not automatically allocate a second text buffer or copy every character. For String, ownership of the existing buffer transfers. If you need independent owned text, clone makes that duplication explicit. Cloning can be perfectly appropriate, but it should reflect a real need for another owned value rather than a habit of silencing ownership errors. First ask whether the operation needs to own, borrow, or modify the input.',
      ],
    },
    {
      title: 'Cleanup is behavior you can model',
      body: [
        'Types may implement Drop to perform cleanup when an owned value is dropped. You do not call the Drop::drop method directly; std::mem::drop takes ownership and allows a value to be released early. Memory leaks are possible in Rust, and process termination may bypass ordinary cleanup, so destructors should not be treated as guaranteed durable transaction commits. Within normal scope exit, they are a central resource-management tool.',
        'Trace the example across the finish function: the title moves into its parameter, is modified, and returns as the completed value. The exercise asks you to preserve ownership through a similar transformation. Try using the original binding after the move to observe the compiler’s explanation, then restore the valid program. This experiment gives meaning to “use of moved value” instead of turning that message into a rule to memorize.',
      ],
    },
  ],
  example: `fn finish(mut title: String) -> String {
    title.push_str(" — complete");
    title
}

fn main() {
    let title = String::from("Ownership lesson");
    let completed = finish(title);
    println!("{completed}");
}`,
  expectedOutput: 'Ownership lesson — complete',
  exercise: {
    prompt:
      'Implement decorate so it takes ownership of a String, surrounds its text with brackets, and returns the owned result. Print [Rust].',
    hint: 'format! can borrow the input while constructing a new owned String to return.',
    starter: `fn decorate(text: String) -> String {
    // TODO: return bracketed text.
    text
}

fn main() {
    let language = String::from("Rust");
    let label = decorate(language);
    println!("{label}");
}`,
    solution: `fn decorate(text: String) -> String {
    format!("[{text}]")
}

fn main() {
    let language = String::from("Rust");
    let label = decorate(language);
    println!("{label}");
}`,
    expectedOutput: '[Rust]',
  },
  quiz: {
    question: 'What happens when a String is passed to a function parameter of type String?',
    options: [
      'Ownership moves into the function',
      'The buffer is always deeply copied',
      'The compiler creates a shared reference',
      'The String becomes static',
    ],
    answer: 0,
    explanation:
      'String is not Copy, so passing it by value transfers ownership. An independent duplicate requires an explicit operation such as clone.',
  },
  references: [
    {
      label: 'Ownership in the Rust Book',
      url: 'https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html',
    },
    { label: 'Drop', url: 'https://doc.rust-lang.org/std/ops/trait.Drop.html' },
  ],
  tags: ['ownership', 'move', 'String', 'Drop'],
};
