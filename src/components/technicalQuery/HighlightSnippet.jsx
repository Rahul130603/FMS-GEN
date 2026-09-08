import React from 'react';

// Must match the control-character delimiters the backend's ts_headline
// call wraps matched terms with (see server/src/services/searchService.js).
// Splitting on raw control characters and rendering the pieces as plain
// React text children keeps this 100% safe against stored XSS in a query
// description/comment — we never touch dangerouslySetInnerHTML.
const START = '';
const END = '';

export default function HighlightSnippet({ text }) {
  if (!text) return <span className="text-gray-400">—</span>;

  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length) {
    const startIdx = remaining.indexOf(START);
    if (startIdx === -1) {
      parts.push(<React.Fragment key={key++}>{remaining}</React.Fragment>);
      break;
    }
    if (startIdx > 0) parts.push(<React.Fragment key={key++}>{remaining.slice(0, startIdx)}</React.Fragment>);
    const afterStart = remaining.slice(startIdx + 1);
    const endIdx = afterStart.indexOf(END);
    if (endIdx === -1) {
      parts.push(<React.Fragment key={key++}>{afterStart}</React.Fragment>);
      break;
    }
    parts.push(
      <mark key={key++} className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit rounded px-0.5">
        {afterStart.slice(0, endIdx)}
      </mark>
    );
    remaining = afterStart.slice(endIdx + 1);
  }

  return <>{parts}</>;
}
