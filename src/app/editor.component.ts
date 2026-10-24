import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { basicSetup, EditorView } from 'codemirror';
import { rust } from '@codemirror/lang-rust';
import { oneDark } from '@codemirror/theme-one-dark';

@Component({
  selector: 'code-editor',
  standalone: true,
  template: '<div #container class="editor-host"></div>',
})
export class EditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() code = '';
  @Output() codeChange = new EventEmitter<string>();
  @ViewChild('container') container!: ElementRef<HTMLElement>;
  private editor?: EditorView;
  ngAfterViewInit() {
    this.editor = new EditorView({
      doc: this.code,
      parent: this.container.nativeElement,
      extensions: [
        basicSetup,
        rust(),
        oneDark,
        EditorView.contentAttributes.of({
          'aria-label': 'Editable Rust source code',
          'aria-describedby': 'editor-help',
        }),
        EditorView.theme({
          '&': { fontSize: '1rem', backgroundColor: '#202923', minHeight: '310px' },
          '.cm-scroller': {
            fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
            lineHeight: '1.85',
            overflow: 'auto',
          },
          '.cm-gutters': { backgroundColor: '#202923', color: '#76857a', borderRight: 'none' },
          '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#ffffff05' },
          '.cm-content': { padding: '20px 0' },
          '.cm-line': { paddingLeft: '10px' },
          '&.cm-focused': { outline: '2px solid #b5c79b', outlineOffset: '-2px' },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) this.codeChange.emit(update.state.doc.toString());
        }),
      ],
    });
  }
  ngOnChanges() {
    if (this.editor && this.code !== this.editor.state.doc.toString()) {
      this.editor.dispatch({
        changes: { from: 0, to: this.editor.state.doc.length, insert: this.code },
      });
    }
  }
  ngOnDestroy() {
    this.editor?.destroy();
  }
}
