import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const boxDerefDropLesson: Lesson = {
  id: 'box-deref-drop',
  title: 'Box, Deref, and deterministic cleanup',
  minutes: 23,
  summary:
    'Give recursive structures finite size, understand pointer coercions, and use scope-based resource cleanup.',
  objectives: [
    'Explain why recursive data needs indirection',
    'Distinguish moving a Box from moving its allocation',
    'Describe Deref coercion and Drop behavior',
  ],
  sections: [
    section(
      'An owning pointer',
      `Box<T> owns a value in a heap allocation and releases that allocation when the box is dropped. Moving the box transfers ownership of the allocation; it does not clone the stored value. The handle has a known size, so it can appear inside recursive data structures. Without indirection, a linked node containing another full node would require an infinitely expanding layout. Option<Box<Node>> instead stores a finite-sized pointer: the absent case reuses a bit pattern that no valid pointer can hold, so the option needs no extra space.

Heap allocation is not automatically preferable to stack storage. A Vec already manages a heap buffer, so wrapping every vector in Box usually adds an unnecessary layer. A box is useful for recursive ownership, large values whose placement matters, and owned trait objects. It may also hold an unsized value such as a slice or dyn Trait, with the pointer carrying the necessary metadata. Choose Box because of the ownership or layout requirement, rather than to work around a borrow you have not yet understood.`,
    ),
    section(
      'Dereferencing and convenient borrowing',
      `The * operator accesses a pointer's referent. Smart pointers can implement Deref to expose a shared reference to a target, and DerefMut to permit mutable access when their contracts support it. Deref coercion lets a borrowed smart pointer satisfy a compatible reference parameter, such as passing &String to a function expecting &str. Method lookup also performs dereferencing and borrowing adjustments.

Implement Deref when your wrapper behaves transparently like a pointer to its target. For a domain wrapper whose operations have additional rules, an explicit accessor may be clearer. Deref does not erase ownership or let a shared reference mutate arbitrary data. A Box can be owned mutably and provide exclusive access, while Rc cannot generally yield mutable access to a value that other owners may observe.`,
    ),
    section(
      'Resource acquisition follows ownership',
      `Drop runs cleanup when an owned value is destroyed. Files, locks, and memory allocations use this model so normal control-flow exits release resources without a separate cleanup call at each return. A value can also be consumed by std::mem::drop to end its lifetime at a chosen point. You cannot invoke the destructor method directly; that would risk later running it again for the same value.

Local bindings are normally dropped in reverse order of declaration, while field destruction follows defined rules for the containing type. Do not build a fragile protocol around incidental local ordering. A custom destructor should release the resource it owns and avoid panicking. Memory can be intentionally leaked with facilities such as mem::forget, so unsafe code must not rely on every destructor necessarily running. The example makes cleanup visible through output; production cleanup usually performs the resource operation silently.`,
    ),
  ],
  example: rust`struct Node { value: i32, next: Option<Box<Node>> }
struct Trace(&'static str);
impl Drop for Trace { fn drop(&mut self) { println!("drop {}", self.0); } }
fn greet(name: &str) { println!("hello {name}"); }
fn main() {
    let _outer = Trace("outer");
    let list = Node { value: 1, next: Some(Box::new(Node { value: 2, next: None })) };
    println!("{} -> {}", list.value, list.next.as_ref().unwrap().value);
    let name = Box::new(String::from("Rust"));
    greet(&name);
    { let inner = Trace("inner"); drop(inner); }
    println!("done");
}`,
  expectedOutput: '1 -> 2\nhello Rust\ndrop inner\ndone\ndrop outer\n',
  exercise: {
    prompt:
      'Implement sum for a recursively owned Chain. Borrow each node and total 3 + 5 + 8 without consuming the chain.',
    hint: 'Match on the enum; a borrowed Box dereferences to a borrowed Chain for the recursive call.',
    starter: rust`enum Chain { End, Link(i32, Box<Chain>) }
fn sum(_chain: &Chain) -> i32 { 0 }
fn main() { let chain = Chain::Link(3, Box::new(Chain::Link(5, Box::new(Chain::Link(8, Box::new(Chain::End)))))); println!("{}", sum(&chain)); }`,
    solution: rust`enum Chain { End, Link(i32, Box<Chain>) }
fn sum(chain: &Chain) -> i32 {
    match chain { Chain::End => 0, Chain::Link(value, rest) => value + sum(rest) }
}
fn main() { let chain = Chain::Link(3, Box::new(Chain::Link(5, Box::new(Chain::Link(8, Box::new(Chain::End)))))); println!("{}", sum(&chain)); }`,
    expectedOutput: '16\n',
  },
  quiz: {
    question: 'Why does Box permit a recursive Node type to have finite size?',
    options: [
      'The compiler ignores recursive fields',
      'Every node is stored in static memory',
      'The box supplies indirection through a finite-sized owning pointer',
      'Box disables destructors',
    ],
    answer: 2,
    explanation:
      'The enclosing layout contains a pointer rather than an inline copy of the complete recursive value.',
  },
  references: [
    reference('The Book: Box', 'https://doc.rust-lang.org/book/ch15-01-box.html'),
    reference('The Book: Drop', 'https://doc.rust-lang.org/book/ch15-03-drop.html'),
    reference('Standard library: Deref', 'https://doc.rust-lang.org/std/ops/trait.Deref.html'),
  ],
  tags: ['Box', 'Deref', 'Drop', 'RAII'],
};
