import type { Lesson } from '../../course.model';

export const primitiveTypesLesson: Lesson = {
  id: 'primitive-types',
  title: 'Numbers, booleans, characters, and tuples',
  minutes: 24,
  summary: 'Pick suitable primitive types and make arithmetic boundaries explicit.',
  objectives: [
    'Choose signed, unsigned, and floating-point types',
    'Explain integer division and overflow policies',
    'Use char, tuples, and fixed-size arrays',
  ],
  sections: [
    {
      title: 'Numbers have representations and limits',
      body: [
        'Signed integer types such as i32 represent positive and negative whole numbers; unsigned types such as u32 represent nonnegative whole numbers. The number in the type name is the bit width. usize is the platform-sized unsigned type commonly used for collection lengths and indexes. Unsuffixed integer literals often infer to i32, but surrounding code can select another type. Write annotations at boundaries where a precise width or signedness matters.',
        'Integer division discards the fractional part toward zero. The expression 7 / 2 produces 3 when both operands are integers, whereas 7.0 / 2.0 produces a floating-point result. Rust does not silently combine arbitrary numeric types; conversion should be explicit. An as cast can truncate or otherwise change meaning, so prefer conversion APIs such as TryFrom when out-of-range values should be rejected. A cast documents an operation, but it does not by itself validate input.',
      ],
    },
    {
      title: 'Choose the arithmetic failure policy',
      body: [
        'Every fixed-width integer has a finite range. Ordinary overflow is normally checked in development builds and commonly wraps when overflow checks are disabled in optimized builds. Do not let your application’s correctness depend on that profile difference. checked_add returns an Option, saturating_add stops at the type’s boundary, and wrapping_add performs modular arithmetic. These APIs express the policy in the source. Choose the behavior your domain requires rather than whichever result happens to appear in one build.',
        'The f32 and f64 types use binary floating-point representations. Many decimal fractions, including 0.1, cannot be represented exactly. Small rounding differences are expected, so consider tolerances for numerical comparisons and use integer minor units for simple exact monetary calculations when the range and scaling are suitable. Floating-point values can also include infinities and NaN. Later lessons cover ordering and error handling; for now, remember that the mathematical idea of a real number is broader than its machine representation.',
      ],
    },
    {
      title: 'Small compound values',
      body: [
        'bool has the values true and false. A char is a Unicode scalar value, written with single quotes; it is not necessarily one byte or one user-perceived character. A tuple groups a fixed number of values that may have different types. You can destructure it into names or access fields using numeric positions. An array stores a fixed number of values of one type, and its length is part of its type.',
        'The example combines these representations without allocating a growing collection. Notice that checked arithmetic reports failure as a value instead of crashing. In the exercise, choose f64 for an average so division preserves a fractional result, and use a tuple to return related values together. As programs grow, named structs usually communicate meaning better than long tuples, but tuples are convenient for short local combinations.',
      ],
    },
  ],
  example: `fn main() {
    let readings: [i32; 3] = [12, 15, 18];
    let position: (i32, i32) = (4, -2);
    let symbol: char = 'λ';
    println!("Integer division: {}", 7 / 2);
    println!("Mean: {:.1}", (readings[0] + readings[1] + readings[2]) as f64 / 3.0);
    println!("Position: {:?}; symbol: {symbol}", position);
    println!("Checked: {:?}; saturated: {}", 255_u8.checked_add(1), 255_u8.saturating_add(1));
}`,
  expectedOutput:
    'Integer division: 3\nMean: 15.0\nPosition: (4, -2); symbol: λ\nChecked: None; saturated: 255',
  exercise: {
    prompt: 'Destructure (7.0, 10.0), calculate the average as f64, and print Average: 8.5.',
    hint: 'Use let (first, second) = readings and divide their sum by 2.0.',
    starter: `fn main() {
    let readings: (f64, f64) = (7.0, 10.0);
    // TODO: calculate the mean of both tuple fields.
    let average = readings.0;
    println!("Average: {average:.1}");
}`,
    solution: `fn main() {
    let readings: (f64, f64) = (7.0, 10.0);
    let (first, second) = readings;
    let average = (first + second) / 2.0;
    println!("Average: {average:.1}");
}`,
    expectedOutput: 'Average: 8.5',
  },
  quiz: {
    question: 'Which operation explicitly reports integer overflow as an Option?',
    options: ['checked_add', 'as', 'Ordinary + in every profile', 'println!'],
    answer: 0,
    explanation:
      'checked_add returns Some(result) when representable and None on overflow, independent of the usual profile overflow-check setting.',
  },
  references: [
    { label: 'Data types', url: 'https://doc.rust-lang.org/book/ch03-02-data-types.html' },
    { label: 'u8 arithmetic methods', url: 'https://doc.rust-lang.org/std/primitive.u8.html' },
    {
      label: 'Numeric cast semantics',
      url: 'https://doc.rust-lang.org/reference/expressions/operator-expr.html#numeric-cast',
    },
  ],
  tags: ['integers', 'floats', 'bool', 'char', 'tuples', 'arrays', 'overflow'],
};
