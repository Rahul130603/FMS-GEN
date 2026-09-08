import fs from 'node:fs';
import postcss from 'postcss';

const scopes = {
  'daily-allotment.css': 'daily-allotment-status',
  'delivery.css': 'due-date-delivery',
  'technical-query.css': 'technical-query-reports',
};
for (const [file, id] of Object.entries(scopes)) {
  const path = `src/github-reports/styles/${file}`;
  const root = postcss.parse(fs.readFileSync(path, 'utf8'));
  if (file === 'technical-query.css') {
    root.walkAtRules('tailwind', rule => rule.remove());
    root.walkAtRules('layer', rule => rule.replaceWith(rule.nodes));
    root.walkAtRules('apply', rule => {
      rule.params = rule.params.replace(/^btn\b/, 'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed');
    });
  }
  root.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    rule.selectors = rule.selectors.map(selector => {
      if (selector.startsWith('.github-reports')) return selector;
      return `.github-reports.report-${id} ${selector}`
        .replace(/ :root|\bbody\b|\bhtml\b/g, '').trim();
    });
  });
  fs.writeFileSync(path, root.toString());
}
