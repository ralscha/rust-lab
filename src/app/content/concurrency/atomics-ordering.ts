import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const atomicsOrderingLesson: Lesson = {
  id: 'atomics-ordering',
  title: 'Atomics and memory ordering',
  minutes: 25,
  summary:
    'Use atomic counters correctly and distinguish indivisible operations from ordering a larger protocol.',
  objectives: [
    'Use atomic read-modify-write for concurrent updates',
    'Explain what Relaxed does and does not guarantee',
    'Recognize when a mutex is the clearer abstraction',
  ],
  sections: [
    section(
      'One indivisible operation',
      `An atomic integer permits concurrent access to that integer through its atomic methods. fetch_add performs a read-modify-write as one atomic operation and returns the previous value. Loading a value and then storing value + 1 is two separate operations; even if each is atomic, another thread can update the counter between them and an increment may be lost. Choose an operation whose atomic boundary matches the state transition you need.

The example uses an AtomicUsize as a count of completed increments. Each worker updates only that independent counter. Relaxed ordering is enough for this purpose because the counter is not being used to publish or protect another memory location. Joining workers gives the coordinator a clear completion boundary before it prints the final result. Atomics are still typed values with specific supported operations, not an invitation to mix atomic and unsynchronized non-atomic access.`,
    ),
    section(
      'Ordering coordinates observations',
      `Memory ordering describes how atomic operations relate to other operations across threads. Relaxed preserves atomicity for the atomic value but does not establish the publication relationship needed for unrelated data. A release operation and a corresponding acquire operation can establish such a relationship when the acquire observes the relevant release or release sequence. The exact protocol matters; naming an ordering is not a proof by itself.

SeqCst adds a single global order for the relevant sequentially consistent operations. It is often a useful starting point, but even the strongest ordering cannot fix a logically incorrect algorithm or make an invalid pointer safe. Compare-and-exchange supports conditional updates and has separate success and failure orderings, with restrictions because a failed operation performs no write. More advanced lock-free algorithms also need to address issues such as reclamation and ABA, beyond simply selecting an ordering.`,
    ),
    section(
      'Keep the proof smaller than the implementation',
      `A mutex can protect several fields under one invariant. Replacing it with several independent atomics may permit combinations of field values that were previously impossible to observe. If a balance and a transaction count must change together, ask what a reader can see between their updates. A small lock often makes the correctness argument much clearer and can perform well when contention is low.

Use atomics for narrow, well-understood state such as independent statistics, flags with a carefully defined protocol, or established concurrent algorithms. Prefer reviewed library implementations for complex queues and reclamation. Tests can find some scheduling bugs, but repeatedly passing tests does not establish that every legal execution is safe. Write down which operation synchronizes with which and which memory becomes visible. This explicit reasoning is the core skill; memorizing that one ordering is faster than another is not sufficient.`,
    ),
  ],
  example: rust`use std::{sync::{Arc, atomic::{AtomicUsize, Ordering}}, thread};
fn main() {
    let count = Arc::new(AtomicUsize::new(0));
    let handles: Vec<_> = (0..4).map(|_| {
        let count = Arc::clone(&count);
        thread::spawn(move || { for _ in 0..250 { count.fetch_add(1, Ordering::Relaxed); } })
    }).collect();
    for handle in handles { handle.join().unwrap(); }
    println!("{}", count.load(Ordering::Relaxed));
}`,
  expectedOutput: '1000\n',
  exercise: {
    prompt:
      'Allocate three unique numeric IDs with fetch_add, beginning at 100. Print each returned ID and the next available value.',
    hint: 'fetch_add returns the old value, so you do not need to subtract one.',
    starter: rust`use std::sync::atomic::{AtomicUsize, Ordering};
fn main() { let next = AtomicUsize::new(100); println!("next: {}", next.load(Ordering::Relaxed)); }`,
    solution: rust`use std::sync::atomic::{AtomicUsize, Ordering};
fn main() {
    let next = AtomicUsize::new(100);
    for _ in 0..3 { println!("id: {}", next.fetch_add(1, Ordering::Relaxed)); }
    println!("next: {}", next.load(Ordering::Relaxed));
}`,
    expectedOutput: 'id: 100\nid: 101\nid: 102\nnext: 103\n',
  },
  quiz: {
    question: 'Why can load followed by store lose increments even on an atomic integer?',
    options: [
      'Atomic integers cannot be shared',
      'The pair is not one indivisible read-modify-write operation',
      'Relaxed always discards writes',
      'The integer must be signed',
    ],
    answer: 1,
    explanation:
      'Other updates can occur between the load and store. fetch_add combines the transition into one atomic operation.',
  },
  references: [
    reference(
      'Standard library: atomic ordering',
      'https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html',
    ),
    reference('Nomicon: atomics', 'https://doc.rust-lang.org/nomicon/atomics.html'),
  ],
  tags: ['atomics', 'Ordering', 'Relaxed', 'concurrency'],
};
