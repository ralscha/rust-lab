import type { Lesson } from '../../course.model';

export const copyCloneLesson: Lesson = {
  id: 'copy-clone',
  title: 'Copy, Clone, and explicit duplication',
  minutes: 20,
  summary:
    'Understand why integers remain usable after assignment while owned buffers usually move.',
  objectives: [
    'Distinguish implicit Copy from explicit Clone',
    'Explain why String is not Copy',
    'Choose duplication based on ownership requirements',
  ],
  sections: [
    {
      title: 'Some values support implicit copying',
      body: [
        'Assigning an integer to another binding leaves both usable because integer types implement Copy. Copy means the value can be duplicated by a simple implicit copy in places that would otherwise move it. Booleans, characters, and many other small values also implement Copy. A tuple is Copy when all its elements are Copy. This property belongs to the type; it is not decided by how often you use a particular variable.',
        'A String cannot be Copy because its representation owns a buffer that must be released. Duplicating only the pointer, length, and capacity as independent owners would violate that ownership responsibility. A shared reference can be Copy because duplicating it creates another borrow rather than another owner. Mutable references are not Copy: duplicating exclusive access would break their central guarantee. These examples show why “small values copy, large values move” is an unreliable rule.',
      ],
    },
    {
      title: 'Clone asks for another value explicitly',
      body: [
        'Clone provides an explicit clone method. A String clone allocates independent text storage and copies the text. Other types can have different cloning behavior: cloning a reference copies the reference, and cloning a reference-counted smart pointer shares ownership of the same allocation. You must read the type’s contract rather than assuming every clone performs a deep recursive copy. The Clone trait tells you an explicit duplication operation exists, not its exact cost.',
        'Copy requires Clone, but Clone does not require Copy. A user-defined type can often derive both when every field permits it. Choosing Copy for a public type is an API decision because users may depend on implicit copying. A type with a destructor cannot implement Copy. Later lessons explain derive attributes and trait implementations in detail; for now, recognize these names as capabilities that affect assignment and calls.',
      ],
    },
    {
      title: 'Choose the least surprising ownership flow',
      body: [
        'Start by deciding whether two independent owned values are needed. If the original text and an edited version must coexist, cloning once at that boundary is clear and appropriate. If a function merely prints text, borrowing avoids unnecessary duplication. If a value is no longer needed by its caller, moving it is a natural transfer. These choices express application design as much as performance.',
        'The example copies an integer and clones a String, then changes only the clone. The original remains unchanged because the text buffers are independent. The exercise repeats that pattern with a shopping list label. After it works, remove clone and inspect why the original becomes unavailable. Then explain why doing the same experiment with an integer still compiles. Being able to predict both outcomes is a stronger understanding than memorizing a collection of types.',
      ],
    },
  ],
  example: `fn main() {
    let attempts = 3;
    let saved_attempts = attempts;
    let original = String::from("draft");
    let mut edited = original.clone();
    edited.push_str(" revised");
    println!("Counts: {attempts}, {saved_attempts}");
    println!("Original: {original}");
    println!("Edited: {edited}");
}`,
  expectedOutput: 'Counts: 3, 3\nOriginal: draft\nEdited: draft revised',
  exercise: {
    prompt:
      'Create an independent clone of base, append ", tea" to the clone, and print both versions.',
    hint: 'The edited binding must be mut, and base.clone() preserves the original owner.',
    starter: `fn main() {
    let base = String::from("bread");
    // TODO: clone base and extend the clone.
    println!("Base: {base}");
    println!("Edited: {base}");
}`,
    solution: `fn main() {
    let base = String::from("bread");
    let mut edited = base.clone();
    edited.push_str(", tea");
    println!("Base: {base}");
    println!("Edited: {edited}");
}`,
    expectedOutput: 'Base: bread\nEdited: bread, tea',
  },
  quiz: {
    question: 'Which statement about Clone is correct?',
    options: [
      'Its duplication behavior depends on the type',
      'It always recursively duplicates every allocation',
      'It transfers ownership without duplication',
      'It is only available for primitive integers',
    ],
    answer: 0,
    explanation:
      'Clone is type-specific. String clones its buffer, while shared ownership wrappers may clone a handle to the same allocation.',
  },
  references: [
    { label: 'Copy trait', url: 'https://doc.rust-lang.org/std/marker/trait.Copy.html' },
    { label: 'Clone trait', url: 'https://doc.rust-lang.org/std/clone/trait.Clone.html' },
  ],
  tags: ['Copy', 'Clone', 'allocation', 'ownership'],
};
