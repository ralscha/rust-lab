import type { CourseModule } from '../../course.model';
import { vectorsLesson } from './vectors';
import { stringsUnicodeLesson } from './strings-unicode';
import { mapsSetsLesson } from './maps-sets';
import { iteratorsLesson } from './iterators';
import { closuresLesson } from './closures';

export const collectionsModule: CourseModule = {
  id: 'collections',
  title: 'Collections, text, and iteration',
  level: 'Intermediate',
  description: 'Vectors, Unicode strings, maps, sets, iterators, and closures.',
  lessons: [vectorsLesson, stringsUnicodeLesson, mapsSetsLesson, iteratorsLesson, closuresLesson],
};
