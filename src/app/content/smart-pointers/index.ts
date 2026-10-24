import type { CourseModule } from '../../course.model';
import { boxDerefDropLesson } from './box-deref-drop';
import { rcWeakLesson } from './rc-weak';
import { cellRefcellLesson } from './cell-refcell';
import { cowOwnedBorrowedLesson } from './cow-owned-borrowed';

export const smartPointersModule: CourseModule = {
  id: 'smart-pointers',
  title: 'Smart pointers & shared ownership',
  level: 'Advanced',
  description: 'Box, Rc, Weak, interior mutability, and owned or borrowed data.',
  lessons: [boxDerefDropLesson, rcWeakLesson, cellRefcellLesson, cowOwnedBorrowedLesson],
};
