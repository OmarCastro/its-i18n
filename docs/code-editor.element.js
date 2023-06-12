import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags}                               from '@lezer/highlight';
import { EditorView} from "codemirror"
import {json} from "@codemirror/lang-json"
import { basicDark } from 'cm6-theme-basic-dark'


const fg = "var(--code-color)"
const bg = "var(--code-bg)"

const darkBackground = bg
const base02 = fg
const cursor = fg
const selection = "var(--code-bg-selection)"
const base03 = fg
const base05 = fg
const base07 = "var(--oper-color)"
const highlightBackground = "var(--code-bg-highlight)"
const base06 = fg
const tooltipBackground =bg


export const theme = EditorView.theme({

    '.cm-content': {
        caretColor: cursor
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: cursor },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: selection },
    '.cm-panels': { backgroundColor: darkBackground, color: base03 },
    '.cm-panels.cm-panels-top': { borderBottom: '2px solid black' },
    '.cm-panels.cm-panels-bottom': { borderTop: '2px solid black' },
    '.cm-searchMatch': {
        backgroundColor: base02,
        outline: `1px solid ${base03}`,
        color: base07
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: base05,
        color: base07
    },
    '.cm-activeLine': { backgroundColor: highlightBackground },
    '.cm-selectionMatch': { backgroundColor: highlightBackground },
    '&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket': {
        outline: `1px solid ${base03}`
    },
    '&.cm-focused .cm-matchingBracket': {
        backgroundColor: highlightBackground,
        color: base07
    },
    '.cm-gutters': {
        borderRight: `1px solid #ffffff10`,
        color: base06,
        backgroundColor: darkBackground
    },
    '.cm-activeLineGutter': {
        backgroundColor: highlightBackground
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'transparent',
        border: 'none',
        color: base02
    },
    '.cm-tooltip': {
        border: 'none',
        backgroundColor: tooltipBackground
    },
    '.cm-tooltip .cm-tooltip-arrow:before': {
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent'
    },
    '.cm-tooltip .cm-tooltip-arrow:after': {
        borderTopColor: tooltipBackground,
        borderBottomColor: tooltipBackground
    },
    '.cm-tooltip-autocomplete': {
        '& > ul > li[aria-selected]': {
            backgroundColor: highlightBackground,
            color: base03
        }
    }
}, { dark: true });



// Use a class highlight style, so we can handle things in CSS.

export const highlightStyle = HighlightStyle.define([
  { tag: tags.atom,      class: 'cmt-atom'      },
  { tag: tags.comment,   class: 'cmt-comment'   },
  { tag: tags.keyword,   class: 'cmt-keyword'   },
  { tag: tags.literal,   class: 'cmt-literal'   },
  { tag: tags.number,    class: 'cmt-number'    },
  { tag: tags.operator,  class: 'cmt-operator'  },
  { tag: tags.separator, class: 'cmt-separator' },
  { tag: tags.string,    class: 'cmt-string'    },
  { tag: tags.name,      class: 'cmt-name'      },
  { tag: tags.name,      class: 'cmt-name'      },
]);

export const extension = [syntaxHighlighting(highlightStyle), theme]
