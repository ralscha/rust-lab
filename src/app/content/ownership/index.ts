import type { CourseModule } from '../../course.model';
import { ownershipMovesLesson } from './ownership-moves';
import { copyCloneLesson } from './copy-clone';
import { borrowingLesson } from './borrowing';
import { slicesLesson } from './slices';
import { lifetimeIntroLesson } from './lifetime-intro';

export const ownershipModule: CourseModule = {
  id: 'ownership',
  title: 'Ownership and borrowing',
  level: 'Beginner',
  description: 'Moves, Copy and Clone, borrowing, slices, and lifetimes.',
  lessons: [
    ownershipMovesLesson,
    copyCloneLesson,
    borrowingLesson,
    slicesLesson,
    lifetimeIntroLesson,
  ],
};
