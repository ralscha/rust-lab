import type { Lesson } from '../../course.model';

export const optionLesson: Lesson = {
  id: 'option',
  title: 'Option and the absence of a value',
  minutes: 24,
  summary: 'Represent missing values explicitly and transform them without unchecked assumptions.',
  objectives: [
    'Choose Option instead of sentinel values',
    'Use map, and_then, and defaults',
    'Borrow an Option with as_ref',
  ],
  sections: [
    {
      title: 'Absence belongs in the type',
      body: [
        'Option<T> has two variants: Some(T) contains a value, and None represents absence. It is useful for a search that may find no match, an optional configuration setting, or the first element of a possibly empty collection. The type forces callers to account for the missing case before using the inner T. A magic sentinel such as -1 or an empty string can overlap with legitimate data or be forgotten; Option makes the distinction explicit.',
        'Option is part of the standard prelude, so its type and variants are normally available without an import. An Option<i32> is not itself an i32; arithmetic requires selecting a present value or providing another policy. Matching both variants is the clearest first approach. Once the behavior is familiar, combinator methods can express common transformations concisely while retaining explicit handling of absence.',
      ],
    },
    {
      title: 'Transform the value only when present',
      body: [
        'map transforms a contained value and leaves None unchanged. If the transformation itself can return None, and_then chains it without producing nested Option values. unwrap_or supplies an already evaluated fallback, while unwrap_or_else computes the fallback only when needed. That difference matters when building the default is expensive or has side effects. Choose a meaningful default only when the application’s requirements support one.',
        'unwrap and expect extract a present value but panic on None. They can be reasonable when a clearly established invariant guarantees presence, with expect documenting the invariant. They are poor default handling for ordinary missing user input. The ? operator can also return early from an Option-returning function when a step yields None. Later lessons compare this short-circuiting behavior with Result-based error propagation.',
      ],
    },
    {
      title: 'Preserve ownership when inspecting',
      body: [
        'Many Option methods consume self. If an Option contains a String, consuming the Option may move that owned String. as_ref converts &Option<T> into Option<&T>, allowing a transformation to inspect the payload while preserving the original owner. as_mut similarly provides optional exclusive access. These methods show how ownership and enum modeling cooperate: absence is represented by the variant, while access is represented by the reference type.',
        'The example looks up an element, copies the small integer out of its reference, transforms it, and uses a documented fallback for an invalid position. The exercise searches for a first even value. Its None result is an ordinary outcome rather than an exceptional crash. After implementing it, test an empty slice and a slice containing only odd numbers. Both should produce absence for the same logical reason: no value satisfies the search predicate.',
      ],
    },
  ],
  example: `fn main() {
    let scores = [10, 20, 30];
    let doubled = scores.get(1).copied().map(|value| value * 2);
    let missing = scores.get(8).copied().unwrap_or(0);
    let nickname = Some(String::from("Ferris"));
    let length = nickname.as_ref().map(|name| name.len());
    println!("Doubled: {doubled:?}; missing default: {missing}");
    println!("Nickname: {nickname:?}; bytes: {length:?}");
}`,
  expectedOutput: 'Doubled: Some(40); missing default: 0\nNickname: Some("Ferris"); bytes: Some(6)',
  exercise: {
    prompt:
      'Return the first even number as Some(number), or None if none exists. Print Some(8) and None for the supplied slices.',
    hint: 'Loop through the borrowed values, return Some(*value) on a match, and leave None as the final expression.',
    starter: `fn first_even(values: &[i32]) -> Option<i32> {
    // TODO: search without panicking on absence.
    let _ = values;
    None
}

fn main() {
    println!("{:?}", first_even(&[3, 5, 8, 10]));
    println!("{:?}", first_even(&[1, 3]));
}`,
    solution: `fn first_even(values: &[i32]) -> Option<i32> {
    for value in values {
        if value % 2 == 0 {
            return Some(*value);
        }
    }
    None
}

fn main() {
    println!("{:?}", first_even(&[3, 5, 8, 10]));
    println!("{:?}", first_even(&[1, 3]));
}`,
    expectedOutput: 'Some(8)\nNone',
  },
  quiz: {
    question:
      'Which method borrows the payload of an Option without consuming the original Option?',
    options: ['unwrap', 'expect', 'as_ref', 'drop'],
    answer: 2,
    explanation:
      'as_ref turns a shared reference to Option<T> into Option<&T>, preserving ownership of the original payload.',
  },
  references: [
    { label: 'Option API', url: 'https://doc.rust-lang.org/std/option/enum.Option.html' },
    { label: 'Option module overview', url: 'https://doc.rust-lang.org/std/option/index.html' },
  ],
  tags: ['Option', 'Some', 'None', 'map', 'and_then', 'as_ref'],
};
