import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const channelsMutexLesson: Lesson = {
  id: 'channels-mutex',
  title: 'Channels, Arc, and mutex guards',
  minutes: 26,
  summary:
    'Choose between message passing and shared state, then make shutdown and lock scope part of the design.',
  objectives: [
    'Transfer values over a channel',
    'Share a Mutex through Arc',
    'Explain channel closure and lock guard lifetime',
  ],
  sections: [
    section(
      'Ownership can travel through messages',
      `A channel separates the producer of a value from the consumer that processes it. Sending an owned value transfers ownership into the channel; receiving obtains ownership on the other side. The standard mpsc channel supports multiple producers and one consumer. Cloning a sender creates another producer handle. A receiver can iterate until the channel closes, which happens after all sender handles are dropped and buffered messages are drained.

That last detail is a common shutdown bug. If the coordinator keeps an unused sender alive, a receiving loop may wait forever for more messages. Explicitly drop handles whose production role is complete. Unbounded channels can accumulate memory when producers outrun consumers. sync_channel adds a bounded buffer and blocking sends, creating backpressure. Design what should happen when the receiver disappears, since send can fail and return the unsent value.`,
    ),
    section(
      'Shared ownership is not synchronized mutation',
      `Arc<T> uses atomic reference counting so suitable payloads can have owners in several threads. Arc alone does not make arbitrary T safe to mutate. Mutex<T> controls access to a payload: lock returns a guard that grants exclusive access until the guard is dropped. Arc<Mutex<T>> combines shared lifetime management with synchronized mutation. The two wrappers solve different problems.

Keep critical sections short, and avoid calling unknown callbacks or performing slow I/O while holding a lock. If several locks must be acquired, establish a consistent order to reduce deadlock risk. A panic while holding a standard mutex can poison it; subsequent lock attempts return an error that allows a deliberate recovery decision. Poisoning is advisory and does not establish that an invariant is intact or broken in every possible circumstance.`,
    ),
    section(
      'Choose a protocol you can explain',
      `Message passing often works well when one task owns a resource and other tasks request operations. A mutex often works well when a small piece of state must be updated atomically by several workers. RwLock permits multiple readers or one writer, but it has its own contention and scheduling behavior, so it is not automatically faster. Measure the access pattern that matters.

In asynchronous code, retaining a blocking mutex guard across an await can cause trouble because the task may suspend while holding the lock, and other work may block waiting for it. Release the guard before awaiting whenever possible, or select a runtime-aware primitive when the algorithm genuinely needs asynchronous waiting. The example uses ordinary threads, sends results through a channel, and sorts after collection to make the output deterministic despite scheduling differences.`,
    ),
  ],
  example: rust`use std::{sync::mpsc, thread};
fn main() {
    let (send, receive) = mpsc::channel();
    let handles: Vec<_> = (1..=3).map(|value| {
        let send = send.clone();
        thread::spawn(move || send.send(value * value).unwrap())
    }).collect();
    drop(send);
    let mut results: Vec<_> = receive.into_iter().collect();
    for handle in handles { handle.join().unwrap(); }
    results.sort_unstable();
    println!("{:?}", results);
}`,
  expectedOutput: '[1, 4, 9]\n',
  exercise: {
    prompt:
      'Share a counter through Arc<Mutex<u32>>. Have four threads increment it 100 times each, join them, and print 400.',
    hint: 'Clone Arc for each worker. Increment through the temporary guard returned by lock().',
    starter: rust`use std::sync::{Arc, Mutex};
fn main() { let count = Arc::new(Mutex::new(0u32)); println!("{}", *count.lock().unwrap()); }`,
    solution: rust`use std::{sync::{Arc, Mutex}, thread};
fn main() {
    let count = Arc::new(Mutex::new(0u32));
    let handles: Vec<_> = (0..4).map(|_| {
        let count = Arc::clone(&count);
        thread::spawn(move || { for _ in 0..100 { *count.lock().unwrap() += 1; } })
    }).collect();
    for handle in handles { handle.join().unwrap(); }
    println!("{}", *count.lock().unwrap());
}`,
    expectedOutput: '400\n',
  },
  quiz: {
    question:
      'A receiver waits for channel completion forever even though workers finished. What should you inspect first?',
    options: [
      'Whether an unused sender handle is still alive',
      'Whether all messages are Copy',
      'Whether the receiver is in a Box',
      'Whether Cargo used release mode',
    ],
    answer: 0,
    explanation:
      'The channel remains open while a sender exists, so a retained coordinator handle can prevent completion.',
  },
  references: [
    reference('Standard library: mpsc', 'https://doc.rust-lang.org/std/sync/mpsc/index.html'),
    reference('Standard library: Mutex', 'https://doc.rust-lang.org/std/sync/struct.Mutex.html'),
    reference('Standard library: Arc', 'https://doc.rust-lang.org/std/sync/struct.Arc.html'),
  ],
  tags: ['channels', 'Arc', 'Mutex', 'backpressure'],
};
