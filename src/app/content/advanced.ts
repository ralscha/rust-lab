import type { CourseModule } from '../course.model';
import { abstractionModule } from './abstraction/index';
import { engineeringModule } from './engineering/index';
import { smartPointersModule } from './smart-pointers/index';
import { concurrencyModule } from './concurrency/index';
import { languageBoundariesModule } from './language-boundaries/index';
import { capstonesModule } from './capstones/index';

export const advancedModules: CourseModule[] = [
  abstractionModule,
  engineeringModule,
  smartPointersModule,
  concurrencyModule,
  languageBoundariesModule,
  capstonesModule,
];
