import type { CourseModule } from '../course.model';
import { startModule } from './start/index';
import { languageBasicsModule } from './language-basics/index';
import { ownershipModule } from './ownership/index';
import { modelingModule } from './modeling/index';
import { collectionsModule } from './collections/index';

export const foundationModules: CourseModule[] = [
  startModule,
  languageBasicsModule,
  ownershipModule,
  modelingModule,
  collectionsModule,
];
