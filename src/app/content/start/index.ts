import type { CourseModule } from '../../course.model';
import { toolchainLesson } from './toolchain';
import { helloRustLesson } from './hello-rust';
import { cargoProjectsLesson } from './cargo-projects';
import { dependenciesTestsLesson } from './dependencies-tests';
import { compilerWorkflowLesson } from './compiler-workflow';

export const startModule: CourseModule = {
  id: 'start',
  title: 'Start with Rust',
  level: 'Beginner',
  description:
    'Toolchain setup, first programs, Cargo projects, dependencies, and compiler diagnostics.',
  lessons: [
    toolchainLesson,
    helloRustLesson,
    cargoProjectsLesson,
    dependenciesTestsLesson,
    compilerWorkflowLesson,
  ],
};
