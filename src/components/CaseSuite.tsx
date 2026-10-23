import { useMemo } from 'react';
import { parseCaseText } from '../case-text.mjs';

const compact = (value: unknown) => {
  try {
    const text = JSON.stringify(value) ?? 'Not set';
    return text.length > 100 ? text.slice(0, 97) + '…' : text;
  } catch {
    return 'Too deeply nested to preview. Open JSON to edit.';
  }
};

export function CaseSuite({
  which,
  text,
  busy,
  onChange,
  onFormat,
}: {
  which: 'examples' | 'challenges';
  text: string;
  busy: boolean;
  onChange: (text: string) => void;
  onFormat: () => void;
}) {
  const examples = which === 'examples';
  const cases = useMemo(() => {
    try {
      const value = parseCaseText(text);
      return Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }, [text]);
  return (
    <section
      className={`case-suite suite-${which}`}
      aria-label={examples ? 'Example tests' : 'Extra tests'}
    >
      <div className="suite-heading">
        <span className={`suite-icon ${examples ? '' : 'challenge-icon'}`} aria-hidden="true">
          {examples ? 'E' : '+'}
        </span>
        <div>
          <h3>{examples ? 'Examples' : 'Extra tests'}</h3>
          <p>
            {examples
              ? 'The AI sees these when proposing a fix.'
              : 'Not sent to the AI. Used to challenge its fix.'}
          </p>
        </div>
        <span className="case-count">
          {cases ? cases.length : '?'} {cases?.length === 1 ? 'test' : 'tests'}
        </span>
      </div>
      {cases ? (
        <div className="case-preview">
          {cases.slice(0, 4).map((item, index) => (
            <div className="preview-row" key={index}>
              <strong>{typeof item?.id === 'string' ? item.id : `Test ${index + 1}`}</strong>
              <div>
                <span>Input</span>
                <code>
                  {compact(item?.args)}
                  {item?.kwargs && Object.keys(item.kwargs).length
                    ? ` · kwargs ${compact(item.kwargs)}`
                    : ''}
                </code>
              </div>
              <div>
                <span>Expected</span>
                <code>
                  {item?.expect?.kind === 'raises'
                    ? `raises ${compact(item.expect.type)}`
                    : compact(item?.expect?.value)}
                </code>
              </div>
            </div>
          ))}
          {!cases.length && <p className="preview-note">No tests here yet. Add them below.</p>}
          {cases.length > 4 && (
            <p className="preview-note">
              First 4 of {cases.length} shown. Open JSON to see or edit every test.
            </p>
          )}
        </div>
      ) : (
        <p className="preview-note">
          Cannot preview this JSON yet. Open the editor below to fix it.
        </p>
      )}
      <details className="case-json">
        <summary>Edit {examples ? 'examples' : 'extra tests'} · JSON</summary>
        <p className="json-help">
          You choose the expected answers. Run verification to validate and execute these tests.
        </p>
        <label className="sr-only" htmlFor={which}>
          {examples ? 'Visible examples JSON' : 'Independent challenges JSON'}
        </label>
        <textarea
          id={which}
          maxLength={131072}
          className="json-input"
          spellCheck={false}
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="case-toolbar">
          <button className="text-button" disabled={busy} onClick={onFormat}>
            Format {which} JSON
          </button>
          <span>args · kwargs · expect · unique id</span>
        </div>
      </details>
    </section>
  );
}
