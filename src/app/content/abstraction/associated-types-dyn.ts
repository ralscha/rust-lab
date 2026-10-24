import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const associatedTypesDynLesson: Lesson = {
  id: 'associated-types-dyn',
  title: 'Associated types and dynamic dispatch',
  minutes: 24,
  summary:
    'Compare generic parameters, associated types, impl Trait, and dyn Trait without confusing their ownership costs.',
  objectives: [
    'Bind an associated type',
    'Build a heterogeneous collection of trait objects',
    'Recognize dyn-compatible interfaces',
  ],
  sections: [
    section(
      'Who chooses the type?',
      `A trait parameter permits different implementations distinguished by that parameter. An associated type instead belongs to a particular implementation. Iterator is the familiar example: its Item says what that iterator produces. A caller can constrain an associated type with Iterator<Item = String>. This expresses a relationship rather than introducing an unrelated generic parameter. Associated types make signatures concise when one output type naturally belongs to one implementing type.

The Source trait below names its output Item. Counter fixes that item to u32. This is useful when composing abstractions: a consumer can require Source<Item = u32> without knowing how values are stored. The type relationship is checked at compile time, and no runtime type tag is necessary. Associated constants similarly attach values to implementations, though they affect whether the trait can become a trait object.`,
    ),
    section(
      'One concrete type or a runtime choice',
      `Argument-position impl Trait is shorthand for an anonymous generic parameter. Return-position impl Trait hides one concrete return type selected by the function; all normal return paths must agree on that concrete type. It is useful for iterator pipelines whose actual types are awkward to spell. It does not mean that the function can return any unrelated implementor on each call.

A dyn Trait object allows the concrete implementor to vary at runtime. It is accessed through a pointer such as &dyn Trait or Box<dyn Trait>. The pointer carries access to both the value and the implementation's method table. A borrowed trait object does not itself allocate. Box allocates because of the ownership container, and dynamic dispatch can inhibit some optimizations. Use this flexibility for open-ended plugins or mixed collections, while an enum often works well for a closed set of variants.`,
    ),
    section(
      'Designing a dyn-compatible boundary',
      `A trait used behind dyn must satisfy dyn-compatibility rules. For example, dispatchable methods cannot introduce type parameters, return opaque impl Trait, or use Self as an arbitrary return type. Methods requiring Self: Sized can remain on a trait while being unavailable through a trait object. Ordinary associated types can be fixed when forming the object, as Box<dyn Iterator<Item = u8>> demonstrates. Generic associated types exposed through the object prevent dyn compatibility; a GAT restricted with where Self: Sized is excluded from trait-object use.

Native async methods in traits are useful with static dispatch, but such a trait's async method is not directly dispatchable through dyn. A deliberately erased interface can return Pin<Box<dyn Future<Output = T> + Send + '_>> when appropriate. That adaptation changes allocation and lifetime requirements, so use it as an explicit design decision. Start with concrete types, introduce generics for reusable algorithms, and add runtime erasure only at the boundary that needs it.`,
    ),
  ],
  example: rust`trait Source { type Item; fn read(&self) -> Self::Item; }
struct Counter(u32);
impl Source for Counter {
    type Item = u32;
    fn read(&self) -> u32 { self.0 }
}
trait Describe { fn describe(&self) -> String; }
impl Describe for Counter {
    fn describe(&self) -> String { format!("counter={}", self.read()) }
}
impl Describe for String { fn describe(&self) -> String { self.clone() } }
fn main() {
    let items: Vec<Box<dyn Describe>> = vec![Box::new(Counter(7)), Box::new(String::from("ready"))];
    for item in items { println!("{}", item.describe()); }
}`,
  expectedOutput: 'counter=7\nready\n',
  exercise: {
    prompt:
      'Implement Draw for Label and Button. Store one of each in a Vec<Box<dyn Draw>> and print their output.',
    hint: 'The trait method can return String. Each Box is coerced to Box<dyn Draw> in the annotated vector.',
    starter: rust`trait Draw { fn draw(&self) -> String; }
struct Label;
struct Button;
fn main() { println!("implement two components"); }`,
    solution: rust`trait Draw { fn draw(&self) -> String; }
struct Label;
struct Button;
impl Draw for Label { fn draw(&self) -> String { "label".into() } }
impl Draw for Button { fn draw(&self) -> String { "[button]".into() } }
fn main() {
    let components: Vec<Box<dyn Draw>> = vec![Box::new(Label), Box::new(Button)];
    for component in components { println!("{}", component.draw()); }
}`,
    expectedOutput: 'label\n[button]\n',
  },
  quiz: {
    question: 'What does a return type impl Iterator<Item = u32> normally hide?',
    options: [
      'A different concrete iterator type for every return path',
      'A mandatory heap allocation',
      'A runtime cast',
      'One concrete iterator type chosen by the function',
    ],
    answer: 3,
    explanation:
      'Return-position impl Trait hides one concrete type; dyn Trait provides runtime type erasure.',
  },
  references: [
    reference(
      'Reference: associated items',
      'https://doc.rust-lang.org/reference/items/associated-items.html',
    ),
    reference(
      'Reference: dyn compatibility',
      'https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility',
    ),
  ],
  tags: ['traits', 'dyn', 'associated types', 'impl Trait'],
};
