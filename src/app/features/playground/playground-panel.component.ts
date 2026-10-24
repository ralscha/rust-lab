import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from '../../editor.component';
import { RunnerOutputComponent } from './runner-output.component';

@Component({
  selector: 'app-playground-panel',
  standalone: true,
  imports: [EditorComponent, RunnerOutputComponent, FormsModule],
  templateUrl: './playground-panel.component.html',
  styles: [':host { display: contents; }'],
})
export class PlaygroundPanelComponent {
  readonly vm = inject(LearningStore);
}
