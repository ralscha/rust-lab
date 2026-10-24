import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const cowOwnedBorrowedLesson: Lesson = {
  id: 'cow-owned-borrowed',
  title: 'Cow, ownership choices, and API ergonomics',
  minutes: 21,
  summary:
    'Return borrowed data when possible, own it when necessary, and make conversion costs visible.',
  objectives: [
    'Return Cow<str> from a normalization function',
    'Distinguish AsRef, Borrow, and ToOwned',
    'Choose an owned boundary for retained data',
  ],
  sections: [
    section(
      'Borrow when the input already fits',
      `A transformation sometimes leaves its input unchanged. Always returning String would allocate even for that common path, while always returning &str cannot represent newly constructed text. Cow<'a, str> can hold either a borrowed &'a str or an owned String. The caller gets a string-like view in either case, and the type preserves the lifetime dependency when the result borrows.

The normalize function below borrows text that has no uppercase ASCII bytes. When a conversion is needed, it owns the converted string. The check and conversion deliberately use ASCII semantics, so the contract is clear for non-ASCII input. A Unicode case-normalization policy requires additional decisions about what comparison or storage behavior the application actually wants. A performance optimization is only correct relative to a precise text contract.`,
    ),
    section(
      'Clone on write and conversion traits',
      `Cow can produce mutable access with to_mut. If it currently borrows, that operation first creates an owned copy; if it already owns, the same storage can be reused. into_owned yields an owned result, cloning borrowed data when necessary. These operations make the ownership transition explicit. Do not assume Cow always saves work: checking whether a copy is needed can itself cost a scan, so measure relevant workloads.

AsRef<T> offers a cheap reference conversion and often makes input parameters flexible. Borrow<T> has stronger expectations about equivalence, particularly equality, ordering, and hashing, which enables borrowed key lookup in maps. ToOwned generalizes creating an owned form of a borrowed value, such as str to String or [T] to Vec<T>. Deref supports pointer-like access. These traits overlap in convenient syntax but express different contracts; implement the one your type actually guarantees.`,
    ),
    section(
      'Ownership at architectural boundaries',
      `Accept &str when you only inspect a string during a call. Accept String when the function takes ownership and will store or transfer it. A generic Into<String> can make constructors convenient, but it may also hide allocation costs from casual readers. Return a borrowed slice when it is naturally a view into caller-owned data, and return an owned result when the caller should be independent of the input's lifetime.

Copy-on-write is also available in other forms: Rc::make_mut and Arc::make_mut can clone shared payloads before mutation. The principle is the same, but the ownership relationship is different from Cow's borrowed-versus-owned enum. Avoid premature complexity. Begin with the simplest correct signature, then introduce conditional ownership when profiling or API requirements justify it. The exercise asks you to preserve a borrowed fast path and clearly show which inputs need owned storage.`,
    ),
  ],
  example: rust`use std::borrow::Cow;
fn normalize(input: &str) -> Cow<'_, str> {
    if input.bytes().any(|b| b.is_ascii_uppercase()) {
        Cow::Owned(input.to_ascii_lowercase())
    } else { Cow::Borrowed(input) }
}
fn main() {
    for input in ["rust", "RuSt"] {
        let output = normalize(input);
        println!("{} borrowed={}", output, matches!(&output, Cow::Borrowed(_)));
    }
}`,
  expectedOutput: 'rust borrowed=true\nrust borrowed=false\n',
  exercise: {
    prompt:
      'Return the original borrowed input when it has no spaces; otherwise return an owned string replacing spaces with underscores.',
    hint: 'str::contains checks the fast path and str::replace allocates the changed string.',
    starter: rust`use std::borrow::Cow;
fn slug(input: &str) -> Cow<'_, str> { Cow::Borrowed(input) }
fn main() { for input in ["rust", "learn rust"] { let value = slug(input); println!("{} borrowed={}", value, matches!(&value, Cow::Borrowed(_))); } }`,
    solution: rust`use std::borrow::Cow;
fn slug(input: &str) -> Cow<'_, str> {
    if input.contains(' ') { Cow::Owned(input.replace(' ', "_")) } else { Cow::Borrowed(input) }
}
fn main() { for input in ["rust", "learn rust"] { let value = slug(input); println!("{} borrowed={}", value, matches!(&value, Cow::Borrowed(_))); } }`,
    expectedOutput: 'rust borrowed=true\nlearn_rust borrowed=false\n',
  },
  quiz: {
    question: 'What does Cow::to_mut do to a borrowed value?',
    options: [
      'Creates an owned copy before returning mutable access',
      'Mutates the original shared reference directly',
      'Always panics',
      'Extends the borrowed value to static lifetime',
    ],
    answer: 0,
    explanation:
      'The owned copy gives Cow exclusive access without violating the original borrow contract.',
  },
  references: [
    reference('Standard library: Cow', 'https://doc.rust-lang.org/std/borrow/enum.Cow.html'),
    reference('Standard library: Borrow', 'https://doc.rust-lang.org/std/borrow/trait.Borrow.html'),
  ],
  tags: ['Cow', 'AsRef', 'Borrow', 'API design'],
};
