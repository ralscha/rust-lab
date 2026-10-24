import type { Lesson } from '../../course.model';

export const mapsSetsLesson: Lesson = {
  id: 'maps-sets',
  title: 'Maps, sets, and entry-based updates',
  minutes: 26,
  summary: 'Choose keyed collections and make iteration order explicit when output must be stable.',
  objectives: [
    'Use HashMap for keyed lookup and updates',
    'Use entry to aggregate counts',
    'Compare hash and ordered collections',
  ],
  sections: [
    {
      title: 'Map keys to values',
      body: [
        'HashMap<K, V> associates unique keys with values. Insert adds a new mapping or replaces the value for an existing key. get borrows a value if the key is present and returns Option otherwise. A map owns its keys and values unless their types are references. Inserting an owned String normally moves it into the map, so ownership decisions still matter even though access happens through keys rather than indexes.',
        'HashMap keys need equality and hashing capabilities that agree: equal keys must hash consistently. Most ordinary scalar and string types already support these traits. Do not mutate a key’s equality or hash meaning while it is stored in a map through interior-mutability tricks, because the collection relies on those properties remaining stable. Use a map when the domain calls for association, not merely because a list is inconvenient to search in one small example.',
      ],
    },
    {
      title: 'The entry API combines lookup and update',
      body: [
        'entry returns a view representing either an occupied or vacant key. or_insert supplies a value when absent and returns a mutable reference to the stored value. This makes counting concise: obtain the entry, default it to zero, and increment the count. or_insert_with computes a default lazily. and_modify can update an existing value before a fallback insertion, which is useful when those two cases have different behavior.',
        'The mutable reference returned from an entry remains a borrow of the map. Finish using it before making conflicting accesses to the map itself. The same exclusivity principles from vectors apply here, even though the internal storage is different. Naming a short-lived entry reference can make an update clearer, but a single expression is often sufficient for a straightforward counter.',
      ],
    },
    {
      title: 'Choose ordering and uniqueness intentionally',
      body: [
        'HashMap iteration order is not a stable output contract. If a test, report, or tutorial needs deterministic ordering, collect and sort the entries or choose BTreeMap, which iterates by key order. BTreeMap keys require ordering rather than hashing. HashSet and BTreeSet store unique values without associated payloads and are useful for membership, deduplication, union, and intersection operations. Their iteration-order distinction follows the corresponding map families.',
        'The example counts words in a HashMap and explicitly sorts the entries before printing them. The exercise uses BTreeMap to create a deterministic character histogram. A histogram over chars counts Unicode scalar values; it does not combine canonically equivalent text or grapheme clusters. This is another case where collection correctness and text semantics are separate concerns. State what your keys mean, choose the collection behavior you require, and make the printed ordering an explicit step.',
      ],
    },
  ],
  example: `use std::collections::HashMap;

fn main() {
    let mut counts = HashMap::new();
    for word in "rust code rust learn code rust".split_whitespace() {
        *counts.entry(word).or_insert(0_u32) += 1;
    }
    let mut entries: Vec<_> = counts.iter().collect();
    entries.sort_by_key(|(word, _)| **word);
    for (word, count) in entries {
        println!("{word}: {count}");
    }
}`,
  expectedOutput: 'code: 2\nlearn: 1\nrust: 3',
  exercise: {
    prompt:
      'Count characters in "banana" using BTreeMap<char, u32> and print the counts in key order.',
    hint: 'Loop over chars(), increment *counts.entry(character).or_insert(0), then iterate over the map.',
    starter: `use std::collections::BTreeMap;

fn main() {
    let counts: BTreeMap<char, u32> = BTreeMap::new();
    // TODO: count characters, then print each key and count.
    for (character, count) in counts {
        println!("{character}: {count}");
    }
}`,
    solution: `use std::collections::BTreeMap;

fn main() {
    let mut counts: BTreeMap<char, u32> = BTreeMap::new();
    for character in "banana".chars() {
        *counts.entry(character).or_insert(0) += 1;
    }
    for (character, count) in counts {
        println!("{character}: {count}");
    }
}`,
    expectedOutput: 'a: 3\nb: 1\nn: 2',
  },
  quiz: {
    question: 'Which collection naturally iterates its keys in sorted order?',
    options: ['HashMap', 'Every HashSet', 'BTreeMap', 'Vec regardless of insertion order'],
    answer: 2,
    explanation:
      'BTreeMap stores keys with an ordering contract and iterates in key order. HashMap iteration order is unspecified.',
  },
  references: [
    { label: 'HashMap API', url: 'https://doc.rust-lang.org/std/collections/struct.HashMap.html' },
    {
      label: 'BTreeMap API',
      url: 'https://doc.rust-lang.org/std/collections/struct.BTreeMap.html',
    },
    {
      label: 'Standard collections overview',
      url: 'https://doc.rust-lang.org/std/collections/index.html',
    },
  ],
  tags: ['HashMap', 'BTreeMap', 'HashSet', 'entry', 'ordering'],
};
