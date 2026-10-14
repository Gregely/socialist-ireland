import { openQuestionsMd } from '../lib/data.js';
import { renderMarkdown } from '../lib/markdown.js';
import { bi } from '../lib/ui.js';

export default function openQuestions(main) {
  main.innerHTML = `
    <div class="page-head">${bi('Ceisteanna Oscailte', 'Open questions')}</div>
    <article class="prose open-questions">${renderMarkdown(openQuestionsMd)}</article>`;
}
