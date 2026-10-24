import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const constGenericsGatsLesson: Lesson = {
  id: 'const-generics-gats',
  title: 'Const generics and lending types',
  minutes: 27,
  summary:
    'Make array lengths part of types and use generic associated types to connect returned borrows to self.',
  objectives: [
    'Write a function generic over an array length',
    'Explain const versus runtime computation',
    "Read a generic associated type with where Self: 'a",
  ],
  sections: [
    section(
      'Values that participate in a type',
      `Const generics allow selected constant values to parameterize a type or function. An array [T; N] contains exactly N elements, and N is part of its type. Therefore [u8; 4] and [u8; 8] are different types even though both can be borrowed as a &[u8]. A function accepting &[T; N] preserves compile-time length information; a function accepting &[T] can handle varying lengths through a runtime slice length.

The checksum example accepts an array of any length without allocating. Its loop still runs at runtime; const generic does not mean every operation becomes compile-time evaluation. A const fn permits eligible calls in constant contexts, subject to the rules for constant evaluation. Keep these ideas separate: const parameters describe instantiations, const items define compile-time values, and const functions support certain compile-time computations.`,
    ),
    section(
      'Start with stable, simple expressions',
      `Integer, boolean, and character const parameters cover many practical cases such as fixed buffers and dimensions. Stable const generics have restrictions, particularly around using arithmetic expressions involving generic parameters as array lengths. Do not assume that every mathematical relationship can be placed directly into a type. Represent a relationship with runtime validation or a simpler API when stable Rust cannot express it cleanly.

Encoding length in the type can prevent mistakes, but it can also multiply generic instantiations and complicate callers. A parsing function often benefits more from a slice and a precise error than from a complex type-level length calculation. Choose a static relationship when it is central to the domain, such as a cryptographic block size, and keep ordinary variable-size input dynamic.`,
    ),
    section(
      'Associated types that themselves take lifetimes',
      `A generic associated type, often abbreviated GAT, lets an implementation define a family of associated types. View<'a> below varies with the borrow lifetime of the receiver. This is useful for lending interfaces: a returned value can borrow from self for exactly as long as that call permits. The where Self: 'a condition connects the implementing value to the lifetime used in the associated view.

Compare this with Iterator::Item, which is one fixed associated type per iterator implementation. A lending iterator may need an item type parameterized by each call's borrow, particularly when reusing an internal buffer. GATs provide a building block for that design, but generic associated types also affect dyn compatibility. Read a GAT signature from the method outward: identify the receiver borrow, the lifetime substituted into the associated type, and what the caller is allowed to retain before calling again. Begin with ordinary methods returning slices before introducing a trait family.`,
    ),
  ],
  example: rust`fn checksum<const N: usize>(bytes: &[u8; N]) -> u32 {
    bytes.iter().map(|&b| u32::from(b)).sum()
}
trait BorrowView {
    type View<'a> where Self: 'a;
    fn view(&self) -> Self::View<'_>;
}
struct Buffer(Vec<u8>);
impl BorrowView for Buffer {
    type View<'a> = &'a [u8];
    fn view(&self) -> Self::View<'_> { &self.0 }
}
fn main() {
    println!("checksum: {}", checksum(&[2, 4, 6]));
    let buffer = Buffer(vec![10, 20]);
    println!("view: {:?}", buffer.view());
}`,
  expectedOutput: 'checksum: 12\nview: [10, 20]\n',
  exercise: {
    prompt:
      'Make filled create [value; N] for any Copy type and const length. Produce four sevens and three true values.',
    hint: 'The repeat expression copies the same value N times and its return type is [T; N].',
    starter: rust`fn filled<T: Copy, const N: usize>(value: T) -> [T; N] { [value; N] }
fn main() { let _todo = filled::<u8, 0>(7); println!("choose the array lengths"); }`,
    solution: rust`fn filled<T: Copy, const N: usize>(value: T) -> [T; N] { [value; N] }
fn main() {
    println!("{:?}", filled::<u8, 4>(7));
    println!("{:?}", filled::<bool, 3>(true));
}`,
    expectedOutput: '[7, 7, 7, 7]\n[true, true, true]\n',
  },
  quiz: {
    question: "What does a GAT such as type View<'a> make possible?",
    options: [
      'Automatic garbage collection',
      'Unrestricted stable type-level arithmetic',
      'An associated type family parameterized by a lifetime',
      'Making every trait dyn compatible',
    ],
    answer: 2,
    explanation:
      'The implementation can choose a View type for each lifetime, allowing returned values to borrow from a receiver.',
  },
  references: [
    reference(
      'Reference: const generics',
      'https://doc.rust-lang.org/reference/items/generics.html#const-generics',
    ),
    reference(
      'Reference: associated types',
      'https://doc.rust-lang.org/reference/items/associated-items.html#associated-types',
    ),
  ],
  tags: ['const generics', 'GAT', 'arrays', 'advanced types'],
};
