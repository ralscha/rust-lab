import type { Lesson } from '../../course.model';

export const slicesLesson: Lesson = {
  id: 'slices',
  title: 'Slices and borrowed views',
  minutes: 24,
  summary: 'Work with parts of collections while preserving the owner and checking boundaries.',
  objectives: [
    'Accept slices instead of a specific container',
    'Explain slice lengths and indexing behavior',
    'Handle UTF-8 boundaries safely',
  ],
  sections: [
    {
      title: 'A slice is a view into existing storage',
      body: [
        'A slice describes a contiguous region without owning its elements. A shared slice is written &[T], while an exclusive slice is &mut [T]. A slice reference carries information about both the data location and the number of elements. Unlike an array type such as [i32; 4], the slice type does not encode a particular length in its type. This makes slices useful function parameters for arrays, vectors, and smaller regions of either.',
        'Borrowing a slice does not copy its elements or allocate a new container. The owner must remain valid for the slice’s uses. A range selects the region: &values[1..3] includes indexes one and two. The upper endpoint is exclusive. The shorthand .. can select the full region, and omitted endpoints use the beginning or end. Empty slices are valid and often simplify APIs because zero elements need no special container type.',
      ],
    },
    {
      title: 'Boundaries are checked',
      body: [
        'Indexing a slice with an invalid index or range panics. The get method provides a checked alternative that returns Option, allowing absence to be handled as an ordinary value. Choose indexing when an invariant establishes validity and a panic would reveal a programming bug; choose get when the requested position may legitimately be unavailable. A slice’s length is a usize, and iteration is often clearer than manual index arithmetic.',
        'For exclusive access to disjoint regions, split_at_mut safely divides a mutable slice at a checked boundary. This API gives the compiler a trusted way to represent nonoverlapping access. Two arbitrary indexed mutable borrows may be rejected even when the programmer believes their indexes differ. Use library operations that express the structural fact rather than trying to outsmart borrow checking with unsafe code.',
      ],
    },
    {
      title: 'String slices add a UTF-8 invariant',
      body: [
        'A string slice, &str, is a borrowed region of valid UTF-8 text. String indexes and lengths refer to bytes, so a valid substring boundary must also lie between encoded Unicode scalar values. A numeric range can be within the byte length yet still split a multibyte character and panic when indexed. String get returns None for an invalid UTF-8 boundary, making it useful when offsets are uncertain.',
        'The example uses an integer slice and a safe ASCII word split to show the shared idea of borrowed views. The exercise computes the sum of a middle region without creating another vector. Afterward, change the selected range and verify which values it contains. When working with real text, prefer character-aware or delimiter-aware APIs when the task describes characters or words, rather than treating arbitrary byte positions as character indexes.',
      ],
    },
  ],
  example: `fn sum(values: &[i32]) -> i32 {
    values.iter().sum()
}

fn main() {
    let numbers = [3, 5, 7, 9];
    let middle = &numbers[1..3];
    let title = String::from("Rust notebook");
    let first = title.split_whitespace().next().unwrap_or("");
    println!("Middle sum: {}", sum(middle));
    println!("First word: {first}");
    println!("Missing index: {:?}", numbers.get(8));
}`,
  expectedOutput: 'Middle sum: 12\nFirst word: Rust\nMissing index: None',
  exercise: {
    prompt:
      'Write sum_middle using the slice passed to it. Call it on indexes 1 through 3 of [10, 20, 30, 40, 50] and print 90.',
    hint: 'The range 1..4 selects 20, 30, and 40. Sum with a loop or iter().sum().',
    starter: `fn sum_middle(values: &[i32]) -> i32 {
    // TODO: sum all elements in this borrowed slice.
    let _ = values;
    0
}

fn main() {
    let values = [10, 20, 30, 40, 50];
    println!("{}", sum_middle(&values[1..4]));
}`,
    solution: `fn sum_middle(values: &[i32]) -> i32 {
    values.iter().sum()
}

fn main() {
    let values = [10, 20, 30, 40, 50];
    println!("{}", sum_middle(&values[1..4]));
}`,
    expectedOutput: '90',
  },
  quiz: {
    question: 'What does taking &values[1..3] do?',
    options: [
      'Borrows elements at indexes 1 and 2',
      'Allocates a new vector',
      'Includes indexes 1, 2, and 3',
      'Transfers ownership of the whole array',
    ],
    answer: 0,
    explanation:
      'The half-open range excludes index 3. The slice borrows the selected elements without copying them.',
  },
  references: [
    { label: 'The slice type', url: 'https://doc.rust-lang.org/book/ch04-03-slices.html' },
    { label: 'Slice methods', url: 'https://doc.rust-lang.org/std/primitive.slice.html' },
    { label: 'String slice methods', url: 'https://doc.rust-lang.org/std/primitive.str.html' },
  ],
  tags: ['slices', 'ranges', 'UTF-8', 'get', 'split_at_mut'],
};
