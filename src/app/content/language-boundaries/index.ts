import type { CourseModule } from '../../course.model';
import { macrosLesson } from './macros';
import { unsafeInvariantsLesson } from './unsafe-invariants';
import { ffiLayoutNoStdLesson } from './ffi-layout-no-std';
import { advancedTypesLesson } from './advanced-types';

export const languageBoundariesModule: CourseModule = {
  id: 'language-boundaries',
  title: 'Macros, unsafe & language boundaries',
  level: 'Advanced',
  description: 'Macros, unsafe contracts, FFI, memory layout, no_std, and advanced types.',
  lessons: [macrosLesson, unsafeInvariantsLesson, ffiLayoutNoStdLesson, advancedTypesLesson],
};
