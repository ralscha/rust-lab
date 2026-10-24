import type { Lesson } from '../../course.model';

export const closuresLesson: Lesson = {
  id: 'closures',
  title: 'Closures and captured environments',
  minutes: 28,
  summary: 'Pass behavior as a value and understand how captures determine Fn, FnMut, and FnOnce.',
  objectives: [
    'Write closures with inferred parameter types',
    'Explain borrowing, mutation, and move captures',
    'Choose an appropriate callable trait bound',
  ],
  sections: [
    {
      title: 'A closure carries behavior and context',
      body: [
        'A closure is an anonymous function-like value written with parameters between vertical bars. It can capture values from its surrounding scope, allowing behavior to depend on local configuration without adding every dependency as an explicit parameter. The compiler often infers parameter and return types from use. Unlike a generic function, a particular closure’s inferred parameter types are fixed by their context; one closure is not automatically polymorphic over unrelated input types.',
        'Each closure expression has its own anonymous type containing the captured environment it needs. You can pass it to generic functions using callable trait bounds, and a noncapturing closure can sometimes coerce to a function pointer. Capturing closures need storage for their environment, which explains why a plain function pointer cannot represent every closure. Later lessons cover returning closures with impl Trait and storing dynamically selected callables with trait objects.',
      ],
    },
    {
      title: 'Capture mode and call behavior are related but distinct',
      body: [
        'The compiler captures values with the access needed by the body: shared borrowing, exclusive borrowing, or ownership. The move keyword requests ownership capture, which is useful when a closure must outlive the current borrowing context. Moving a Copy value copies it into the environment. A move closure is not automatically callable only once; its callable capabilities depend on what the body does with the captured values.',
        'FnOnce permits consuming the closure and is the least restrictive bound, so it accepts the widest range of callables. FnMut permits repeated calls through exclusive access and includes closures that mutate captured state. Fn permits calls through shared access and includes closures that only read their captures. A closure that moves an owned String out of its environment can only be called once. A closure that owns a String but merely reads it can still support Fn.',
      ],
    },
    {
      title: 'Select bounds from the operation you need',
      body: [
        'A helper that invokes its argument once should generally accept FnOnce, allowing the widest range of callers. A helper that repeatedly invokes a state-changing callback needs FnMut. Fn is appropriate when calls only require shared access to the closure. These bounds express how the helper uses the callable; they are not rankings of quality. Requiring a stronger capability without a reason excludes otherwise valid closures.',
        'The example first captures an offset for a read-only calculation, then mutates a running total with another closure. Its helper accepts FnMut because it invokes the callback twice and allows state changes. The exercise asks you to adapt that structure to a visit counter. Observe when the closure’s borrow of the counter ends: after the last callback use, the original counter can be read again. Closures therefore connect ordinary function behavior directly to the ownership and lifetime rules you already learned.',
      ],
    },
  ],
  example: `fn apply_twice<F: FnMut(i32)>(mut action: F) {
    action(2);
    action(3);
}

fn main() {
    let offset = 10;
    let add_offset = |value| value + offset;
    println!("Adjusted: {}", add_offset(5));
    let mut total = 0;
    apply_twice(|value| total += value);
    println!("Accumulated: {total}");
}`,
  expectedOutput: 'Adjusted: 15\nAccumulated: 5',
  exercise: {
    prompt:
      'Implement repeat_three so it calls an FnMut() callback three times. Use a closure to increment visits and print Visits: 3.',
    hint: 'Take mut action: F where F: FnMut(), call action() in a loop, and borrow visits through the closure.',
    starter: `fn repeat_three<F: FnMut()>(mut action: F) {
    // TODO: invoke the callback three times.
    let _ = &mut action;
}

fn main() {
    let mut visits = 0;
    repeat_three(|| visits += 1);
    println!("Visits: {visits}");
}`,
    solution: `fn repeat_three<F: FnMut()>(mut action: F) {
    for _ in 0..3 {
        action();
    }
}

fn main() {
    let mut visits = 0;
    repeat_three(|| visits += 1);
    println!("Visits: {visits}");
}`,
    expectedOutput: 'Visits: 3',
  },
  quiz: {
    question: 'Does move automatically mean a closure implements only FnOnce?',
    options: [
      'Yes, every move closure is single-use',
      'Yes, unless all captures are integers',
      'No, move closures never own values',
      'No, call traits depend on what the body does with its captures',
    ],
    answer: 3,
    explanation:
      'move controls capture ownership. A closure that owns data but only reads it may still implement Fn and be called repeatedly.',
  },
  references: [
    {
      label: 'Closure expressions',
      url: 'https://doc.rust-lang.org/reference/expressions/closure-expr.html',
    },
    {
      label: 'Closure types and call traits',
      url: 'https://doc.rust-lang.org/reference/types/closure.html',
    },
    { label: 'FnMut', url: 'https://doc.rust-lang.org/std/ops/trait.FnMut.html' },
  ],
  tags: ['closures', 'captures', 'move', 'Fn', 'FnMut', 'FnOnce'],
};
