import { Component, inject } from '@angular/core';
import { LearningStore } from '../../state/learning.store';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-sidebar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './course-sidebar.component.html',
  styles: [':host { display: contents; }'],
})
export class CourseSidebarComponent {
  readonly vm = inject(LearningStore);
}
