import { bibliography, research } from '../lib/data.js';
import { esc, bi } from '../lib/ui.js';

const ACCESS = {
  primary: ['Read directly', 'acc-primary'],
  reviews: ['Read through reviews', 'acc-reviews'],
  abstract: ['Abstract / summary only', 'acc-abstract'],
  secondary: ['Secondary account', 'acc-secondary'],
};

const TOPIC_TITLES = {
  '01-bureaucratic-degeneration': 'Bureaucratic degeneration, cults and the security state',
  '02-suppression-of-pluralism': 'Luxemburg, the soviets, Kronstadt and the ban on factions',
  '03-planning-and-calculation': 'Planning and the calculation debate',
  '04-stagnation-and-work': 'Stagnation, work and incentives',
  '05-counter-revolution-and-external-pressure': 'Counter-revolution and external pressure',
  '06-positive-models': 'Positive models and experiments',
  '07-irish-lineage': 'The Irish lineage',
  '08-ireland-today': 'Ireland today',
  '09-ecology-and-growth': 'Ecology: degrowth, eco-modernism, Half-Earth',
  '10-legitimacy-and-everyday-life': 'Legitimacy and everyday life',
  '11-social-reproduction': 'Social reproduction and care',
  SYNTHESIS: 'Synthesis',
};

/** Every external link cited in a research note, de-duplicated, in order of appearance. */
function linksIn(md) {
  const seen = new Map();
  for (const m of md.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)) {
    const [, text, url] = m;
    if (!seen.has(url)) seen.set(url, text.replace(/\*/g, ''));
  }
  return [...seen].map(([url, text]) => ({ url, text, host: new URL(url).hostname.replace(/^www\./, '') }));
}

export default function sources(main) {
  const works = bibliography.works;
  const viaReviews = works.filter((w) => w.access === 'reviews' || w.access === 'abstract');
  const topics = Object.keys(TOPIC_TITLES).filter((k) => research[k]);
  const total = new Set(topics.flatMap((t) => linksIn(research[t]).map((l) => l.url))).size;

  main.innerHTML = `
    <div class="page-head">
      ${bi('Foinsí', 'Sources & further reading')}
      <p class="lede">Everything the design rests on. Key works are listed first, each marked by <strong>how it was read</strong>: directly, or only through reviews and summaries. Below them are all ${total} sources cited in the research notes, by topic.</p>
    </div>
    <section class="reviews-warning" aria-labelledby="via-reviews">
      <h2 id="via-reviews">Read through reviews, not directly (${viaReviews.length})</h2>
      <p>These works are cited for arguments <em>as reported in the linked reviews and summaries</em>. Claims attributed to them should be checked against the books themselves.</p>
      <ul class="pill-list">${viaReviews.map((w) => `<li><span class="acc acc-reviews">${esc(ACCESS[w.access][0])}</span> ${esc(w.author)}, <cite>${esc(w.title)}</cite> (${esc(w.year)})</li>`).join('')}</ul>
    </section>
    <section aria-labelledby="key-works">
      <h2 id="key-works">Key works</h2>
      <div class="filter-row">
        <label>Show <select name="acc"><option value="">all</option>${Object.entries(ACCESS).map(([k, [l]]) => `<option value="${k}">${esc(l.toLowerCase())}</option>`).join('')}</select></label>
      </div>
      <ul class="biblio">${works
        .map(
          (w) => `<li data-acc="${w.access}">
          <span class="acc ${ACCESS[w.access][1]}">${esc(ACCESS[w.access][0])}</span>
          <span class="bib-main">${esc(w.author)} (${esc(w.year)}). ${w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer" class="ext"><cite>${esc(w.title)}</cite></a>` : `<cite>${esc(w.title)}</cite>`}.</span>
          ${w.note ? `<span class="bib-note">${esc(w.note)}</span>` : ''}
          ${w.via?.length ? `<span class="bib-via">Read via: ${w.via.map((v) => `<a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">${esc(v.text)}</a>`).join(', ')}</span>` : ''}
          ${w.topic ? `<a class="bib-topic" href="#/research/${w.topic}">research note</a>` : ''}
        </li>`
        )
        .join('')}</ul>
    </section>
    <section aria-labelledby="by-topic">
      <h2 id="by-topic">All cited sources, by topic</h2>
      ${topics
        .map((t) => {
          const links = linksIn(research[t]);
          return `<details class="topic"><summary>${esc(TOPIC_TITLES[t])} <span class="muted">(${links.length})</span></summary>
            <p><a href="#/research/${t}">Read the research note</a></p>
            <ul class="link-list">${links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.text)}</a> <span class="host">${esc(l.host)}</span></li>`).join('')}</ul>
          </details>`;
        })
        .join('')}
    </section>`;

  main.querySelector('select[name=acc]').addEventListener('change', (e) => {
    main.querySelectorAll('.biblio li').forEach((li) => {
      li.hidden = e.target.value && li.dataset.acc !== e.target.value;
    });
  });
}
