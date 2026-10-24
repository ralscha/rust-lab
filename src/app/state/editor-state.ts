import { signal } from '@angular/core';
import { PlaygroundApiService, RunResult } from '../services/playground-api.service';

/** Editor state shared by course challenges and the standalone playground. */
export abstract class EditorState {
  readonly code = signal('');
  readonly busy = signal(false);
  readonly formatting = signal(false);
  readonly result = signal<RunResult | null>(null);
  readonly error = signal('');
  readonly compilerVersion = signal('Checking compiler…');
  readonly compilerDetail = signal('');
  readonly outputTab = signal<'output' | 'diagnostics'>('output');
  readonly exerciseChecked = signal<boolean | null>(null);
  optimization = 'debug';
  runMode: 'run' | 'test' = 'run';
  private abort?: AbortController;

  constructor(private readonly api: PlaygroundApiService) {}

  abstract editCode(code: string): void;
  abstract notify(message: string): void;
  protected abstract expectedOutput(): string | undefined;

  protected cancelRun() {
    this.abort?.abort();
    this.abort = undefined;
    this.busy.set(false);
    this.formatting.set(false);
  }

  async run() {
    if (this.busy() || this.formatting()) return;
    this.busy.set(true);
    this.error.set('');
    this.result.set(null);
    this.exerciseChecked.set(null);
    const controller = (this.abort = new AbortController());
    const submittedCode = this.code();
    try {
      const data = await this.api.execute(
        {
          code: submittedCode,
          mode: this.runMode,
          optimization: this.optimization,
        },
        controller,
      );
      if (this.abort !== controller) return;
      this.result.set(data);
      this.outputTab.set(data.success || data.stdout ? 'output' : 'diagnostics');
      const expected = this.expectedOutput();
      if (expected !== undefined && this.code() === submittedCode) {
        this.exerciseChecked.set(
          data.success &&
            data.stdout.replace(/\r\n/g, '\n').trimEnd() ===
              expected.replace(/\r\n/g, '\n').trimEnd(),
        );
      }
    } catch (error) {
      if (this.abort === controller) {
        this.error.set(
          controller.signal.aborted
            ? 'Execution timed out. Try a smaller program or run again later.'
            : error instanceof Error
              ? error.message
              : 'The runner could not be reached.',
        );
      }
    } finally {
      if (this.abort === controller) {
        this.busy.set(false);
        this.abort = undefined;
      }
    }
  }

  async formatCode() {
    if (this.busy() || this.formatting()) return;
    this.formatting.set(true);
    this.error.set('');
    const submittedCode = this.code();
    const controller = (this.abort = new AbortController());
    try {
      const data = await this.api.format(
        {
          code: submittedCode,
        },
        controller,
      );
      // Formatting must never replace newer typing or another lesson's draft.
      if (this.abort === controller && this.code() === submittedCode) {
        this.editCode(data.code);
        this.notify('Formatted with rustfmt.');
      }
    } catch (error) {
      if (this.abort === controller) {
        this.error.set(
          controller.signal.aborted
            ? 'Formatting timed out. Please try again later.'
            : error instanceof Error
              ? error.message
              : 'Formatting failed.',
        );
      }
    } finally {
      if (this.abort === controller) {
        this.formatting.set(false);
        this.abort = undefined;
      }
    }
  }

  async loadVersion() {
    try {
      const data = await this.api.version();
      this.compilerVersion.set('Rust ' + data.version);
      this.compilerDetail.set('Local Docker compiler · ' + (data.date ?? 'stable'));
    } catch {
      this.compilerVersion.set('Rust stable');
      this.compilerDetail.set(
        'Local compiler unavailable · start Docker and build the runner image',
      );
    }
  }

  download() {
    const url = URL.createObjectURL(new Blob([this.code()], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'main.rs';
    link.click();
    URL.revokeObjectURL(url);
  }
}
