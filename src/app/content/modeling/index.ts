import type { CourseModule } from '../../course.model';
import { structsMethodsLesson } from './structs-methods';
import { enumsLesson } from './enums';
import { patternsLesson } from './patterns';
import { optionLesson } from './option';
import { resultLesson } from './result';

export const modelingModule: CourseModule = {
  id: 'modeling',
  title: 'Model data and handle absence',
  level: 'Intermediate',
  description: 'Structs, enums, pattern matching, Option, and Result.',
  lessons: [structsMethodsLesson, enumsLesson, patternsLesson, optionLesson, resultLesson],
};
