import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const threadsSendSyncLesson: Lesson = {
  id: 'threads-send-sync',
  title: 'Threads, scoped borrowing, Send and Sync',
  minutes: 24,
  summary:
    'Run work concurrently while making captured ownership, completion, and thread-safety bounds explicit.',
  objectives: [
    'Join spawned threads',
    'Use scoped threads to borrow local data',
    'Explain Send and Sync without assuming they prevent all concurrency bugs',
  ],
  sections: [
    section(
      'A new thread needs valid captures',
      `std::thread::spawn starts an operating-system thread and returns a JoinHandle. The closure commonly uses move to take ownership of captured data. Because an unscoped thread might outlive the function that launched it, its captured values must satisfy the required 'static lifetime bound. Owned data often meets that bound; a borrow of a short-lived local variable does not. move changes how captures are acquired, but moving a reference does not make the referent live longer.

Calling join waits for completion and returns either the thread's result or information that it panicked. Dropping a JoinHandle does not wait for the worker. Therefore collect and join handles when the program needs completed work or must account for failures. Thread execution order is not predictable, so the example prints results after joining rather than printing from racing workers.`,
    ),
    section(
      'Borrowing within a bounded scope',
      `thread::scope creates a region in which spawned scoped threads are guaranteed to finish before the scope returns. This permits workers to borrow non-static local data safely. Split a slice into disjoint pieces when workers need independent mutable access, or share immutable slices for reading. The compiler checks that those borrows obey the same exclusivity rules used in single-threaded code.

Scoped threads are useful for dividing a finite CPU task over existing data. They still have operating-system scheduling and creation costs, so creating a new thread for every tiny operation can be wasteful. Long-lived worker pools are often appropriate for repeated work. Parallel execution can improve throughput only when the computation and available resources justify the coordination overhead.`,
    ),
    section(
      'The two marker traits',
      `Send means a type can safely transfer ownership between threads. Sync means a shared reference to the type can safely cross thread boundaries; formally, T is Sync when &T is Send. Many types acquire these traits automatically from their fields. Rc is excluded because its reference counting is not atomic. Arc can share ownership safely when the relevant payload bounds hold. RefCell does not make shared access synchronized.

These traits prevent broad classes of data races, but safe Rust can still deadlock, process messages in an unintended order, or compute a wrong result because a protocol is flawed. Treat a concurrency design as both an ownership proof and a coordination protocol. Prefer returning a worker's result or transferring it through a channel when shared mutation is unnecessary. The exercise uses scoped borrowing so the original array remains available after all workers complete.`,
    ),
  ],
  example: rust`use std::thread;
fn main() {
    let values = [1, 2, 3, 4, 5, 6];
    let total = thread::scope(|scope| {
        let (left, right) = values.split_at(3);
        let a = scope.spawn(move || left.iter().sum::<i32>());
        let b = scope.spawn(move || right.iter().sum::<i32>());
        a.join().unwrap() + b.join().unwrap()
    });
    println!("sum: {total}");
    println!("original: {} values", values.len());
}`,
  expectedOutput: 'sum: 21\noriginal: 6 values\n',
  exercise: {
    prompt:
      'Use two scoped threads to double the disjoint halves of an array in place, then print the complete array.',
    hint: 'split_at_mut gives two nonoverlapping mutable slices. Move each slice into its scoped closure.',
    starter: rust`fn main() { let values = [1, 2, 3, 4]; println!("{:?}", values); }`,
    solution: rust`use std::thread;
fn main() {
    let mut values = [1, 2, 3, 4];
    thread::scope(|scope| {
        let (left, right) = values.split_at_mut(2);
        scope.spawn(move || { for value in left { *value *= 2; } });
        scope.spawn(move || { for value in right { *value *= 2; } });
    });
    println!("{:?}", values);
}`,
    expectedOutput: '[2, 4, 6, 8]\n',
  },
  quiz: {
    question: 'Why can a scoped thread borrow a local slice?',
    options: [
      'The scope guarantees that its threads finish before the borrowed data can leave the scope',
      'The slice is automatically copied',
      'Scoped threads disable Send checks',
      'All stack values are static',
    ],
    answer: 0,
    explanation:
      'The bounded lifetime of scoped workers permits borrows that would be invalid for unscoped spawn.',
  },
  references: [
    reference(
      'Standard library: thread::scope',
      'https://doc.rust-lang.org/std/thread/fn.scope.html',
    ),
    reference(
      'The Book: Send and Sync',
      'https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html',
    ),
  ],
  tags: ['threads', 'Send', 'Sync', 'scoped threads'],
};
