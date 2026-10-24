import type { CourseModule } from '../course.model';
import { foundationModules } from './foundations';
import { advancedModules } from './advanced';

export { foundationModules, advancedModules };

export const courseModules: CourseModule[] = [...foundationModules, ...advancedModules];
