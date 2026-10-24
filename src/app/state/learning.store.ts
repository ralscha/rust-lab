import { computed, Injectable, OnDestroy, signal } from '@angular/core';
import { courseModules } from '../content/index';
import { CourseModule } from '../course.model';
import { LearningStorageService } from '../services/learning-storage.service';
import { PlaygroundApiService } from '../services/playground-api.service';
import { EditorState } from './editor-state';

export type View = 'overview' | 'lesson' | 'playground' | 'reference';
type LessonTab = 'lesson' | 'exercise' | 'notes';
const PLAYGROUND_STARTER = 'fn main() {\n    println!("Hello, explorer!");\n}\n';

/** Course navigation, progress, and the active lesson's reading/draft context. */
@Injectable({ providedIn: 'root' })
export class LearningStore extends EditorState implements OnDestroy {
  readonly modules = courseModules;
  readonly lessons = this.modules.flatMap((module) => module.lessons);
  readonly totalMinutes = this.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  readonly view = signal<View>('overview');
  readonly selectedId = signal(this.lessons[0].id);
  readonly selected = computed(
    () => this.lessons.find((lesson) => lesson.id === this.selectedId()) ?? this.lessons[0],
  );
  readonly selectedModule = computed(() =>
    this.modules.find((module) =>
      module.lessons.some((lesson) => lesson.id === this.selectedId()),
    )!,
  );
  readonly completed = signal<string[]>([]);
  readonly progress = computed(() =>
    Math.round((this.completed().length / this.lessons.length) * 100),
  );
  readonly search = signal('');
  readonly filteredModules = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.modules
      .map((module) => ({
        ...module,
        lessons: module.lessons.filter(
          (lesson) =>
            !q ||
            `${module.title} ${lesson.title} ${lesson.summary} ${lesson.tags.join(' ')}`
              .toLowerCase()
              .includes(q),
        ),
      }))
      .filter((module) => module.lessons.length);
  });
  readonly activeTab = signal<LessonTab>('lesson');
  // Notes change the reader, while the editor keeps its current draft context.
  readonly editorTab = signal<'lesson' | 'exercise'>('lesson');
  readonly hintOpen = signal(false);
  readonly solutionOpen = signal(false);
  readonly quizAnswer = signal<number | null>(null);
  readonly mobileMenu = signal(false);
  readonly notice = signal('');
  readonly openModules = signal<string[]>([]);
  note = '';
  private saveTimer?: ReturnType<typeof setTimeout>;
  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly storage: LearningStorageService,
    api: PlaygroundApiService,
  ) {
    super(api);
    try {
      this.completed.set(storage.restore(this.lessons.map((lesson) => lesson.id)));
    } catch {
      this.notice.set('Browser storage is unavailable. You can still use the course.');
    }
    this.openModules.set([this.modules[0].id]);
    this.code.set(this.selected().example);
    this.readHash();
    void this.loadVersion();
  }

  readHash() {
    const hash = location.hash.slice(1);
    if (hash.startsWith('lesson/')) {
      const id = hash.slice(7);
      if (this.lessons.some((lesson) => lesson.id === id)) {
        this.openLesson(id, false);
        return;
      }
    }
    this.navigate(hash === 'playground' || hash === 'reference' ? hash : 'overview', false);
  }

  onKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const editing = target?.closest?.(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
    );
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !editing) {
      event.preventDefault();
      if (window.innerWidth <= 760) this.mobileMenu.set(true);
      setTimeout(() => document.querySelector<HTMLInputElement>('.search input')?.focus(), 0);
    }
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === 'Enter' &&
      (this.view() === 'lesson' || this.view() === 'playground')
    ) {
      event.preventDefault();
      void this.run();
    }
    if (event.key === 'Escape') this.mobileMenu.set(false);
  }

  skipToContent(event: Event) {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  }

  navigate(view: View, updateHash = true) {
    this.mobileMenu.set(false);
    if (view === this.view()) return;
    this.cancelRun();
    this.view.set(view);
    this.error.set('');
    if (view === 'playground') {
      this.code.set(this.storage.draft('playground', PLAYGROUND_STARTER));
      this.runMode = 'run';
      this.result.set(null);
    }
    if (updateHash) this.writeHash(view === 'overview' ? '' : view);
    window.scrollTo({ top: 0 });
  }

  openLesson(id: string, updateHash = true) {
    if (!this.lessons.some((lesson) => lesson.id === id)) return;
    this.mobileMenu.set(false);
    if (this.view() === 'lesson' && this.selectedId() === id) return;
    this.cancelRun();
    this.selectedId.set(id);
    this.view.set('lesson');
    this.activeTab.set('lesson');
    this.editorTab.set('lesson');
    this.resetLessonState();
    this.code.set(this.storage.draft(id + ':lesson', this.selected().example));
    this.runMode = this.selected().mode ?? 'run';
    this.note = this.storage.note(id);
    this.storage.lastLesson = id;
    const module = this.selectedModule();
    if (!this.openModules().includes(module.id))
      this.openModules.update((ids) => [...ids, module.id]);
    this.persist();
    if (updateHash) this.writeHash('lesson/' + id);
    window.scrollTo({ top: 0 });
  }

  resume() {
    const last = this.storage.lastLesson;
    this.openLesson(
      this.lessons.some((lesson) => lesson.id === last)
        ? last
        : (this.lessons.find((lesson) => !this.completed().includes(lesson.id))?.id ??
            this.lessons[0].id),
    );
  }
  toggleModule(id: string) {
    this.openModules.update((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }
  moduleNumber(id: string) {
    return this.modules.findIndex((module) => module.id === id) + 1;
  }
  moduleCompleted(module: CourseModule) {
    return module.lessons.filter((lesson) => this.completed().includes(lesson.id)).length;
  }

  setTab(tab: LessonTab) {
    this.activeTab.set(tab);
    if (tab !== 'notes' && tab !== this.editorTab()) {
      this.cancelRun();
      this.editorTab.set(tab);
      const original =
        tab === 'exercise' ? this.selected().exercise.starter : this.selected().example;
      this.code.set(this.storage.draft(this.draftKey(), original));
      this.result.set(null);
      this.error.set('');
      this.exerciseChecked.set(null);
    }
  }

  editCode(code: string) {
    this.code.set(code);
    this.storage.saveDraft(this.draftKey(), code);
    this.exerciseChecked.set(null);
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persist(), 250);
  }
  saveNote() {
    this.storage.saveNote(this.selectedId(), this.note);
    this.persist();
  }

  resetCode() {
    const original =
      this.view() === 'playground'
        ? PLAYGROUND_STARTER
        : this.editorTab() === 'exercise'
          ? this.selected().exercise.starter
          : this.selected().example;
    this.editCode(original);
    this.result.set(null);
    this.error.set('');
    this.notify('Original code restored.');
  }
  showSolution() {
    this.solutionOpen.set(true);
  }
  loadSolution() {
    this.editCode(this.selected().exercise.solution);
    this.result.set(null);
    this.notify('Solution loaded into the editor.');
  }

  toggleComplete() {
    const id = this.selectedId();
    this.completed.update((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
    this.persist();
  }
  adjacent(offset: number) {
    const lesson =
      this.lessons[this.lessons.findIndex((lesson) => lesson.id === this.selectedId()) + offset];
    if (lesson) this.openLesson(lesson.id);
  }
  hasAdjacent(offset: number) {
    const index = this.lessons.findIndex((lesson) => lesson.id === this.selectedId()) + offset;
    return index >= 0 && index < this.lessons.length;
  }

  async share() {
    try {
      await navigator.clipboard.writeText(location.href);
      this.notify('Lesson link copied. Your code stays in this browser.');
    } catch {
      this.notify('Copy the URL from your address bar to share this lesson.');
    }
  }
  notify(message: string) {
    this.notice.set(message);
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => this.notice.set(''), 4500);
  }
  saveBeforeLeave() {
    clearTimeout(this.saveTimer);
    this.persist();
  }
  ngOnDestroy() {
    this.cancelRun();
    clearTimeout(this.saveTimer);
    clearTimeout(this.noticeTimer);
    this.persist();
  }

  protected expectedOutput() {
    return this.view() === 'lesson' && this.editorTab() === 'exercise'
      ? this.selected().exercise.expectedOutput
      : undefined;
  }
  private draftKey() {
    return this.view() === 'playground' ? 'playground' : this.selectedId() + ':' + this.editorTab();
  }
  private resetLessonState() {
    this.result.set(null);
    this.error.set('');
    this.quizAnswer.set(null);
    this.hintOpen.set(false);
    this.solutionOpen.set(false);
    this.exerciseChecked.set(null);
  }
  private persist() {
    try {
      this.storage.persist(this.completed());
    } catch {
      this.notify('Could not save to browser storage. Download your code to keep a copy.');
    }
  }
  private writeHash(hash: string) {
    if (location.hash.slice(1) !== hash)
      history.pushState(null, '', hash ? '#' + hash : location.pathname + location.search);
  }
}
