import { useEffect, useRef, useState } from 'react';
import { fixtures } from './fixtures.mjs';
import {
  APP_VERSION,
  validateTask,
  validateSource,
  assess,
  summary,
  verdict,
  makeReport,
  repairPayload,
} from './domain.mjs';
import { workspaceDocument, parseWorkspace, WORKSPACE_LIMIT } from './workspace.mjs';
import { execute } from './runner';
import { EvidenceView, SourceDiff } from './components/EvidenceView';

const pretty = (value: any) => JSON.stringify(value, null, 2);
const RUNNER_ORIGIN = 'http://127.0.0.1:4101';
function parseCases(text: string, label: string) {
  if (new TextEncoder().encode(text).length > 131072)
    throw new Error(`${label}: JSON text exceeds 128 KiB.`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label}: invalid JSON. Check quotes, commas and brackets.`);
  }
}
function downloadJSON(value: any, name: string) {
  const url = URL.createObjectURL(new Blob([pretty(value)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const initial = fixtures[0];
  const [selected, setSelected] = useState(initial.id);
  const [source, setSource] = useState(initial.source);
  const [candidate, setCandidate] = useState(initial.inadequate);
  const [functionName, setFunctionName] = useState(initial.functionName);
  const [contract, setContract] = useState(initial.contract);
  const [examples, setExamples] = useState(pretty(initial.examples));
  const [challenges, setChallenges] = useState(pretty(initial.challenges));
  const [provenance, setProvenance] = useState<any>({
    kind: 'teaching_fixture',
    label: 'Hand-authored inadequate candidate; not a live model result',
  });
  const [report, setReport] = useState<any>(null);
  const [baseline, setBaseline] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Run both versions to inspect their evidence.');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [explanation, setExplanation] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const control = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const reference = fixtures.find((f) => f.id === selected);
  const referenceAvailable =
    reference && reference.functionName === functionName && reference.contract === contract;

  function connectRunner() {
    frame.current?.contentWindow?.postMessage({ type: 'hello', id: 'handshake' }, RUNNER_ORIGIN);
  }
  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/session', { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setSession)
      .catch((e) => {
        if (e.name !== 'AbortError')
          setError('Local API is unavailable. Restart the local launcher.');
      });
    const timer = setTimeout(
      () =>
        setStatus((current) =>
          current.startsWith('Ready.')
            ? 'Runner connection is taking longer than expected. Use Reconnect runner below.'
            : current,
        ),
      10000,
    );
    const receive = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === RUNNER_ORIGIN &&
        event.data?.type === 'runner-ready'
      ) {
        setReady(true);
        clearTimeout(timer);
      }
    };
    window.addEventListener('message', receive);
    connectRunner();
    return () => {
      abort.abort();
      clearTimeout(timer);
      window.removeEventListener('message', receive);
      control.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!busy) return;
    setElapsed(0);
    const started = performance.now();
    const timer = setInterval(() => setElapsed((performance.now() - started) / 1000), 200);
    return () => {
      clearInterval(timer);
      setElapsed((performance.now() - started) / 1000);
    };
  }, [busy]);

  function invalidate() {
    revision.current++;
    control.current?.abort();
    setReport(null);
    setBaseline(null);
    setError('');
    setExplanation('');
    setStatus('Inputs changed. Previous evidence no longer applies.');
  }
  function load(id: string) {
    const fixture = fixtures.find((f) => f.id === id);
    if (!fixture) return;
    invalidate();
    setSelected(id);
    setSource(fixture.source);
    setCandidate(fixture.inadequate);
    setFunctionName(fixture.functionName);
    setContract(fixture.contract);
    setExamples(pretty(fixture.examples));
    setChallenges(pretty(fixture.challenges));
    setConsent(false);
    setProvenance({
      kind: 'teaching_fixture',
      label: 'Hand-authored inadequate candidate; not a live model result',
    });
  }
  function task() {
    return validateTask({
      functionName,
      source,
      contract,
      examples: parseCases(examples, 'Visible examples'),
      challenges: parseCases(challenges, 'Challenges'),
    });
  }
  function formatCases(which: 'examples' | 'challenges') {
    try {
      const value = parseCases(which === 'examples' ? examples : challenges, which);
      if (!Array.isArray(value)) throw new Error('Cases must be a JSON array.');
      invalidate();
      (which === 'examples' ? setExamples : setChallenges)(pretty(value));
      setStatus('JSON formatted. Rerun to create fresh evidence.');
    } catch (e: any) {
      setError(e.message);
    }
  }
  function saveWorkspace() {
    try {
      const document = workspaceDocument(task(), candidate);
      // Do not offer a download that this same app cannot reopen.
      parseWorkspace(pretty(document));
      downloadJSON(document, `bugproof-${functionName}-workspace.json`);
      setError('');
      setStatus('Workspace downloaded. It contains source and cases; review it before sharing.');
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function openWorkspace(file?: File) {
    if (!file || busy || control.current) return;
    const current = revision.current;
    try {
      if (file.size > WORKSPACE_LIMIT) throw new Error('Workspace file exceeds 256 KiB.');
      const data = parseWorkspace(await file.text());
      if (current !== revision.current)
        throw new Error(
          'Inputs changed while opening the file. Import cancelled; your work was preserved.',
        );
      invalidate();
      setSelected('');
      setFunctionName(data.task.functionName);
      setSource(data.task.source);
      setContract(data.task.contract);
      setExamples(pretty(data.task.examples));
      setChallenges(pretty(data.task.challenges));
      setCandidate(data.candidate);
      setConsent(false);
      setProvenance({
        kind: 'user_imported',
        label: 'Workspace file candidate; original provenance is not trusted',
      });
      setStatus(
        'Workspace opened locally. No code was executed or sent to a model. Verify to create new evidence.',
      );
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function run(full: boolean) {
    if (!frame.current || !ready || busy || control.current) return;
    const current = revision.current,
      abort = new AbortController();
    control.current = abort;
    setBusy(true);
    setError('');
    setReport(null);
    setBaseline(null);
    try {
      const frozen = task(),
        frozenCandidate = candidate,
        frozenProvenance = structuredClone(provenance);
      if (full) validateSource(frozenCandidate);
      const cases = [...frozen.examples, ...frozen.challenges];
      const original = await execute(
        frame.current,
        frozen.source,
        frozen.functionName,
        cases,
        abort.signal,
        (text) => setStatus(`Original · ${text}`),
      );
      if (current !== revision.current || abort.signal.aborted) return;
      const rows = assess(cases, original);
      setBaseline({ rows, summary: summary(rows), verdict: verdict(rows) });
      if (!full) {
        setStatus('Original evaluated. These are executed results, not a model opinion.');
        return;
      }
      const proposed = await execute(
        frame.current,
        frozenCandidate,
        frozen.functionName,
        cases,
        abort.signal,
        (text) => setStatus(`Candidate · ${text}`),
      );
      if (current !== revision.current || abort.signal.aborted) return;
      const evidence = await makeReport(
        frozen,
        frozenCandidate,
        original,
        proposed,
        frozenProvenance,
        crypto.randomUUID(),
      );
      if (current !== revision.current || abort.signal.aborted) return;
      setReport(evidence);
      setStatus('Verification complete. Review examples and independent challenges separately.');
    } catch (e: any) {
      if (current === revision.current) {
        if (e.name === 'AbortError') {
          setBaseline(null);
          setStatus('Cancelled. No new passing verdict.');
        } else {
          setError(e.message);
          setStatus('Could not complete this evaluation.');
        }
      }
    } finally {
      if (control.current === abort) {
        setBusy(false);
        control.current = null;
      }
    }
  }
  async function requestRepair() {
    if (busy || control.current) return;
    const current = revision.current,
      abort = new AbortController();
    control.current = abort;
    setBusy(true);
    setError('');
    setReport(null);
    setBaseline(null);
    setStatus('Requesting a candidate; independent challenge cases are excluded…');
    try {
      const frozen = task();
      if (!consent) throw new Error('Confirm consent before sending non-confidential code.');
      const response = await fetch('/api/repair', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-bugproof-session': session?.token ?? '' },
        body: JSON.stringify({ ...repairPayload(frozen), consent: true }),
        signal: abort.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Repair request failed.');
      if (current !== revision.current || abort.signal.aborted) return;
      validateSource(data.source);
      setCandidate(data.source);
      setProvenance(data.provenance);
      setExplanation(data.explanation);
      setStatus('Live candidate received, not yet verified. Run verification before trusting it.');
    } catch (e: any) {
      if (current === revision.current) {
        if (e.name === 'AbortError')
          setStatus(
            'Request cancelled. Provider work or charges already incurred cannot be undone.',
          );
        else {
          setError(e.message);
          setStatus('No live candidate accepted. Your work is preserved.');
        }
      }
    } finally {
      if (control.current === abort) {
        control.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <main>
      <a className="skip-link" href="#workspace">
        Skip to workbench
      </a>
      <header className="masthead">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            B
          </span>
          <div>
            <strong>
              BugProof<span className="dot">.</span>
            </strong>
            <span className="brand-caption">REPAIR EVIDENCE WORKBENCH</span>
          </div>
        </div>
        <div className="local-tag">
          <span aria-hidden="true">●</span> Local workspace{' '}
          <span className="version">v{APP_VERSION}</span>
        </div>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">DON’T JUST TRUST THE FIX.</p>
          <h1>
            Put the repair
            <br />
            <em>to the test.</em>
          </h1>
          <p className="lede">
            Run the original. Challenge the candidate.
            <br />
            See what the evidence actually supports.
          </p>
        </div>
        <aside className="principle">
          <span className="step-label">THE IMPORTANT DISTINCTION</span>
          <p>
            “Passed my examples”
            <br />
            isn’t the same as
            <br />
            <strong>“survived the edge cases.”</strong>
          </p>
          <span className="fine">Listed tests are evidence—not proof of correctness.</span>
        </aside>
      </section>
      <section className="workspace" id="workspace" aria-label="Repair workspace">
        <div className="workspace-heading">
          <h2>
            <span className="section-number">01</span> Choose your case
          </h2>
          <button
            className="text-button"
            disabled={busy || !selected}
            onClick={() => load(selected)}
          >
            Reset example
          </button>
          <label className="fixture-picker">
            Owned teaching example
            <select
              aria-label="Teaching example"
              value={selected}
              onChange={(e) => load(e.target.value)}
            >
              {!selected && <option value="">Your imported workspace</option>}
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="workspace-files">
          <div>
            <button className="secondary small" disabled={busy} onClick={saveWorkspace}>
              Save workspace JSON
            </button>
            <button
              className="secondary small"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              Open workspace JSON
            </button>
            <input
              className="sr-only"
              type="file"
              ref={fileInput}
              aria-label="Workspace JSON file"
              accept=".json,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                void openWorkspace(file);
              }}
            />
          </div>
          <p>
            Memory-only by default. Save before reloading or choosing another example. Workspace
            files contain your code and cases.
          </p>
        </div>
        <div className="task-details">
          <label>
            Function name
            <input
              maxLength={64}
              value={functionName}
              onChange={(e) => {
                invalidate();
                setFunctionName(e.target.value);
              }}
            />
          </label>
          <label className="contract">
            Behavior contract
            <textarea
              aria-label="Behavior contract"
              rows={3}
              maxLength={6000}
              value={contract}
              onChange={(e) => {
                invalidate();
                setContract(e.target.value);
              }}
            />
          </label>
        </div>
        <div className="editors">
          <section className="editor">
            <div className="editor-head">
              <h3>
                <span className="code-dot original-dot" /> Original function
              </h3>
              <span>PYTHON · SUPPORTED SUBSET</span>
            </div>
            <textarea
              aria-label="Original Python function"
              className="code-input"
              maxLength={12288}
              spellCheck={false}
              value={source}
              onChange={(e) => {
                invalidate();
                setSource(e.target.value);
              }}
            />
          </section>
          <section className="editor">
            <div className="editor-head">
              <h3>
                <span className="code-dot candidate-dot" /> Proposed candidate
              </h3>
              <span>NOT AUTO-APPLIED</span>
            </div>
            <textarea
              aria-label="Candidate Python function"
              className="code-input"
              maxLength={12288}
              spellCheck={false}
              value={candidate}
              onChange={(e) => {
                invalidate();
                setCandidate(e.target.value);
                setProvenance({ kind: 'user_pasted', label: 'User-entered candidate' });
              }}
            />
            <div className="candidate-toolbar">
              <span className="provenance" data-testid="provenance">
                {provenance.kind.replaceAll('_', ' ')}
              </span>
              <button
                className="text-button"
                disabled={busy || !referenceAvailable}
                onClick={() => {
                  if (!reference) return;
                  invalidate();
                  setCandidate(reference.correct);
                  setProvenance({
                    kind: 'teaching_fixture',
                    label: 'Hand-authored reference candidate; not a live model result',
                  });
                }}
              >
                Load reference candidate ↗
              </button>
            </div>
          </section>
        </div>
        <p className="disclosure">
          Teaching candidates are hand-authored examples, not live AI outputs. Python supports one
          function, direct approved built-ins, arithmetic and indexing; imports, attributes, classes
          and dynamic evaluation are blocked. Tests compare listed return values/exceptions—not
          every statement in the contract.
        </p>
        <div className="case-suites">
          {(['examples', 'challenges'] as const).map((which) => (
            <details open key={which}>
              <summary>
                <span className={`suite-icon ${which === 'challenges' ? 'challenge-icon' : ''}`}>
                  {which === 'examples' ? 'E' : 'C'}
                </span>
                <strong>
                  {which === 'examples' ? 'Visible examples' : 'Independent challenges'}
                </strong>
                <span>
                  {which === 'examples'
                    ? 'Included in repair requests'
                    : 'Excluded from repair requests'}
                </span>
              </summary>
              <label className="sr-only" htmlFor={which}>
                {which === 'examples' ? 'Visible examples JSON' : 'Independent challenges JSON'}
              </label>
              <textarea
                id={which}
                maxLength={131072}
                className="json-input"
                spellCheck={false}
                value={which === 'examples' ? examples : challenges}
                onChange={(e) => {
                  invalidate();
                  (which === 'examples' ? setExamples : setChallenges)(e.target.value);
                }}
              />
              <div className="case-toolbar">
                <button className="text-button" disabled={busy} onClick={() => formatCases(which)}>
                  Format {which} JSON
                </button>
                <span>args · kwargs · expect · unique id</span>
              </div>
            </details>
          ))}
        </div>
        <details className="support-details">
          <summary>Supported code, limits & case format</summary>
          <p>
            One synchronous function, up to 12 KiB source and 32 cases. Finite JSON values only:
            numbers within ±1 billion, 8 nesting levels, 200 items per collection. Returned objects
            require string keys; tuples, non-finite numbers and lossy key conversions do not count
            as supported evidence.
          </p>
          <p>
            Example case:{' '}
            <code>{'{"id":"basic","args":[1,2],"expect":{"kind":"value","value":3}}'}</code>. Use{' '}
            <code>{'{"kind":"raises","type":"ValueError"}'}</code> for an expected exception, or an
            explicit absolute numeric <code>tolerance</code> inside a value expectation.
          </p>
          <p>
            No imports, method/attribute calls, recursion, while loops, classes or host execution.
            Execution limits: 30 seconds to initialize and 2.5 seconds per case; timeout means
            incomplete. Large allocations may still exhaust browser memory. Do not run hostile code.
          </p>
        </details>
        <div className="controls">
          <div>
            <button className="secondary" disabled={busy || !ready} onClick={() => run(false)}>
              Run original
            </button>
            <button className="primary" disabled={busy || !ready} onClick={() => run(true)}>
              Verify both versions <span aria-hidden="true">→</span>
            </button>
            {busy && (
              <button className="cancel" onClick={() => control.current?.abort()}>
                Cancel run
              </button>
            )}
            {!ready && (
              <button
                className="secondary"
                onClick={() => {
                  invalidate();
                  setReady(false);
                  if (frame.current) frame.current.src = `${RUNNER_ORIGIN}/frame.html`;
                }}
              >
                Reconnect runner
              </button>
            )}
          </div>
          <span className="runtime-badge">
            {ready ? '● Runner connected' : '○ Connecting runner…'}
          </span>
        </div>
        <div className="live-repair">
          <div>
            <h3>Optional live AI repair</h3>
            <p>
              {session?.modelAvailable
                ? `Configured model: ${session.model}`
                : 'Not configured. Verification and teaching examples work without a key.'}
            </p>
            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              Allow sending this non-confidential function, contract and visible examples to the
              configured provider.
            </label>
            <p className="provider-note">
              No automatic retries. Cancelling requests aborts the connection; it cannot reverse
              work or charges already incurred.
            </p>
          </div>
          <button className="secondary" disabled={busy || !consent} onClick={requestRepair}>
            Request live repair ↗
          </button>
        </div>
        {explanation && (
          <p className="model-explanation">
            <strong>Model explanation, not verification:</strong> {explanation}
          </p>
        )}
      </section>
      <section className="evidence" aria-label="Execution evidence">
        <div className="evidence-heading">
          <h2>
            <span className="section-number">02</span> Follow the evidence
          </h2>
          <button
            className="secondary small"
            disabled={!report || busy}
            onClick={() => report && downloadJSON(report, `bugproof-${report.runId}.json`)}
          >
            ↓ Export evidence JSON
          </button>
        </div>
        <div className="status-line" role="status" aria-live="polite">
          {busy && <span className="spinner" />}
          {status}
          <span className="elapsed" aria-hidden="true">
            {elapsed > 0 ? `${elapsed.toFixed(1)}s elapsed` : ''}
          </span>
        </div>
        {error && (
          <div role="alert" className="error-box">
            {error}
          </div>
        )}
        <EvidenceView report={report} baseline={baseline} />
        <SourceDiff source={source} candidate={candidate} />
      </section>
      <footer>
        <strong>Evidence, not certainty.</strong>
        <p>
          Local, opt-in supported-subset execution. Not a hardened sandbox for hostile code. Browser
          memory exhaustion remains a risk. No results establish correctness beyond the listed
          checks.
        </p>
        <span>PYODIDE 314.0.7 · NO HOST PYTHON EXECUTION · NO AUTOMATIC STORAGE</span>
      </footer>
      <iframe
        ref={frame}
        onLoad={connectRunner}
        title="Restricted Python runtime"
        tabIndex={-1}
        aria-hidden="true"
        className="runner-frame"
        src={`${RUNNER_ORIGIN}/frame.html`}
        sandbox="allow-scripts allow-same-origin"
      />
    </main>
  );
}
