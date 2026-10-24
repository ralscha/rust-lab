import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './app-header.component.html',
  styles: [':host { display: contents; }'],
})
export class AppHeaderComponent {
  readonly vm = inject(LearningStore);
}
