import type { Lesson } from '../../course.model';

export const vectorsLesson: Lesson = {
  id: 'vectors',
  title: 'Vectors and growable sequences',
  minutes: 24,
  summary:
    'Store a runtime-sized sequence and select the appropriate borrowing or ownership iteration mode.',
  objectives: [
    'Create, grow, and inspect Vec values',
    'Distinguish length from capacity',
    'Choose iter, iter_mut, or into_iter',
  ],
  sections: [
    {
      title: 'A vector owns a sequence of values',
      body: [
        'Vec<T> stores a growable contiguous sequence whose elements all have type T. Use vec![...] for known initial elements or Vec::new() for an empty vector. The compiler can often infer T from later pushes, but an annotation may be needed when there is insufficient context. push appends an element, while pop removes and returns the last element as Option<T>. An empty vector is valid, so pop must represent the absence of a last element.',
        'A vector has both a length and a capacity. Length counts initialized elements; capacity describes how much element storage can be used without reallocating. Vec::with_capacity reserves space but does not create initialized elements. Indexing beyond length remains invalid even when capacity is larger. Reserving an estimate can reduce allocation work in a known growth pattern, but measure before treating capacity tuning as an important optimization.',
      ],
    },
    {
      title: 'Growth interacts with borrowing',
      body: [
        'When a vector grows beyond its capacity, it may move its allocation. Existing references to elements would then be invalid, so Rust rejects conflicting mutation while those references remain in use. This is a concrete reason for borrowing rules rather than an arbitrary restriction. Finish using a borrowed element before changing the vector, store an index when that is the correct abstraction, or reorganize the algorithm into separate reading and editing phases.',
        'Indexing with brackets panics outside the valid range. get returns Option<&T>, and get_mut returns Option<&mut T>. These APIs make uncertain positions explicit. Removing an element from the middle with remove preserves order but shifts later elements. swap_remove can be cheaper when order is irrelevant because it fills the hole with the last element. The choice is about required behavior before it is about speed.',
      ],
    },
    {
      title: 'Iteration exposes your access requirements',
      body: [
        'iter borrows elements as &T, iter_mut provides &mut T, and into_iter on an owned vector consumes it and yields owned T values. A for loop over &values or &mut values expresses the corresponding borrowing form. This choice determines whether elements can be inspected, modified, or moved out. Numeric elements may hide the distinction because they are Copy, so repeat experiments with String to see ownership consequences clearly.',
        'The example mutates each score through an exclusive iterator, then removes the final score. The exercise filters a vector with retain and sorts the remaining values. retain runs a predicate and preserves only matching elements in place. Sorting changes order, so ensure that is intended. After the exercise, try an empty vector and a vector where every item is removed; well-designed collection code should handle those ordinary cases without special panics.',
      ],
    },
  ],
  example: `fn main() {
    let mut scores = vec![3, 5, 8];
    scores.push(10);
    for score in &mut scores {
        *score += 1;
    }
    let last = scores.pop();
    println!("Scores: {scores:?}");
    println!("Removed: {last:?}; length: {}", scores.len());
}`,
  expectedOutput: 'Scores: [4, 6, 9]\nRemoved: Some(11); length: 3',
  exercise: {
    prompt:
      'Keep only positive values in [3, -1, 5, 0, 2], sort them ascending, and print [2, 3, 5].',
    hint: 'Use retain with a predicate followed by sort().',
    starter: `fn main() {
    let values = vec![3, -1, 5, 0, 2];
    // TODO: make values mutable, retain positive elements, then sort.
    println!("{values:?}");
}`,
    solution: `fn main() {
    let mut values = vec![3, -1, 5, 0, 2];
    values.retain(|value| *value > 0);
    values.sort();
    println!("{values:?}");
}`,
    expectedOutput: '[2, 3, 5]',
  },
  quiz: {
    question: 'What does Vec::with_capacity(10) establish for a new vector?',
    options: [
      'Ten initialized elements',
      'An empty vector with room reserved for at least ten elements',
      'An array whose length cannot change',
      'A vector that can never reallocate',
    ],
    answer: 1,
    explanation:
      'Capacity is reserved storage. Length remains zero until elements are initialized through operations such as push.',
  },
  references: [
    { label: 'Vectors', url: 'https://doc.rust-lang.org/book/ch08-01-vectors.html' },
    { label: 'Vec API', url: 'https://doc.rust-lang.org/std/vec/struct.Vec.html' },
  ],
  tags: ['Vec', 'capacity', 'iter_mut', 'retain', 'sort'],
};
