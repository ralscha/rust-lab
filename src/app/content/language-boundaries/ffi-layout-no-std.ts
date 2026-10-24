import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const ffiLayoutNoStdLesson: Lesson = {
  id: 'ffi-layout-no-std',
  title: 'FFI, representation, and no_std',
  minutes: 30,
  summary:
    'Define explicit boundaries between Rust and foreign code, and understand which facilities need an operating system or allocator.',
  objectives: [
    'Use repr(C) for a C-compatible aggregate layout',
    'Explain why String and Vec are not portable C parameters',
    'Distinguish core, alloc, and std',
  ],
  sections: [
    section(
      'A foreign interface is a shared agreement',
      `FFI connects Rust to code using another language's calling convention and data representation. extern "C" selects a C ABI for a function on the target platform. A declaration in an extern block must match the actual foreign symbol's signature exactly; the compiler cannot verify a separate C implementation for you. Rust 2024 requires unsafe extern blocks to emphasize that responsibility, though an item can be marked safe when its contract genuinely permits safe calls.

Design the boundary using types with explicit agreed representations. Fixed-width integers, raw pointers, and carefully defined repr(C) structs are common building blocks. A Rust String or Vec carries Rust-specific ownership and layout details and should not be passed as if it were an ordinary C string or array. A pointer-and-length pair can describe a buffer, but the interface must still specify who owns it, how long it lives, whether it is mutable, and which allocator must release it.`,
    ),
    section(
      'Layout is not serialization',
      `The default Rust struct representation allows layout decisions that should not become an external binary contract. repr(C) follows C layout rules for the target, including field ordering and padding. repr(transparent) gives an eligible wrapper the representation of its single relevant field. Neither makes arbitrary memory bytes a portable file format: endianness, padding, valid bit patterns, and platform differences still matter.

Avoid reading uninitialized padding as ordinary serialized data. Packed representations introduce alignment hazards, so forming references to packed fields can be invalid even when the address exists. Use explicit encoding and decoding for durable formats. Across an FFI boundary, also decide how errors are returned and how panics are handled; do not assume unwinding can cross any foreign frame safely. The example calls a Rust-defined C-ABI function, which teaches representation without requiring a platform-specific native library.`,
    ),
    section(
      'Small environments and allocation',
      `A crate with #![no_std] does not automatically link the standard library. core supplies fundamental types, traits, and operations that do not require an allocator or operating-system services. alloc provides heap-backed types such as Vec and String when an allocator is available. std adds facilities such as files, threads, and platform integration. no_std is therefore not equivalent to no allocation, and it does not by itself produce a complete executable for a microcontroller.

An embedded or freestanding binary also needs a target, entry-point arrangement, panic behavior, linking configuration, and any allocator it uses. Keep portable domain algorithms in a library that depends only on core when that deployment matters, and place host-specific I/O in an adapter. The browser runner uses std on a host system, so the executable examples demonstrate core-compatible operations inside a normal binary. The local library recipe shows where no_std belongs without pretending that println! would work in a bare environment.`,
    ),
    section(
      'A portable library core',
      `Use this as src/lib.rs in a local library crate. It needs no allocation and can be consumed by a normal std application or a compatible no_std application.`,
      rust`#![no_std]
pub fn checksum(bytes: &[u8]) -> u8 {
    bytes.iter().fold(0u8, |sum, &byte| sum.wrapping_add(byte))
}`,
    ),
  ],
  example: rust`#[repr(C)]
struct Pair { left: i32, right: i32 }
extern "C" fn sum_pair(pair: Pair) -> i32 { pair.left.saturating_add(pair.right) }
fn main() {
    let pair = Pair { left: 20, right: 22 };
    println!("{}", sum_pair(pair));
    let encoded = 0x1234u16.to_be_bytes();
    println!("wire bytes: {:?}", encoded);
    println!("decoded: {}", u16::from_be_bytes(encoded));
}`,
  expectedOutput: '42\nwire bytes: [18, 52]\ndecoded: 4660\n',
  exercise: {
    prompt:
      'Encode a u32 explicitly as little-endian bytes and decode it again. Use 0x01020304 and print the byte array plus whether the round trip matches.',
    hint: 'to_le_bytes and from_le_bytes specify a format without relying on struct layout or pointer casts.',
    starter: rust`fn main() { let value = 0x01020304u32; println!("{value}"); }`,
    solution: rust`fn main() {
    let value = 0x01020304u32;
    let bytes = value.to_le_bytes();
    let decoded = u32::from_le_bytes(bytes);
    println!("{:?}", bytes);
    println!("round trip: {}", decoded == value);
}`,
    expectedOutput: '[4, 3, 2, 1]\nround trip: true\n',
  },
  quiz: {
    question: 'Does repr(C) by itself create a portable serialization format?',
    options: [
      'No, target layout, padding, and byte order still require consideration',
      'Yes, padding and endianness become universal',
      'Only for structs containing String',
      'Only when the struct implements Copy',
    ],
    answer: 0,
    explanation:
      'A C-compatible in-memory layout is an ABI property, while serialization needs an explicitly defined byte format.',
  },
  references: [
    reference('Reference: type layout', 'https://doc.rust-lang.org/reference/type-layout.html'),
    reference(
      'Edition Guide: unsafe extern blocks',
      'https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-extern.html',
    ),
    reference('Embedded Book: no_std', 'https://doc.rust-lang.org/embedded-book/intro/no-std.html'),
  ],
  tags: ['FFI', 'repr', 'no_std', 'core', 'alloc'],
};
