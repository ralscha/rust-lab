import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';

@Component({
  selector: 'app-lesson-quiz',
  standalone: true,
  imports: [],
  templateUrl: './lesson-quiz.component.html',
  styles: [':host { display: contents; }'],
})
export class LessonQuizComponent {
  readonly vm = inject(LearningStore);
}
