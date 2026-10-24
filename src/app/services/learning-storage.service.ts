import { Injectable } from '@angular/core';

interface SavedState {
  completed: string[];
  drafts: Record<string, string>;
  notes: Record<string, string>;
  lastLesson: string;
}

const STORAGE_KEY = 'rust-lab-v1';

/** Owns the persisted course data; callers decide how storage failures appear. */
@Injectable({ providedIn: 'root' })
export class LearningStorageService {
  private drafts: Record<string, string> = {};
  private notes: Record<string, string> = {};
  lastLesson = '';

  restore(knownLessonIds: string[]): string[] {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as SavedState | null;
    if (!saved || typeof saved !== 'object') return [];
    this.drafts = this.stringRecord(saved.drafts);
    this.notes = this.stringRecord(saved.notes);
    this.lastLesson = typeof saved.lastLesson === 'string' ? saved.lastLesson : '';
    return Array.isArray(saved.completed)
      ? [...new Set(saved.completed.filter((id) => knownLessonIds.includes(id)))]
      : [];
  }

  persist(completed: string[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completed,
        drafts: this.drafts,
        notes: this.notes,
        lastLesson: this.lastLesson,
      }),
    );
  }

  draft(key: string, fallback: string) {
    return this.drafts[key] ?? fallback;
  }
  saveDraft(key: string, code: string) {
    this.drafts[key] = code;
  }
  note(id: string) {
    return this.notes[id] ?? '';
  }
  saveNote(id: string, note: string) {
    this.notes[id] = note;
  }

  private stringRecord(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([key, entry]) => key.length < 180 && typeof entry === 'string' && entry.length <= 100000,
      ),
    );
  }
}
