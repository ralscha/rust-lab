import type { CourseModule } from '../../course.model';
import { bindingsLesson } from './bindings';
import { primitiveTypesLesson } from './primitive-types';
import { functionsExpressionsLesson } from './functions-expressions';
import { conditionalsLesson } from './conditionals';
import { loopsLesson } from './loops';

export const languageBasicsModule: CourseModule = {
  id: 'language-basics',
  title: 'Values and control flow',
  level: 'Beginner',
  description: 'Variables, primitive types, expressions, functions, conditionals, and loops.',
  lessons: [
    bindingsLesson,
    primitiveTypesLesson,
    functionsExpressionsLesson,
    conditionalsLesson,
    loopsLesson,
  ],
};
