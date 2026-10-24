import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const cellRefcellLesson: Lesson = {
  id: 'cell-refcell',
  title: 'Cell, RefCell, and interior mutability',
  minutes: 24,
  summary: 'Mutate through a shared outer reference while preserving a clear access contract.',
  objectives: [
    'Choose Cell for replacement-style access',
    'Explain RefCell runtime borrow checking',
    'Limit the lifetime of Ref and RefMut guards',
  ],
  sections: [
    section(
      'A shared reference with a controlled mutation API',
      `Interior mutability means a type permits changes through a shared reference while preserving Rust's safety requirements through its implementation. This is useful for caches, counters, and graph structures whose public ownership is shared. It is not an exemption allowing arbitrary writes through any &T. The standard containers expose specific safe operations, and their internals rely on UnsafeCell as the fundamental primitive.

Cell<T> moves values in and out rather than lending ordinary references to its contents. For Copy values, get returns a copy and set replaces the stored value. This makes a small integer counter straightforward: reading a copy cannot leave an outstanding reference that conflicts with the next write. Non-Copy payloads can use operations such as replace or take when their bounds allow it. Choose Cell when replacement-style access matches your needs.`,
    ),
    section(
      'Borrow checking at runtime',
      `RefCell<T> allows temporary shared or exclusive access checked at runtime. borrow returns a Ref guard, and borrow_mut returns a RefMut guard. Multiple shared guards are permitted, or one exclusive guard, but not both simultaneously. Violating this rule through the panicking APIs causes a panic; try_borrow and try_borrow_mut instead report the conflict as a Result. The guarantee is memory safety, not freedom from logic errors or runtime failures.

Guards keep the borrow active until they are dropped. A named guard can remain alive longer than the last obvious field access, so use a small block or explicit drop when the next phase needs a different borrow. Calling another method while holding a guard can unexpectedly re-enter the same RefCell, which is a common source of panics in callback-heavy designs. Document such access patterns or restructure the ownership so each phase releases its guard first.`,
    ),
    section(
      'Composing sharing and mutation',
      `Rc<RefCell<T>> combines single-threaded shared ownership with dynamically checked mutable access. The Rc decides when the value is destroyed; the RefCell decides which access is currently permitted. Neither makes the structure thread-safe. A RefCell may be Send when its payload is Send, but it is not Sync, so sharing references to it across threads is disallowed. For coordinated cross-thread mutation, examine Mutex or RwLock instead.

Use interior mutability because the data model requires it, rather than wrapping an entire program in RefCell to avoid borrowing design. Often a function can take &mut self, or a parent can own children and pass temporary borrows. A cache is a useful exception: computing a memoized answer may change an internal field while leaving the object's logical public value unchanged. The example deliberately releases one mutable guard before reading, then demonstrates a recoverable borrow conflict.`,
    ),
  ],
  example: rust`use std::cell::{Cell, RefCell};
fn main() {
    let visits = Cell::new(0);
    visits.set(visits.get() + 1);
    let names = RefCell::new(vec![String::from("Ada")]);
    { let mut write = names.borrow_mut(); write.push(String::from("Grace")); }
    let read = names.borrow();
    println!("visits: {}, names: {}", visits.get(), read.len());
    println!("write blocked: {}", names.try_borrow_mut().is_err());
    drop(read);
    names.borrow_mut().clear();
    println!("remaining: {}", names.borrow().len());
}`,
  expectedOutput: 'visits: 1, names: 2\nwrite blocked: true\nremaining: 0\n',
  exercise: {
    prompt:
      'Implement record(&self, message) using RefCell<Vec<String>> so a shared Logger reference can record messages. Print the number recorded.',
    hint: 'borrow_mut().push(message.to_owned()) mutates the vector through a temporary guard.',
    starter: rust`use std::cell::RefCell;
struct Logger { messages: RefCell<Vec<String>> }
impl Logger { fn record(&self, _message: &str) {} }
fn main() {
    let log = Logger { messages: RefCell::new(Vec::new()) };
    log.record("start"); log.record("finish");
    println!("{}", log.messages.borrow().len());
}`,
    solution: rust`use std::cell::RefCell;
struct Logger { messages: RefCell<Vec<String>> }
impl Logger {
    fn record(&self, message: &str) { self.messages.borrow_mut().push(message.to_owned()); }
}
fn main() {
    let log = Logger { messages: RefCell::new(Vec::new()) };
    log.record("start"); log.record("finish");
    println!("{}", log.messages.borrow().len());
}`,
    expectedOutput: '2\n',
  },
  quiz: {
    question: 'What happens when try_borrow_mut is called while a Ref guard is alive?',
    options: [
      'It waits for the guard to disappear',
      'It returns a borrow error',
      'It creates a second exclusive reference',
      'It clones the payload',
    ],
    answer: 1,
    explanation:
      'RefCell enforces borrowing dynamically; the try_ API reports a conflict without panicking.',
  },
  references: [
    reference('Standard library: cell', 'https://doc.rust-lang.org/std/cell/index.html'),
    reference(
      'The Book: RefCell',
      'https://doc.rust-lang.org/book/ch15-05-interior-mutability.html',
    ),
  ],
  tags: ['Cell', 'RefCell', 'interior mutability', 'guards'],
};
