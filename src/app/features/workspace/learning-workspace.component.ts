import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';
import { LessonReaderComponent } from '../lesson/lesson-reader.component';
import { PlaygroundPanelComponent } from '../playground/playground-panel.component';

@Component({
  selector: 'app-learning-workspace',
  standalone: true,
  imports: [LessonReaderComponent, PlaygroundPanelComponent],
  templateUrl: './learning-workspace.component.html',
  styles: [':host { display: contents; }'],
})
export class LearningWorkspaceComponent {
  readonly vm = inject(LearningStore);
}
