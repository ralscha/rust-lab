import { Component, HostListener, inject } from '@angular/core';
import { LearningStore } from './state/learning.store';
import { AppHeaderComponent } from './layout/header/app-header.component';
import { CourseSidebarComponent } from './layout/sidebar/course-sidebar.component';
import { CourseOverviewComponent } from './features/overview/course-overview.component';
import { LearningWorkspaceComponent } from './features/workspace/learning-workspace.component';
import { FieldNotesComponent } from './features/reference/field-notes.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AppHeaderComponent,
    CourseSidebarComponent,
    CourseOverviewComponent,
    LearningWorkspaceComponent,
    FieldNotesComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly vm = inject(LearningStore);
  @HostListener('window:hashchange') readHash() {
    this.vm.readHash();
  }
  @HostListener('document:keydown', ['$event']) onKey(event: KeyboardEvent) {
    this.vm.onKey(event);
  }
  @HostListener('window:pagehide') saveBeforeLeave() {
    this.vm.saveBeforeLeave();
  }
}
