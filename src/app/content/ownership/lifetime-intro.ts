import type { Lesson } from '../../course.model';

export const lifetimeIntroLesson: Lesson = {
  id: 'lifetime-intro',
  title: 'Lifetimes are relationships',
  minutes: 28,
  summary: 'Read lifetime annotations as constraints on borrowed inputs and outputs.',
  objectives: [
    'Explain why references cannot outlive their data',
    'Read a simple named lifetime',
    'Distinguish lifetime annotations from extending storage',
  ],
  sections: [
    {
      title: 'Every reference has a validity region',
      body: [
        'A lifetime describes where a reference can safely be used. The compiler usually infers these relationships from code, so most functions require no written lifetime names. A reference cannot remain usable after its owner has been destroyed, and exclusive borrows must respect access constraints while active. These requirements prevent dangling references without needing a runtime validity check on each access.',
        'Returning a reference to a String created inside the function is invalid because that String would be dropped when the function returns. The repair depends on the intended ownership: return an owned String, or borrow data supplied by the caller and return a view into it. Adding a lifetime annotation does not keep a local variable alive, allocate memory, or transfer ownership. An annotation describes a relationship the code must satisfy.',
      ],
    },
    {
      title: 'Name the relationship when inference needs help',
      body: [
        'Consider a function that accepts two string slices and returns whichever is longer. The return value could refer to either input. A signature using the same lifetime name for both inputs and the output states that the returned borrow is valid for a region supported by both inputs. It does not demand that the original owners were created at the same time. At a call, the compiler can choose a shorter common region suitable for the use.',
        'The conventional name apostrophe-a is only a parameter name, like T in a generic type. Descriptive lifetime names may help larger signatures, but the name itself carries no special duration. Lifetime elision rules let many simple signatures omit explicit names. A function with one borrowed input returning a borrow can often rely on those rules. When there are multiple possible sources, an explicit relationship may be needed.',
      ],
    },
    {
      title: 'Separate borrowed and owned designs',
      body: [
        'Returning a borrowed slice avoids allocation but ties the caller’s use of that slice to existing data. Returning an owned String permits independent storage but may require allocation and copying. Neither choice is automatically superior; the API should reflect the intended data flow. The special lifetime static can describe references valid for the entire program, such as string literals. It is not a general escape hatch for lifetime errors.',
        'The example returns one of two existing strings and uses the result while both owners remain available. In the exercise, first_nonempty selects an input using the same relationship. Try placing one owner in a smaller inner scope and using the result afterward. The rejection explains that the result might refer to data that no longer exists. Repair the structure by using the result within the valid region or explicitly creating an owned result before the owner disappears.',
      ],
    },
  ],
  example: `fn longer<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() >= right.len() {
        left
    } else {
        right
    }
}

fn main() {
    let first = String::from("rust");
    let second = String::from("ownership");
    let selected = longer(&first, &second);
    println!("Longer: {selected}");
}`,
  expectedOutput: 'Longer: ownership',
  exercise: {
    prompt:
      'Implement first_nonempty to borrow the first input unless it is empty, in which case it borrows the second. Print fallback.',
    hint: 'Use the same named lifetime on both inputs and the return value; select with is_empty().',
    starter: `fn first_nonempty<'a>(first: &'a str, second: &'a str) -> &'a str {
    // TODO: choose first unless it is empty.
    let _ = second;
    first
}

fn main() {
    println!("{}", first_nonempty("", "fallback"));
}`,
    solution: `fn first_nonempty<'a>(first: &'a str, second: &'a str) -> &'a str {
    if first.is_empty() {
        second
    } else {
        first
    }
}

fn main() {
    println!("{}", first_nonempty("", "fallback"));
}`,
    expectedOutput: 'fallback',
  },
  quiz: {
    question: 'What does a lifetime annotation do?',
    options: [
      'Describes a relationship the borrows must satisfy',
      'Keeps local allocations alive indefinitely',
      'Copies borrowed data into the result',
      'Disables ownership checking',
    ],
    answer: 0,
    explanation:
      'Annotations express validity relationships. They do not change when owners are created or dropped.',
  },
  references: [
    {
      label: 'Validating references with lifetimes',
      url: 'https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html',
    },
    { label: 'Lifetime elision', url: 'https://doc.rust-lang.org/reference/lifetime-elision.html' },
  ],
  tags: ['lifetimes', 'elision', 'borrowing', 'static'],
};
