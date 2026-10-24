import type { Lesson } from '../../course.model';

export const borrowingLesson: Lesson = {
  id: 'borrowing',
  title: 'Shared and mutable references',
  minutes: 28,
  summary: 'Let functions read or change values without taking ownership.',
  objectives: [
    'Pass shared and exclusive borrows',
    'Explain why conflicting access is rejected',
    'Recognize when a borrow’s last use ends',
  ],
  sections: [
    {
      title: 'Borrowing separates access from ownership',
      body: [
        'A reference lets code access a value owned elsewhere. Writing &value creates a shared borrow; a parameter such as &str can inspect borrowed text without taking responsibility for its allocation. A reference must remain valid for every place it is used. The compiler tracks those relationships and rejects a reference that could outlive its referent. Borrowing is therefore a checked permission to access data, not an instruction to duplicate it.',
        'Shared references permit multiple readers. They generally do not permit mutation of the referenced value, except through types explicitly designed for interior mutability, which later lessons cover. A function that counts characters can take &str and work with both string literals and borrowed Strings. Prefer that broadly useful interface over &String when the function does not need String-specific ownership or capacity operations.',
      ],
    },
    {
      title: 'Mutable references represent exclusive access',
      body: [
        'Writing &mut value creates a mutable borrow. While that borrow is active, other access that conflicts with it is prohibited. This rule prevents operations such as changing a vector’s allocation while another reference still points into it. The important idea is exclusive access for mutation, not simply the spelling mut. You may have several mutable references to proven disjoint regions, but the compiler needs evidence that their accesses do not overlap.',
        'A parameter of type &mut i32 can update the caller’s integer by dereferencing with *. Method calls often insert appropriate borrowing and dereferencing automatically, so a function receiving &mut String can call push_str directly. The caller normally needs a mutable binding to create the exclusive borrow. The function returns without becoming the owner, so the caller continues using the same value afterward.',
      ],
    },
    {
      title: 'Borrows follow use, not only braces',
      body: [
        'Rust’s borrow analysis can end a borrow after its last use, even before the surrounding lexical block closes. This allows a shared inspection followed by a later mutation when the old reference is no longer used. If you move that reference’s final use below the mutation, the program may stop compiling because the accesses now overlap. Reading a diagnostic in terms of access intervals is more helpful than counting ampersands.',
        'The example reads a String, mutates it through an exclusive borrow, and then reads the final result. The exercise applies the same idea to an integer. After completing it, add a shared reference that you use after the mutation and inspect the conflict. Repair it by finishing the read before requesting exclusive access. This is the core pattern behind many real borrowing fixes: arrange the program so each phase has the access it actually needs.',
      ],
    },
  ],
  example: `fn character_count(text: &str) -> usize {
    text.chars().count()
}

fn add_exclamation(text: &mut String) {
    text.push('!');
}

fn main() {
    let mut greeting = String::from("Hello");
    println!("Before: {} characters", character_count(&greeting));
    add_exclamation(&mut greeting);
    println!("After: {greeting}");
}`,
  expectedOutput: 'Before: 5 characters\nAfter: Hello!',
  exercise: {
    prompt:
      'Implement increment so it changes the caller’s i32 through a mutable reference. Call it twice to turn 10 into 12.',
    hint: 'Use *value += 1 inside the helper and &mut count at each call.',
    starter: `fn increment(value: &mut i32) {
    // TODO: update the referenced integer.
    let _ = value;
}

fn main() {
    let mut count = 10;
    increment(&mut count);
    increment(&mut count);
    println!("Count: {count}");
}`,
    solution: `fn increment(value: &mut i32) {
    *value += 1;
}

fn main() {
    let mut count = 10;
    increment(&mut count);
    increment(&mut count);
    println!("Count: {count}");
}`,
    expectedOutput: 'Count: 12',
  },
  quiz: {
    question: 'What does &mut T primarily promise while the borrow is active?',
    options: [
      'The value is copied',
      'The value lives forever',
      'Exclusive access to the borrowed data',
      'The value is allocated on the heap',
    ],
    answer: 2,
    explanation:
      'A mutable reference grants exclusive access to its referent for the relevant borrow. It does not transfer ownership or determine allocation placement.',
  },
  references: [
    {
      label: 'References and borrowing',
      url: 'https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html',
    },
    { label: 'Reference types', url: 'https://doc.rust-lang.org/reference/types/pointer.html' },
  ],
  tags: ['references', 'borrowing', 'mutability', '&str', '&mut'],
};
