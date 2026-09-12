// Copyright (C) 2026 Yota Hamada
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * "Kiln" Monaco themes — the brand code look: phosphor-amber keys,
 * signal-green strings, violet accents. Dark renders on an ink panel;
 * light renders on cream paper.
 *
 * @module lib/monaco-theme
 */
import * as monaco from 'monaco-editor';

export const KILN_DARK = 'kiln-dark';
export const KILN_LIGHT = 'kiln-light';

let registered = false;

/** Registers both themes once per app lifetime. Safe to call repeatedly. */
export function registerKilnThemes() {
  if (registered) return;
  registered = true;

  monaco.editor.defineTheme(KILN_DARK, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '62656f' },
      { token: 'string', foreground: '8fd9a8' },
      { token: 'number', foreground: 'd8b4fe' },
      { token: 'keyword', foreground: 'e2a566' },
      { token: 'type', foreground: 'e2a566' },
      { token: 'variable', foreground: 'a89ff8' },
      { token: 'namespace', foreground: 'a89ff8' },
      { token: 'delimiter', foreground: 'c6c8ce' },
      { token: 'operators', foreground: 'c6c8ce' },
    ],
    colors: {
      'editor.background': '#0b0d12',
      'editor.foreground': '#dddcd4',
      'editor.lineHighlightBackground': '#14161d',
      'editor.selectionBackground': '#2a2452',
      'editorCursor.foreground': '#dddcd4',
      'editorLineNumber.foreground': '#4a4d57',
      'editorLineNumber.activeForeground': '#a2a5ad',
      'editorIndentGuide.background1': '#1e212b',
      'editorWidget.background': '#12141b',
      'editorWidget.border': '#2c3040',
      'editorSuggestWidget.selectedBackground': '#2a2452',
    },
  });

  monaco.editor.defineTheme(KILN_LIGHT, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8f9299' },
      { token: 'string', foreground: '178a44' },
      { token: 'number', foreground: '7c3aed' },
      { token: 'keyword', foreground: 'a06315' },
      { token: 'type', foreground: 'a06315' },
      { token: 'variable', foreground: '5d4fe0' },
      { token: 'namespace', foreground: '5d4fe0' },
      { token: 'delimiter', foreground: '4c4f58' },
      { token: 'operators', foreground: '4c4f58' },
    ],
    colors: {
      'editor.background': '#fbfaf6',
      'editor.foreground': '#14161b',
      'editor.lineHighlightBackground': '#f0ede4',
      'editor.selectionBackground': '#d9d3f5',
      'editorCursor.foreground': '#14161b',
      'editorLineNumber.foreground': '#a3a6ad',
      'editorLineNumber.activeForeground': '#4c4f58',
      'editorIndentGuide.background1': '#e0dcd0',
      'editorWidget.background': '#fbfaf6',
      'editorWidget.border': '#cdc8b9',
      'editorSuggestWidget.selectedBackground': '#e5e1fb',
    },
  });
}
