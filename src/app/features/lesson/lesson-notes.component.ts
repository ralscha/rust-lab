import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lesson-notes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lesson-notes.component.html',
  styles: [':host { display: contents; }'],
})
export class LessonNotesComponent {
  readonly vm = inject(LearningStore);
}
