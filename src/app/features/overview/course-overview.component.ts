import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';

@Component({
  selector: 'app-course-overview',
  standalone: true,
  imports: [],
  templateUrl: './course-overview.component.html',
  styles: [':host { display: contents; }'],
})
export class CourseOverviewComponent {
  readonly vm = inject(LearningStore);
}
