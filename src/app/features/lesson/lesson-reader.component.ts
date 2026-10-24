import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';
import { LessonQuizComponent } from './lesson-quiz.component';
import { LessonExerciseComponent } from './lesson-exercise.component';
import { LessonNotesComponent } from './lesson-notes.component';

@Component({
  selector: 'app-lesson-reader',
  standalone: true,
  imports: [LessonQuizComponent, LessonExerciseComponent, LessonNotesComponent],
  templateUrl: './lesson-reader.component.html',
  styles: [':host { display: contents; }'],
})
export class LessonReaderComponent {
  readonly vm = inject(LearningStore);
}
