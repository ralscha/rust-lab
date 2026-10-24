import { Injectable } from '@angular/core';

export interface RunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  elapsedMs?: number;
}

export interface CompilerOptions {
  code: string;
}

export interface RunOptions extends CompilerOptions {
  mode: 'run' | 'test';
  optimization: string;
}

interface FormatResult {
  success: boolean;
  code: string;
  stderr: string;
  error?: string;
}
interface CompilerVersion {
  version: string;
  date?: string;
}

/** HTTP transport and request deadlines for the local container runner. */
@Injectable({ providedIn: 'root' })
export class PlaygroundApiService {
  async execute(options: RunOptions, controller: AbortController): Promise<RunResult> {
    const { response, data } = await this.post<RunResult & { error?: string }>(
      '/api/execute',
      options,
      controller,
    );
    if (!response.ok) throw new Error(data.error ?? `Runner returned HTTP ${response.status}.`);
    return data;
  }

  async format(options: CompilerOptions, controller: AbortController): Promise<FormatResult> {
    const { response, data } = await this.post<FormatResult>('/api/format', options, controller);
    if (!response.ok || !data.success)
      throw new Error(data.error || data.stderr || 'Formatting failed.');
    return data;
  }

  async version(): Promise<CompilerVersion> {
    const response = await fetch('/api/version', { signal: AbortSignal.timeout(12000) });
    const data = await response.json();
    if (!response.ok) throw new Error('Compiler version unavailable.');
    return data;
  }

  private async post<T>(path: string, body: CompilerOptions, controller: AbortController) {
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      const data: T = await response.json();
      return { response, data };
    } finally {
      clearTimeout(timer);
    }
  }
}
