import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const asyncFuturesPinLesson: Lesson = {
  id: 'async-futures-pin',
  title: 'Async, futures, Pin, and cancellation',
  minutes: 32,
  summary:
    'Understand lazy futures, polling, wakeups, and cancellation before choosing a production async runtime.',
  objectives: [
    'Explain why calling an async function does not execute it immediately',
    'Read the Future::poll contract',
    'Distinguish pinning, scheduling, and cancellation',
  ],
  sections: [
    section(
      'A future is an unfinished computation',
      `Calling an async function constructs a future. Its body makes progress when an executor polls it. An await expression arranges to poll another future and suspend the current computation if the result is not ready. Suspension lets the executor run other work; it does not automatically start a new operating-system thread. Two awaits written sequentially normally perform those operations sequentially unless some separate task or combinator introduces concurrency.

Future::poll receives a pinned mutable reference and a Context containing a Waker. A future returns Ready when finished or Pending when it cannot yet proceed. Before returning Pending, it must arrange for the task to be awakened when progress may be possible. Executors use those wakeups to schedule further polls. Busy-polling every future wastes resources and misses the point of event-driven waiting.`,
    ),
    section(
      'Pin protects address-sensitive state',
      `An async state machine may retain references associated with its own state across suspension points. Pin provides a contract that prevents certain values from being moved out of their pinned location through safe interfaces. It pins the pointee, not necessarily the pointer handle itself. Unpin means the type does not need that restriction, so the additional protection is unnecessary for that type. Box::pin is a convenient safe way to own a pinned future.

The miniature executor below uses the safe Wake trait and thread parking. It is an educational single-future driver, with no timer service, networking reactor, task pool, or I/O integration. It is suitable for this immediate example and futures with compatible external wakeups. Real network applications should use an established runtime and its compatible I/O types. Ordinary blocking file or network operations still block the executing thread inside async code.`,
    ),
    section(
      'Cancellation is a state transition',
      `Dropping a future stops further polling and drops the state it owns. It does not automatically undo earlier side effects, retract a sent message, or cancel separately spawned work. A cancellation-safe operation must leave its owner in a valid, documented state if abandoned at a suspension point. Keep partial progress in an owning structure when callers need to resume it, and make transaction boundaries explicit.

Tasks moved between runtime worker threads often require Send futures, so values retained across await points must satisfy the relevant bounds. Holding a non-Send guard across an await can prevent spawning, and holding a lock across suspension can cause coordination problems even when it compiles. Async methods in traits support static dispatch; an interface intended for dyn needs an explicit compatible representation, commonly a boxed future. Start with ordinary functions for CPU-bound work, and adopt async when coordinating many waiting operations is central to the application.`,
    ),
  ],
  example: rust`use std::{future::Future, sync::Arc, task::{Context, Poll, Wake, Waker}, thread};
struct ThreadWake(thread::Thread);
impl Wake for ThreadWake {
    fn wake(self: Arc<Self>) { self.0.unpark(); }
    fn wake_by_ref(self: &Arc<Self>) { self.0.unpark(); }
}
fn block_on<F: Future>(future: F) -> F::Output {
    let waker = Waker::from(Arc::new(ThreadWake(thread::current())));
    let mut context = Context::from_waker(&waker);
    let mut future = Box::pin(future);
    loop {
        match future.as_mut().poll(&mut context) {
            Poll::Ready(value) => return value,
            Poll::Pending => thread::park(),
        }
    }
}
async fn double(value: u32) -> u32 { value * 2 }
fn main() {
    let result = block_on(async { double(10).await + double(11).await });
    println!("{result}");
}`,
  expectedOutput: '42\n',
  exercise: {
    prompt:
      'Implement an async calculate function that awaits ready(6), multiplies by 7, and returns 42. Poll this immediately-ready future once with the safe waker shown.',
    hint: 'std::future::ready creates a future whose result is already available. Keep the pinned future alive until after polling.',
    starter: rust`use std::{future::{ready, Future}, sync::Arc, task::{Context, Poll, Wake, Waker}};
struct Noop;
impl Wake for Noop { fn wake(self: Arc<Self>) {} }
async fn calculate() -> u32 { ready(0).await }
fn main() {
    let waker = Waker::from(Arc::new(Noop));
    let mut context = Context::from_waker(&waker);
    let mut future = Box::pin(calculate());
    match future.as_mut().poll(&mut context) { Poll::Ready(value) => println!("{value}"), Poll::Pending => panic!("this example must be ready") }
}`,
    solution: rust`use std::{future::{ready, Future}, sync::Arc, task::{Context, Poll, Wake, Waker}};
struct Noop;
impl Wake for Noop { fn wake(self: Arc<Self>) {} }
async fn calculate() -> u32 { let value = ready(6).await; value * 7 }
fn main() {
    let waker = Waker::from(Arc::new(Noop));
    let mut context = Context::from_waker(&waker);
    let mut future = Box::pin(calculate());
    match future.as_mut().poll(&mut context) { Poll::Ready(value) => println!("{value}"), Poll::Pending => panic!("this example must be ready") }
}`,
    expectedOutput: '42\n',
  },
  quiz: {
    question: 'What does dropping an unfinished future guarantee?',
    options: [
      'Its owned state is dropped and that future is no longer polled',
      'All external side effects are rolled back',
      'Every child task is automatically cancelled',
      'Its async body runs to completion first',
    ],
    answer: 0,
    explanation:
      'Cancellation by dropping stops the computation, but rollback and separately spawned work require their own protocols.',
  },
  references: [
    reference('Standard library: Future', 'https://doc.rust-lang.org/std/future/trait.Future.html'),
    reference('Standard library: Pin', 'https://doc.rust-lang.org/std/pin/index.html'),
    reference(
      'The Book: futures and async',
      'https://doc.rust-lang.org/book/ch17-01-futures-and-syntax.html',
    ),
  ],
  tags: ['async', 'Future', 'Pin', 'Wake', 'cancellation'],
};
