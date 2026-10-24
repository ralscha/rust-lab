import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const unsafeInvariantsLesson: Lesson = {
  id: 'unsafe-invariants',
  title: 'Unsafe Rust and valid pointers',
  minutes: 30,
  summary:
    'Treat unsafe blocks as proof obligations and build safe interfaces that preserve every required invariant.',
  objectives: [
    'Distinguish creating a raw pointer from dereferencing one',
    'Document alignment, validity, lifetime, and aliasing requirements',
    'Use explicit unsafe blocks inside unsafe functions in edition 2024',
  ],
  sections: [
    section(
      'Unsafe creates obligations',
      `Unsafe Rust permits a small set of operations whose safety cannot be established by the compiler alone, including dereferencing raw pointers and calling unsafe functions. The surrounding code remains subject to ordinary type checking and ownership rules. An unsafe block does not mean the compiler verifies the operation or that arbitrary undefined behavior becomes acceptable. It means the programmer is asserting the required conditions hold at that point.

Raw pointers can be created from valid references in safe code. They do not carry the same enforced lifetime and borrowing guarantees when later used. Before dereferencing, establish that the pointer is non-null, suitably aligned, points to a live allocation with a valid initialized value of the expected type, and is used consistently with aliasing rules. A non-null address alone proves very little. Pointer arithmetic must also respect the operation's documented allocation boundaries.`,
    ),
    section(
      'A safe wrapper must be safe for every safe caller',
      `The example uses slice::get first, so any index produces either None or a reference to a valid element. Converting that reference to a raw pointer and reading it is deliberately redundant: it makes the proof small enough to inspect. The referent remains alive, correctly aligned, and immutably borrowed throughout the read. A real implementation should use the safe reference directly unless unsafe provides a demonstrated need.

A safe function containing unsafe code must preserve its contract for all inputs allowed by its signature, including malicious or unexpected inputs. Checking one convenient test case is insufficient. If the caller must establish an extra condition that the signature cannot enforce, declare an unsafe function and document that condition. Keep unsafe regions small, name the invariant in a SAFETY comment, and avoid exposing operations that let safe callers invalidate it later.`,
    ),
    section(
      'Edition 2024 makes the boundary clearer',
      `An unsafe fn declares a caller obligation. In Rust 2024, performing unsafe operations inside it without explicit unsafe blocks triggers the unsafe_op_in_unsafe_fn lint by default. Separate the function's precondition from the local reasoning that justifies each operation. Likewise, extern blocks need explicit unsafe marking, and certain attributes such as no_mangle require unsafe attribute syntax because they carry obligations beyond ordinary type checking.

Undefined behavior can invalidate reasoning across the program, so testing cannot prove an unsafe abstraction sound. Miri can detect many classes of undefined behavior in exercised paths and is a valuable additional tool, while code review must still assess the contract and all allowed interactions. Watch especially for uninitialized values, invalid enum discriminants, dangling references, overlapping mutable access, and destructor assumptions. Prefer well-reviewed standard or ecosystem abstractions and use unsafe only where a clear correctness argument accompanies a concrete requirement.`,
    ),
  ],
  example: rust`fn copy_at(values: &[u32], index: usize) -> Option<u32> {
    let value = values.get(index)?;
    let pointer: *const u32 = value;
    // SAFETY: pointer comes from a live, aligned shared reference;
    // u32 is Copy, and the slice remains borrowed during this read.
    Some(unsafe { *pointer })
}
fn main() {
    println!("{:?}", copy_at(&[10, 20, 30], 1));
    println!("{:?}", copy_at(&[10, 20, 30], 8));
}`,
  expectedOutput: 'Some(20)\nNone\n',
  exercise: {
    prompt:
      'Complete read_valid using an explicit unsafe block and document its precondition. Call it only with a pointer obtained from a live u32 reference.',
    hint: 'The unsafe function requires a pointer valid for reading one initialized u32. The call-site comment should explain why the local variable satisfies that requirement.',
    starter: rust`/// # Safety
/// The pointer must be valid and aligned for reading an initialized u32.
unsafe fn read_valid(_pointer: *const u32) -> u32 { 0 }
fn main() {
    let value = 42u32;
    // SAFETY: value is a live, aligned u32 and is not mutated during the call.
    println!("{}", unsafe { read_valid(&value) });
}`,
    solution: rust`#![deny(unsafe_op_in_unsafe_fn)]
/// # Safety
/// The pointer must be valid and aligned for reading an initialized u32,
/// and reading it must respect the aliasing rules.
unsafe fn read_valid(pointer: *const u32) -> u32 {
    // SAFETY: the caller guarantees validity, alignment, and permitted access.
    unsafe { *pointer }
}
fn main() {
    let value = 42u32;
    // SAFETY: value is live and aligned; this shared read does not conflict with mutation.
    println!("{}", unsafe { read_valid(&value) });
}`,
    expectedOutput: '42\n',
  },
  quiz: {
    question: 'What is the strongest correct statement about an unsafe block?',
    options: [
      'The compiler proves all operations inside are safe',
      'The programmer must uphold the additional contracts of the unsafe operations',
      'Borrow checking is disabled everywhere inside it',
      'Any pointer becomes valid when used inside it',
    ],
    answer: 1,
    explanation:
      'Unsafe operations are permitted only under their safety contracts, which the programmer must establish.',
  },
  references: [
    reference('The Book: unsafe Rust', 'https://doc.rust-lang.org/book/ch20-01-unsafe-rust.html'),
    reference(
      'Reference: undefined behavior',
      'https://doc.rust-lang.org/reference/behavior-considered-undefined.html',
    ),
    reference(
      'Edition Guide: unsafe operations in unsafe functions',
      'https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-op-in-unsafe-fn.html',
    ),
  ],
  tags: ['unsafe', 'raw pointers', 'invariants', 'edition 2024'],
};
