import type { CourseModule } from '../../course.model';
import { genericsTraitsLesson } from './generics-traits';
import { associatedTypesDynLesson } from './associated-types-dyn';
import { lifetimesHrtbLesson } from './lifetimes-hrtb';
import { constGenericsGatsLesson } from './const-generics-gats';

export const abstractionModule: CourseModule = {
  id: 'abstraction',
  title: 'Generics, traits & lifetimes',
  level: 'Intermediate',
  description: 'Generics, traits, associated types, dynamic dispatch, and lifetime bounds.',
  lessons: [
    genericsTraitsLesson,
    associatedTypesDynLesson,
    lifetimesHrtbLesson,
    constGenericsGatsLesson,
  ],
};
