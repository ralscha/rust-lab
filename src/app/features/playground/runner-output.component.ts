import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';

@Component({
  selector: 'app-runner-output',
  standalone: true,
  imports: [],
  templateUrl: './runner-output.component.html',
  styles: [':host { display: contents; }'],
})
export class RunnerOutputComponent {
  readonly vm = inject(LearningStore);
}
