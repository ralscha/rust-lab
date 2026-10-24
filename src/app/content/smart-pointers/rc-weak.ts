import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const rcWeakLesson: Lesson = {
  id: 'rc-weak',
  title: 'Rc, Weak, and ownership graphs',
  minutes: 22,
  summary:
    'Share ownership on one thread and break cycles by distinguishing ownership from observation.',
  objectives: [
    'Clone an Rc without cloning its payload',
    'Use Weak::upgrade to observe a possibly dropped owner',
    'Identify ownership cycles',
  ],
  sections: [
    section(
      'Several owners of one value',
      `Rc<T> provides reference-counted ownership for a single-threaded context. Cloning an Rc increments a strong count and creates another handle to the same allocation; it does not invoke T::clone. Writing Rc::clone(&value) makes this sharing operation visible to readers. The payload is destroyed when its last strong owner disappears, although weak handles can keep the allocation's bookkeeping alive longer.

Shared ownership still does not grant arbitrary mutation. A reference obtained through a shared Rc is shared, so normal borrowing rules apply. If you need mutation, first ask whether one component can own and modify the value while other components borrow it temporarily. Interior-mutability containers can support genuinely shared mutation, but they introduce their own access contracts and sometimes runtime failures.`,
    ),
    section(
      'Ownership is a graph',
      `A tree naturally gives each child one owner, but many applications also need links back to parents, caches, or cross-references. If every relationship is a strong Rc, a cycle can keep all its nodes alive even when the rest of the program drops its handles. Reference counting detects the absence of strong owners, not whether a group of owners is unreachable from the application's roots.

Weak<T> records a non-owning relationship. Rc::downgrade creates it, and upgrade attempts to obtain a new strong owner. The result is Option<Rc<T>> because the payload may already have been destroyed. Always handle that possibility. A parent often owns children strongly, while each child refers back to the parent weakly. The direction should follow the domain's ownership meaning rather than a rule that every back-reference must mechanically use Weak.`,
    ),
    section(
      'Counts are a teaching aid',
      `The example prints strong counts to show that aliasing the handle leaves the payload shared. Production behavior should rarely depend on observing a reference count because an extra temporary clone can alter it. Use upgrade or ownership-aware APIs instead of treating counts as a stable business signal. Rc::get_mut can provide mutable access only when the required uniqueness conditions hold; Rc::make_mut supports clone-on-write when the payload can be cloned.

Rc is not Send or Sync, so it cannot be used to share ownership between ordinary threads. Arc uses atomic reference counts for that context, but the payload must still satisfy the relevant thread-safety bounds. Choosing Rc versus Arc answers where ownership is shared; choosing RefCell versus Mutex answers how mutable access is controlled. Keeping these two questions separate makes pointer-heavy designs easier to reason about and often reveals when a plain owned value would be sufficient.`,
    ),
  ],
  example: rust`use std::rc::Rc;
fn main() {
    let owner = Rc::new(String::from("shared"));
    let observer = Rc::downgrade(&owner);
    {
        let alias = Rc::clone(&owner);
        println!("owners: {}", Rc::strong_count(&owner));
        println!("{}", alias);
    }
    println!("owners: {}", Rc::strong_count(&owner));
    drop(owner);
    println!("still alive: {}", observer.upgrade().is_some());
}`,
  expectedOutput: 'owners: 2\nshared\nowners: 1\nstill alive: false\n',
  exercise: {
    prompt:
      'Create two strong owners of a value and one Weak observer. Show that the observer survives the first drop but cannot upgrade after the second.',
    hint: 'Clone the Rc once, downgrade once, then test upgrade().is_some() after each drop.',
    starter: rust`use std::rc::Rc;
fn main() {
    let first = Rc::new(42);
    let observer = Rc::downgrade(&first);
    println!("{}", observer.upgrade().is_some());
}`,
    solution: rust`use std::rc::Rc;
fn main() {
    let first = Rc::new(42);
    let second = Rc::clone(&first);
    let observer = Rc::downgrade(&first);
    drop(first);
    println!("{}", observer.upgrade().is_some());
    drop(second);
    println!("{}", observer.upgrade().is_some());
}`,
    expectedOutput: 'true\nfalse\n',
  },
  quiz: {
    question: 'What does Rc::clone(&value) normally clone?',
    options: [
      'The payload using T::clone',
      'The entire reachable object graph',
      'A separate operating-system thread',
      'An owning handle, incrementing the strong count',
    ],
    answer: 3,
    explanation:
      'Both handles refer to the same payload. Reference counting controls when that payload is destroyed.',
  },
  references: [
    reference('The Book: Rc', 'https://doc.rust-lang.org/book/ch15-04-rc.html'),
    reference(
      'The Book: reference cycles',
      'https://doc.rust-lang.org/book/ch15-06-reference-cycles.html',
    ),
  ],
  tags: ['Rc', 'Weak', 'ownership graphs', 'cycles'],
};
