import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const advancedTypesLesson: Lesson = {
  id: 'advanced-types',
  title: 'Newtypes, typestate, coercions, and never',
  minutes: 28,
  summary:
    'Use the type system to encode units and legal transitions while understanding conversion and size boundaries.',
  objectives: [
    'Prevent unit confusion with newtypes',
    'Encode state transitions using consuming methods',
    'Distinguish coercions, casts, and checked conversions',
  ],
  sections: [
    section(
      'Make invalid combinations harder to express',
      `A type alias gives an existing type another name; it does not create a distinct type. type Metres = u32 still permits passing any u32 where Metres is expected. A newtype such as struct Metres(u32) creates a distinct type that can enforce construction rules, implement chosen traits, and prevent accidental mixing with Seconds. Its private field can keep those invariants under the module's control.

Typestate uses different types to represent phases of a protocol. A consuming method takes self and returns the next state, so callers cannot keep using the original state through the same owner. The Door example has an open operation only for Door<Closed> and a close operation only for Door<Open>. PhantomData records the compile-time state without storing a state value. It influences type-system relationships and should be selected deliberately, especially in unsafe abstractions.`,
    ),
    section(
      'Conversion has several meanings',
      `A coercion is an implicit adjustment allowed at particular sites, such as borrowing an array as a slice or converting a pointer to a compatible trait object. Deref coercion helps pointer-like types expose borrowed targets. A cast with as is explicit but may lose information, particularly for numeric narrowing. From and Into describe infallible conversions, while TryFrom and TryInto support checked conversions that may fail.

The default Sized bound on generic type parameters means their size is known at compile time. A ?Sized bound relaxes that requirement where an API can work through pointers. str, slices, and trait objects are dynamically sized types; references or owning pointers carry the metadata necessary to access them. Unsized does not mean their values have no size, only that a single static size is not known from that type alone.`,
    ),
    section(
      'Uninhabited results and practical limits',
      `The never type ! describes computations that do not return normally, such as a diverging function. A panic, return expression, or endless loop can fit into expression contexts because control never produces a value there. Use the stable function-return form when declaring a diverging function; broader uses of never-type syntax may have separate stability constraints. Infallible is a standard uninhabited error type for operations that cannot fail.

Rust's type system is expressive, but complexity has a cost for diagnostics and maintainers. Typestate works well for a small number of meaningful transitions; a runtime enum may be clearer for a large state machine or values loaded from storage. Variance describes how subtype relationships propagate through types, and it becomes especially important for references and unsafe pointer wrappers. Do not manually assert Send or Sync merely to silence a bound error. Treat advanced type techniques as ways to make a specific invariant visible, then keep the public API understandable to ordinary callers.`,
    ),
  ],
  example: rust`use std::marker::PhantomData;
struct Closed;
struct Open;
struct Door<State> { name: String, state: PhantomData<State> }
impl Door<Closed> {
    fn new(name: &str) -> Self { Self { name: name.into(), state: PhantomData } }
    fn open(self) -> Door<Open> { Door { name: self.name, state: PhantomData } }
}
impl Door<Open> {
    fn close(self) -> Door<Closed> { Door { name: self.name, state: PhantomData } }
}
fn main() {
    let door = Door::<Closed>::new("workshop");
    let door = door.open();
    println!("{} is open", door.name);
    let door = door.close();
    println!("{} is closed", door.name);
}`,
  expectedOutput: 'workshop is open\nworkshop is closed\n',
  exercise: {
    prompt:
      'Define distinct Metres and Seconds newtypes and implement speed(Metres, Seconds) -> Option<u32>, returning None for zero seconds.',
    hint: 'Destructure the wrappers, validate the denominator, and return integer metres per second.',
    starter: rust`struct Metres(u32);
struct Seconds(u32);
fn speed(_distance: Metres, _time: Seconds) -> Option<u32> { None }
fn main() { println!("{:?}", speed(Metres(100), Seconds(20))); println!("{:?}", speed(Metres(100), Seconds(0))); }`,
    solution: rust`struct Metres(u32);
struct Seconds(u32);
fn speed(Metres(distance): Metres, Seconds(time): Seconds) -> Option<u32> {
    distance.checked_div(time)
}
fn main() { println!("{:?}", speed(Metres(100), Seconds(20))); println!("{:?}", speed(Metres(100), Seconds(0))); }`,
    expectedOutput: 'Some(5)\nNone\n',
  },
  quiz: {
    question:
      'Which declaration prevents mixing metres with arbitrary u32 values without an explicit construction?',
    options: [
      'type Metres = u32;',
      'use u32 as Metres;',
      'struct Metres(u32);',
      'A comment saying metres',
    ],
    answer: 2,
    explanation:
      'A tuple struct creates a distinct newtype. A type alias preserves the original type identity.',
  },
  references: [
    reference(
      'The Book: advanced types',
      'https://doc.rust-lang.org/book/ch20-03-advanced-types.html',
    ),
    reference(
      'Standard library: PhantomData',
      'https://doc.rust-lang.org/std/marker/struct.PhantomData.html',
    ),
    reference(
      'Reference: type coercions',
      'https://doc.rust-lang.org/reference/type-coercions.html',
    ),
  ],
  tags: ['newtype', 'typestate', 'PhantomData', 'never', 'coercions'],
};
