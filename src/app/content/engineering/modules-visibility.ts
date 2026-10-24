import type { Lesson } from '../../course.model';
import { reference, rust, section } from '../helpers';

export const modulesVisibilityLesson: Lesson = {
  id: 'modules-visibility',
  title: 'Modules and public API boundaries',
  minutes: 20,
  summary: 'Organize names and enforce invariants through privacy, paths, and re-exports.',
  objectives: [
    'Use crate, self, and super paths',
    'Keep fields private behind a validating constructor',
    'Distinguish modules, crates, and packages',
  ],
  sections: [
    section(
      'Three different boundaries',
      `A module organizes names and privacy within a crate. A crate is a compilation unit: a library or executable with one crate root. A Cargo package is described by Cargo.toml and can contain a library crate plus binary targets. These concepts often coincide in small projects, which makes them easy to confuse. Splitting a file into modules does not create extra crates, and adding another binary target does not automatically give it access to private library internals.

The crate root is commonly src/lib.rs for a library and src/main.rs for the default executable. A declaration such as mod account; asks the compiler to load that module from its conventional file location. An inline mod account { ... } defines the same kind of namespace directly, which is convenient for the browser examples. A use statement brings a path into scope; it does not load a file or make an otherwise private item accessible.`,
    ),
    section(
      'Privacy protects valid states',
      `Items are private unless made public. For a public struct, fields remain private unless each field is exposed. This lets a constructor validate values and lets later methods assume the invariant continues to hold. The Account below permits only nonempty names. If name were public, callers could bypass new or replace a validated name with an empty string. Privacy is therefore part of correctness, not simply a way to shorten autocomplete lists.

pub(crate) exposes an item only within its crate. More specific visibility forms, including pub(super) and pub(in some::ancestor), can restrict a helper to a surrounding region. Prefer the narrowest boundary that supports the architecture. A public API is a promise to downstream users, and reducing visibility later may break their code.`,
    ),
    section(
      'Stable paths and re-exports',
      `Paths beginning with crate refer to the current crate root. self identifies the current module and super its parent. External crate names can appear at the start of paths once Cargo makes the dependencies available. The precise name resolution rules contain more details, but explicit root paths are useful when reorganizing a larger codebase.

A pub use re-export can provide a simple public entry point while keeping the internal module tree flexible. Here callers use Account directly without depending on the domain module path. Re-exporting a type does not expose its private fields. As projects grow, place reusable behavior in the library and keep binaries focused on input, output, and orchestration. Integration tests then exercise the same public API that another application would use. Organize modules by responsibility and ownership of invariants, rather than creating a file for every tiny type.`,
    ),
  ],
  example: rust`mod domain {
    pub struct Account { name: String }
    impl Account {
        pub fn new(name: &str) -> Result<Self, &'static str> {
            if name.trim().is_empty() { return Err("name cannot be empty"); }
            Ok(Self { name: name.trim().to_owned() })
        }
        pub fn name(&self) -> &str { &self.name }
    }
}
pub use domain::Account;
fn main() {
    let account = Account::new(" Ada ").unwrap();
    println!("{}", account.name());
    println!("{}", Account::new(" ").err().unwrap());
}`,
  expectedOutput: 'Ada\nname cannot be empty\n',
  exercise: {
    prompt:
      'Create a public Percent with a private value. new must reject values over 100 and get must return the validated value.',
    hint: "Return Result<Self, &'static str>. Re-export the type from a module.",
    starter: rust`mod domain { pub struct Percent(u8); }
fn main() { println!("implement a validated percent"); }`,
    solution: rust`mod domain {
    pub struct Percent(u8);
    impl Percent {
        pub fn new(value: u8) -> Result<Self, &'static str> {
            if value <= 100 { Ok(Self(value)) } else { Err("out of range") }
        }
        pub fn get(&self) -> u8 { self.0 }
    }
}
pub use domain::Percent;
fn main() {
    println!("{}", Percent::new(80).unwrap().get());
    println!("{}", Percent::new(120).err().unwrap());
}`,
    expectedOutput: '80\nout of range\n',
  },
  quiz: {
    question: 'Does pub struct Account { name: String } expose name to other crates?',
    options: [
      'Yes, all fields become public',
      'No, the field still needs its own pub visibility',
      'Only in debug builds',
      'Only if Account is re-exported',
    ],
    answer: 1,
    explanation:
      'Struct visibility and field visibility are separate, which allows public types to maintain private invariants.',
  },
  references: [
    reference(
      'The Book: packages and crates',
      'https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html',
    ),
    reference(
      'Reference: visibility',
      'https://doc.rust-lang.org/reference/visibility-and-privacy.html',
    ),
  ],
  tags: ['modules', 'visibility', 'crates', 'API design'],
};
