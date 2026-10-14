// All content is loaded from the editable Markdown/JSON files in /design,
// /content and /research. Nothing below needs changing to edit the text.
import institutions from '../../design/institutions.json';
import decisions from '../../design/decisions.json';
import failureModes from '../../design/failure-modes.json';
import constitutionMd from '../../design/constitution.md?raw';
import site from '../../content/site.json';
import overviewMd from '../../content/overview.md?raw';
import openQuestionsMd from '../../content/open-questions.md?raw';
import bibliography from '../../content/bibliography.json';

const byName = (mods) =>
  Object.fromEntries(
    Object.entries(mods).map(([path, mod]) => [path.split('/').pop().replace(/\.(md|json)$/, ''), mod])
  );

export const vignettes = byName(
  import.meta.glob('../../content/vignettes/*.md', { query: '?raw', import: 'default', eager: true })
);
export const scenarios = byName(
  import.meta.glob('../../content/scenarios/*.json', { import: 'default', eager: true })
);
export const research = byName(
  import.meta.glob('../../research/*.md', { query: '?raw', import: 'default', eager: true })
);

export const FM = Object.fromEntries(failureModes.failure_modes.map((f) => [f.id, f]));
export const FM_LIST = failureModes.failure_modes;
export const NODES = Object.fromEntries(institutions.nodes.map((n) => [n.id, n]));

export {
  institutions,
  decisions,
  constitutionMd,
  site,
  overviewMd,
  openQuestionsMd,
  bibliography,
};
