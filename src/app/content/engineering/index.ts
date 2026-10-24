import type { CourseModule } from '../../course.model';
import { modulesVisibilityLesson } from './modules-visibility';
import { cargoWorkspacesLesson } from './cargo-workspaces';
import { errorDesignLesson } from './error-design';
import { testsDocsToolingLesson } from './tests-docs-tooling';

export const engineeringModule: CourseModule = {
  id: 'engineering',
  title: 'Crates, errors & quality',
  level: 'Intermediate',
  description: 'Modules, workspaces, error handling, tests, documentation, and tooling.',
  lessons: [
    modulesVisibilityLesson,
    cargoWorkspacesLesson,
    errorDesignLesson,
    testsDocsToolingLesson,
  ],
};
