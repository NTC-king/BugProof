import { useEffect, useMemo, useState } from 'react';
import { lineDiff } from '../diff.mjs';

const labels: Record<string, string> = {
  pass_on_listed_tests: 'Pass on listed tests',
  examples_only: 'Examples pass · no challenge',
  failed: 'Failed a declared check',
  blocked: 'Unsupported code blocked',
  inconclusive: 'Incomplete · no pass awarded',
};
function output(outcome: any) {
  return outcome?.status === 'returned'
    ? JSON.stringify(outcome.value)
    : outcome?.status === 'raised'
      ? `raises ${outcome.exceptionType}`
      : (outcome?.status ?? 'missing');
}
function expected(row: any) {
  return row.expect.kind === 'raises'
    ? `raises ${row.expect.type}`
    : JSON.stringify(row.expect.value);
}
export function SourceDiff({ source, candidate }: { source: string; candidate: string }) {
  const diff = useMemo(() => lineDiff(source, candidate), [source, candidate]);
  const added = diff.rows.filter((r) => r.kind === 'added').length;
  const removed = diff.rows.filter((r) => r.kind === 'removed').length;
  return (
    <details className="diff-details">
      <summary>
        Inspect source changes{' '}
        <span className="diff-summary">
          {diff.limited ? 'diff limit reached' : `+${added} −${removed}`}
        </span>
      </summary>
      {diff.limited ? (
        <p>{diff.message}</p>
      ) : (
        <div className="diff-lines" aria-label="Line-by-line source comparison">
          {diff.rows.map((row, index) => (
            <div key={index} className={row.kind}>
              <span className="line-number" aria-label="original line">
                {row.beforeLine ?? ' '}
              </span>
              <span className="line-number" aria-label="candidate line">
                {row.afterLine ?? ' '}
              </span>
              <span aria-label={row.kind}>
                {row.kind === 'added' ? '+' : row.kind === 'removed' ? '−' : ' '}
              </span>
              <code>{row.text || ' '}</code>
            </div>
          ))}
        </div>
      )}
      <p className="fine">
        Ordered line comparison, including repeated lines. Inspection only—not an automatically
        applied patch.
      </p>
    </details>
  );
}
export function EvidenceView({ report, baseline }: { report: any; baseline: any }) {
  const result = report?.proposed ?? baseline;
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [suiteFilter, setSuiteFilter] = useState('all');
  useEffect(() => {
    setOutcomeFilter('all');
    setSuiteFilter('all');
  }, [result]);
  if (!result)
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          ✓?
        </span>
        <h3>No verdict without a run.</h3>
        <p>
          Start with the median example. Its teaching candidate passes the visible examples
          <br className="desktop-break" /> but misses a four-item edge case. Execute it to see why.
        </p>
      </div>
    );
  const issue =
    result.rows.find((r: any) => r.result === 'fail') ??
    result.rows.find((r: any) => r.result !== 'pass');
  const visibleRows = result.rows.filter(
    (r: any) =>
      (outcomeFilter === 'all' ||
        (outcomeFilter === 'issues' ? r.result !== 'pass' : r.result === outcomeFilter)) &&
      (suiteFilter === 'all' || r.suite === suiteFilter),
  );
  const improved =
    report?.proposed.rows.filter(
      (r: any) =>
        r.result === 'pass' &&
        report.original.rows.find((o: any) => o.id === r.id)?.result === 'fail',
    ).length ?? 0;
  const regressed =
    report?.proposed.rows.filter(
      (r: any) =>
        r.result === 'fail' &&
        report.original.rows.find((o: any) => o.id === r.id)?.result === 'pass',
    ).length ?? 0;
  return (
    <>
      <div className={`verdict-banner verdict-${result.verdict}`} data-testid="verdict">
        <span>{report ? 'CANDIDATE VERDICT' : 'ORIGINAL VERDICT'}</span>
        <h3>{labels[result.verdict]}</h3>
        <p>
          {result.summary.passed}/{result.summary.total} passed · {result.summary.failed} failed ·{' '}
          {result.summary.incomplete} incomplete · {result.summary.blocked} blocked
        </p>
        {report && (
          <p className="comparison-delta">
            Compared with original: {improved} failed checks now pass · {regressed} passing checks
            now fail
          </p>
        )}
        {report && !report.executionIntegrity?.comparisonConsistent && (
          <p className="integrity-warning">
            {report.executionIntegrity?.reason ?? 'Execution policy consistency is not confirmed.'}
          </p>
        )}
      </div>
      {report && (
        <div className="suite-counts">
          {['example', 'challenge'].map((suite) => {
            const rows = report.proposed.rows.filter((r: any) => r.suite === suite);
            return (
              <div key={suite}>
                <span>{suite === 'example' ? 'VISIBLE EXAMPLES' : 'INDEPENDENT CHALLENGES'}</span>
                <strong>
                  {rows.filter((r: any) => r.result === 'pass').length}
                  <small> / {rows.length} passed</small>
                </strong>
              </div>
            );
          })}
        </div>
      )}
      {issue && (
        <section className="first-issue" aria-label="First issue explained">
          <div>
            <span className="step-label">
              {issue.result === 'fail' ? 'FIRST FAILING CHECK' : 'WHY THIS IS NOT A PASS'}
            </span>
            <h3>
              {issue.id} <small>{issue.suite}</small>
            </h3>
          </div>
          <dl>
            <div>
              <dt>Call input</dt>
              <dd>
                <code>{JSON.stringify({ args: issue.args, kwargs: issue.kwargs })}</code>
              </dd>
            </div>
            <div>
              <dt>Expected</dt>
              <dd>
                <code>{expected(issue)}</code>
                {issue.expect.tolerance !== undefined && (
                  <small> absolute numeric tolerance: {issue.expect.tolerance}</small>
                )}
              </dd>
            </div>
            <div>
              <dt>Observed</dt>
              <dd>
                <code>{output(issue.outcome)}</code>
              </dd>
            </div>
          </dl>
          <p>
            {issue.outcome.message ||
              (issue.result === 'fail'
                ? 'The observed result does not match this case’s explicit expectation. The contract is not checked beyond the listed expectations.'
                : 'This case did not produce supported complete evidence. It cannot count as passed.')}
          </p>
        </section>
      )}
      <div className="case-filters">
        <label>
          Show results
          <select
            aria-label="Filter case results"
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
          >
            <option value="all">All outcomes</option>
            <option value="issues">Only issues</option>
            <option value="pass">Passed</option>
            <option value="fail">Failed</option>
            <option value="blocked">Blocked</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </label>
        <label>
          Suite
          <select
            aria-label="Filter case suite"
            value={suiteFilter}
            onChange={(e) => setSuiteFilter(e.target.value)}
          >
            <option value="all">Both suites</option>
            <option value="example">Visible examples</option>
            <option value="challenge">Challenges</option>
          </select>
        </label>
        <span aria-live="polite">
          {visibleRows.length} of {result.rows.length} cases shown
        </span>
      </div>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">
            Actual outcomes compared with explicit case expectations
          </caption>
          <thead>
            <tr>
              <th scope="col">Case / suite</th>
              <th scope="col">Expected</th>
              <th scope="col">Original</th>
              {report && <th scope="col">Candidate</th>}
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row: any) => {
              const original = report?.original.rows.find((o: any) => o.id === row.id)?.outcome;
              const observedOriginal = report ? original : row.outcome;
              return (
                <tr key={row.id}>
                  <td>
                    <strong>{row.id}</strong>
                    <small>{row.suite}</small>
                    <details>
                      <summary>Input</summary>
                      <code>{JSON.stringify({ args: row.args, kwargs: row.kwargs })}</code>
                    </details>
                  </td>
                  <td>
                    <code>{expected(row)}</code>
                    {row.expect.tolerance !== undefined && <small>± {row.expect.tolerance}</small>}
                  </td>
                  <td>
                    <code>{output(observedOriginal)}</code>
                    {observedOriginal?.message && <small>{observedOriginal.message}</small>}
                  </td>
                  {report && (
                    <td>
                      <code>{output(row.outcome)}</code>
                      {row.outcome.message && <small>{row.outcome.message}</small>}
                    </td>
                  )}
                  <td>
                    <span className={`result-chip ${row.result}`}>{row.result}</span>
                  </td>
                </tr>
              );
            })}
            {!visibleRows.length && (
              <tr>
                <td colSpan={report ? 5 : 4}>
                  No cases match these filters. The full verdict above is unchanged.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {report && (
        <details className="report-details">
          <summary>Inspect frozen evidence & provenance</summary>
          <p>
            Candidate: {report.candidate.provenance.kind}. No automated feedback/regeneration loop
            was used in this run.
          </p>
          <p>
            Recorded repair-prompt exclusion:{' '}
            {report.challengesExcludedFromRepairPrompt === true
              ? 'Supported for the unchanged recorded prompt and exact candidate; no matching canonical call inputs were included.'
              : report.challengesExcludedFromRepairPrompt === false
                ? 'Not supported: the basis/candidate changed, data is missing, there are no challenges, or an input overlaps.'
                : 'Unknown for a pasted, imported or teaching candidate; no live-prompt claim is made.'}
          </p>
          <p>
            This is not proof of secrecy, statistical independence, or correctness beyond the listed
            return/exception expectations.
          </p>
          <dl>
            <dt>Run ID / report schema</dt>
            <dd>
              {report.runId} / v{report.schemaVersion}
            </dd>
            <dt>Original SHA-256</dt>
            <dd>{report.hashes.original}</dd>
            <dt>Candidate SHA-256</dt>
            <dd>{report.hashes.candidate}</dd>
            <dt>Case suite SHA-256</dt>
            <dd>{report.hashes.cases}</dd>
            <dt>Executed policy SHA-256</dt>
            <dd>
              {report.app.policyHashes.join(', ') ||
                'No policy hash received; inspect incomplete results.'}
            </dd>
            <dt>Observed execution runtime</dt>
            <dd>
              {report.runtime.observed
                ?.map(
                  (value: any) =>
                    `Pyodide ${value.pyodide} · ${value.python} · ${value.implementation}`,
                )
                .join(' | ') || 'No complete runtime metadata received.'}
            </dd>
          </dl>
        </details>
      )}
    </>
  );
}
