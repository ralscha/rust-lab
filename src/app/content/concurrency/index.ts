import type { CourseModule } from '../../course.model';
import { threadsSendSyncLesson } from './threads-send-sync';
import { channelsMutexLesson } from './channels-mutex';
import { atomicsOrderingLesson } from './atomics-ordering';
import { asyncFuturesPinLesson } from './async-futures-pin';

export const concurrencyModule: CourseModule = {
  id: 'concurrency',
  title: 'Threads, synchronization & async',
  level: 'Advanced',
  description: 'Threads, channels, shared state, atomics, futures, and async.',
  lessons: [
    threadsSendSyncLesson,
    channelsMutexLesson,
    atomicsOrderingLesson,
    asyncFuturesPinLesson,
  ],
};
