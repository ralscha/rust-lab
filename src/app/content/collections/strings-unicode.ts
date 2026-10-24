import type { Lesson } from '../../course.model';

export const stringsUnicodeLesson: Lesson = {
  id: 'strings-unicode',
  title: 'Strings, UTF-8, and text boundaries',
  minutes: 28,
  summary:
    'Distinguish bytes, Unicode scalar values, and user-perceived characters when processing text.',
  objectives: [
    'Choose String or &str based on ownership',
    'Explain why byte length differs from character count',
    'Use safe text iteration and substring operations',
  ],
  sections: [
    {
      title: 'Text is encoded data with a validity rule',
      body: [
        'String owns a growable UTF-8 buffer, while &str borrows valid UTF-8 text. Both expose many of the same reading methods through dereferencing. Use String when you need to construct, modify, or retain owned text. Prefer &str for functions that only inspect it. A string literal has type &str with a static lifetime because its bytes are embedded in the program; borrowing an ordinary String does not make its data static.',
        'UTF-8 uses a variable number of bytes for Unicode scalar values. Therefore len counts bytes, not visible letters. chars iterates Unicode scalar values, represented by Rust char. User-perceived characters, also called grapheme clusters, can contain several scalar values, such as a letter followed by a combining accent. The standard library does not provide full grapheme segmentation. Choose a suitable Unicode library when the requirement is cursor movement or truncation by what a person perceives as characters.',
      ],
    },
    {
      title: 'Indexing requires a meaningful unit',
      body: [
        'Rust does not provide arbitrary integer indexing into a String to obtain a character. An integer alone does not say whether you mean a byte, a scalar value, or a grapheme cluster. You can iterate bytes or chars explicitly. char_indices returns byte offsets alongside scalar values, which is useful when identifying valid boundaries for later slicing. Walking to the nth scalar value requires traversal because UTF-8 has variable-width encoding.',
        'A string range slice uses byte offsets and must end on valid UTF-8 boundaries. Direct indexing panics on invalid boundaries, while get returns None. Use delimiter-aware methods such as split, split_whitespace, and lines when the task is about tokens or lines. Their boundary handling is clearer than inventing byte arithmetic. Keep text parsing separate from presentation assumptions: a byte length limit and a screen-width limit are different requirements.',
      ],
    },
    {
      title: 'Construct text deliberately',
      body: [
        'push adds one char, push_str appends a borrowed string slice, and format! creates a new String from formatted values. Repeated concatenation may allocate, so building into an existing String can be useful for larger loops. Do not optimize short messages prematurely. The + operator’s ownership behavior can surprise beginners because its common String form consumes the left operand; format! is often easier to read when combining several values.',
        'The example uses a word containing a multibyte letter and an emoji, then reports byte and scalar counts separately. The exercise normalizes whitespace by splitting and joining words. This operation deliberately changes spacing; it does not perform Unicode normalization or locale-sensitive case conversion. Writing down the exact transformation you need helps prevent a text utility from quietly doing more or less than its name promises.',
      ],
    },
  ],
  example: `fn main() {
    let mut text = String::from("café");
    text.push(' ');
    text.push('🦀');
    println!("Text: {text}");
    println!("Bytes: {}; scalar values: {}", text.len(), text.chars().count());
    println!("First letter: {:?}", text.chars().next());
    println!("Invalid boundary: {:?}", text.get(0..4));
}`,
  expectedOutput:
    "Text: café 🦀\nBytes: 10; scalar values: 6\nFirst letter: Some('c')\nInvalid boundary: None",
  exercise: {
    prompt:
      'Implement normalize_spaces so "  Rust   makes  sense  " becomes "Rust makes sense" using split_whitespace and join.',
    hint: 'Collect the borrowed words into Vec<&str>, then join them with a single space.',
    starter: `fn normalize_spaces(text: &str) -> String {
    // TODO: combine whitespace-separated words using single spaces.
    text.to_string()
}

fn main() {
    println!("{}", normalize_spaces("  Rust   makes  sense  "));
}`,
    solution: `fn normalize_spaces(text: &str) -> String {
    text.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn main() {
    println!("{}", normalize_spaces("  Rust   makes  sense  "));
}`,
    expectedOutput: 'Rust makes sense',
  },
  quiz: {
    question: 'What does String::len() measure?',
    options: [
      'User-perceived characters',
      'Unicode scalar values',
      'Terminal display columns',
      'UTF-8 bytes',
    ],
    answer: 3,
    explanation:
      'len returns the byte length. chars().count() counts Unicode scalar values, which still need not equal grapheme clusters.',
  },
  references: [
    { label: 'String API', url: 'https://doc.rust-lang.org/std/string/struct.String.html' },
    { label: 'str API', url: 'https://doc.rust-lang.org/std/primitive.str.html' },
    { label: 'char and Unicode', url: 'https://doc.rust-lang.org/std/primitive.char.html' },
  ],
  tags: ['String', 'str', 'UTF-8', 'Unicode', 'chars', 'bytes'],
};
