import type { CourseModule } from '../../course.model';
import { capstoneParserLesson } from './capstone-parser';
import { capstoneCliLesson } from './capstone-cli';
import { capstoneTraitArchitectureLesson } from './capstone-trait-architecture';
import { capstoneParallelReviewLesson } from './capstone-parallel-review';

export const capstonesModule: CourseModule = {
  id: 'capstones',
  title: 'Build with Rust: four capstones',
  level: 'Advanced',
  description: 'Four projects combining parsing, ownership, traits, concurrency, and tests.',
  lessons: [
    capstoneParserLesson,
    capstoneCliLesson,
    capstoneTraitArchitectureLesson,
    capstoneParallelReviewLesson,
  ],
};
