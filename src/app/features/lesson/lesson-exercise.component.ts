import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';

@Component({
  selector: 'app-lesson-exercise',
  standalone: true,
  imports: [],
  templateUrl: './lesson-exercise.component.html',
  styles: [':host { display: contents; }'],
})
export class LessonExerciseComponent {
  readonly vm = inject(LearningStore);
}
