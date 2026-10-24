import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const genericsTraitsLesson: Lesson = {
  id: 'generics-traits',
  title: 'Generics and trait contracts',
  minutes: 22,
  summary:
    'Write algorithms over capabilities, use where clauses, and understand monomorphization and coherence.',
  objectives: [
    'Define and implement a trait',
    'Choose the smallest useful bounds',
    'Explain static dispatch and the orphan rule',
  ],
  sections: [
    section(
      'A capability is a contract',
      `A generic parameter is a placeholder for a concrete type chosen when the function is used. The body must work for every type permitted by its bounds. You cannot call an arbitrary method on T merely because the types you currently pass happen to provide it. A trait gives that operation a name and specifies its contract. In the example, Price promises an integer number of cents. Returning integer cents also avoids mixing floating-point rounding with a discussion of abstraction.

Implementing a trait is separate from declaring the data structure. An implementation can supply required methods and override defaults. A default method may call another method from the same trait, so shared behavior can depend on each implementor's primitive operation. Trait methods can receive &self, &mut self, or self; these choices mean observing, modifying, or consuming the value. Design this ownership contract before adding more methods.`,
    ),
    section(
      'Bounds describe what the body needs',
      `The total function accepts a borrowed slice of one concrete T. Its bound permits calling cents, while borrowing lets the caller retain every item. A where clause expresses the same constraints as inline bounds and becomes easier to read as parameters grow. Require Clone only when the algorithm actually clones; require Debug only when formatting a diagnostic is part of the function. Unnecessary bounds restrict users and often hide an ownership problem.

Rust usually generates specialized code for each concrete generic instantiation. This monomorphization enables static dispatch and optimization, though many instantiations can increase compile time and binary size. Generics do not inherently allocate memory. A slice itself is a borrowed view; the vector or array behind it determines where the elements live.`,
    ),
    section(
      'Coherence keeps method selection predictable',
      `You may implement your own trait for a foreign type, or a foreign trait for your own type, subject to the detailed coherence rules. You cannot generally implement someone else's trait for someone else's type. This orphan restriction prevents unrelated dependencies from providing conflicting implementations. Wrap an external value in a local newtype when you need a distinct contract or an otherwise unavailable implementation.

Blanket implementations apply a trait to a family of types satisfying bounds, which is powerful but can overlap with future implementations. Consider public trait implementations part of your API. When reading an error about an unsatisfied bound, find the operation that required the bound and decide whether to add that capability or change the algorithm. Do not add traits until the compiler stops complaining without understanding the requirement.`,
    ),
  ],
  example: rust`trait Price {
    fn cents(&self) -> u32;
    fn is_free(&self) -> bool { self.cents() == 0 }
}
struct Book(u32);
impl Price for Book { fn cents(&self) -> u32 { self.0 } }
fn total<T>(items: &[T]) -> u32 where T: Price {
    items.iter().map(Price::cents).sum()
}
fn main() {
    let books = [Book(1200), Book(800)];
    println!("total: {} cents", total(&books));
    println!("free: {}", books[0].is_free());
}`,
  expectedOutput: 'total: 2000 cents\nfree: false\n',
  exercise: {
    prompt:
      'Implement Area for Square and make total_area sum a borrowed slice. The supplied squares should total 25.',
    hint: 'A square has side × side area. Use a generic T: Area and iterate over references.',
    starter: rust`trait Area { fn area(&self) -> u32; }
struct Square(u32);
impl Area for Square { fn area(&self) -> u32 { 0 } }
fn total_area<T: Area>(_items: &[T]) -> u32 { 0 }
fn main() { println!("{}", total_area(&[Square(3), Square(4)])); }`,
    solution: rust`trait Area { fn area(&self) -> u32; }
struct Square(u32);
impl Area for Square { fn area(&self) -> u32 { self.0 * self.0 } }
fn total_area<T: Area>(items: &[T]) -> u32 {
    items.iter().map(Area::area).sum()
}
fn main() { println!("{}", total_area(&[Square(3), Square(4)])); }`,
    expectedOutput: '25\n',
  },
  quiz: {
    question: 'Why does fn inspect<T>(value: T) not automatically allow value.clone()?',
    options: [
      'All generics are dynamically dispatched',
      'T needs a Clone bound because the body must work for every permitted T',
      'Only owned types can implement Clone',
      'Generic functions cannot call methods',
    ],
    answer: 1,
    explanation: 'A bound makes the required operation part of the generic function contract.',
  },
  references: [
    reference('The Book: traits', 'https://doc.rust-lang.org/book/ch10-02-traits.html'),
    reference(
      'Reference: coherence',
      'https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence',
    ),
  ],
  tags: ['generics', 'traits', 'where', 'coherence'],
};
