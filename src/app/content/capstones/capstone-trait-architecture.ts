import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const capstoneTraitArchitectureLesson: Lesson = {
  id: 'capstone-trait-architecture',
  title: 'Capstone: a storage abstraction and service',
  minutes: 38,
  summary:
    'Build a service over a small storage trait, enforce domain rules once, and substitute an in-memory implementation for tests.',
  objectives: [
    'Define an interface around required behavior',
    'Inject a concrete implementation through generics',
    'Keep persistence concerns separate from domain validation',
  ],
  sections: [
    section(
      'Start from the service behavior',
      `The service records unique task titles. A title must be nonempty after trimming, and the same normalized title cannot be inserted twice. Those rules belong to the service's public contract regardless of where tasks are stored. The storage trait exposes only contains and insert because those are the operations this small service needs. Designing from the consumer's behavior avoids a huge repository interface that every implementation must satisfy.

The in-memory implementation uses BTreeSet, which keeps iteration deterministic and prevents duplicate keys. The service owns its store through a generic parameter S: TaskStore. Static dispatch lets the compiler specialize calls without requiring a trait object or heap allocation. A dynamically selected store could use a dyn-compatible trait object if runtime configuration makes that useful. Choose the dispatch boundary deliberately, rather than assuming every interface requires dynamic dispatch.`,
    ),
    section(
      'Be precise about atomicity and errors',
      `This teaching interface separates contains and insert, which is sufficient for an exclusively owned in-memory store used through &mut self. In a real database with concurrent writers, checking first and inserting later is not an atomic uniqueness guarantee. The persistence layer must enforce a unique constraint or provide an atomic insert-if-absent operation. A strong architecture describes the semantics of operations, not only their method names.

Real storage can fail, so a production trait would return Result and distinguish a conflict from an unavailable database or malformed request. Decide which errors belong to the domain and which should remain infrastructure details. Do not bury all failures behind bool. The example deliberately keeps the store infallible to focus on dependency direction and ownership; extending it to fallible storage should be an explicit next step.`,
    ),
    section(
      'Test the contract using a simple implementation',
      `An in-memory implementation can provide fast, deterministic service tests, but it must implement the same relevant semantics as production storage. A fake that permits duplicates while the real database rejects them can hide a design defect. Write reusable contract tests for multiple implementations when their behavior must agree. Use integration tests for the actual adapter's important transaction and serialization behavior.

Keep networking, disk access, and configuration at the outer layers. The domain service should receive a store that is already configured, which makes ownership and initialization visible. Avoid making every type generic before there is a useful boundary; one well-chosen trait can be more maintainable than dozens of single-method abstractions. In the exercise, add a removal operation with an explicit result indicating whether anything changed. Think through what that result means for a remote store before extending the same interface to asynchronous I/O.`,
    ),
  ],
  example: rust`use std::collections::BTreeSet;
trait TaskStore {
    fn contains(&self, title: &str) -> bool;
    fn insert(&mut self, title: String);
}
#[derive(Default)]
struct MemoryStore(BTreeSet<String>);
impl TaskStore for MemoryStore {
    fn contains(&self, title: &str) -> bool { self.0.contains(title) }
    fn insert(&mut self, title: String) { self.0.insert(title); }
}
struct Tasks<S> { store: S }
impl<S: TaskStore> Tasks<S> {
    fn add(&mut self, title: &str) -> Result<(), &'static str> {
        let title = title.trim();
        if title.is_empty() { return Err("empty title"); }
        if self.store.contains(title) { return Err("duplicate title"); }
        self.store.insert(title.to_owned());
        Ok(())
    }
}
fn main() {
    let mut tasks = Tasks { store: MemoryStore::default() };
    println!("{:?}", tasks.add(" Learn Rust "));
    println!("{:?}", tasks.add("Learn Rust"));
    println!("{:?}", tasks.add(" "));
}`,
  expectedOutput: 'Ok(())\nErr("duplicate title")\nErr("empty title")\n',
  exercise: {
    prompt:
      'Define a Remove trait and implement it for a MemoryStore using BTreeSet<String>. Removing the same title twice must return true and then false.',
    hint: 'BTreeSet::remove accepts a borrowed key and already returns whether an element existed.',
    starter: rust`use std::collections::BTreeSet;
trait Remove { fn remove(&mut self, title: &str) -> bool; }
struct MemoryStore(BTreeSet<String>);
impl Remove for MemoryStore { fn remove(&mut self, _title: &str) -> bool { false } }
fn main() { let mut store = MemoryStore(BTreeSet::from([String::from("learn")])); println!("{}", store.remove("learn")); println!("{}", store.remove("learn")); }`,
    solution: rust`use std::collections::BTreeSet;
trait Remove { fn remove(&mut self, title: &str) -> bool; }
struct MemoryStore(BTreeSet<String>);
impl Remove for MemoryStore { fn remove(&mut self, title: &str) -> bool { self.0.remove(title) } }
fn main() { let mut store = MemoryStore(BTreeSet::from([String::from("learn")])); println!("{}", store.remove("learn")); println!("{}", store.remove("learn")); }`,
    expectedOutput: 'true\nfalse\n',
  },
  quiz: {
    question:
      'Why is contains followed by insert insufficient to enforce uniqueness with concurrent database writers?',
    options: [
      'Traits prohibit database access',
      'Another writer can insert between the check and the write',
      'String cannot be a database key',
      'Generic dispatch is nondeterministic',
    ],
    answer: 1,
    explanation:
      'The combined condition must be enforced atomically by the storage system, for example through a unique constraint.',
  },
  references: [
    reference('The Book: trait contracts', 'https://doc.rust-lang.org/book/ch10-02-traits.html'),
    reference(
      'Standard library: BTreeSet',
      'https://doc.rust-lang.org/std/collections/struct.BTreeSet.html',
    ),
  ],
  tags: ['capstone', 'traits', 'dependency injection', 'testing'],
};
