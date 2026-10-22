import { loadPyodide } from '/vendor/pyodide.mjs';
self.onmessage = async ({ data }) => {
  const id = data.id;
  try {
    const py = await loadPyodide({ indexURL: new URL('/vendor/', self.location.href).href });
    const harness = await fetch('/harness.py').then((r) => {
      if (!r.ok) throw new Error('Harness unavailable');
      return r.text();
    });
    const policyHash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(harness))),
      (b) => b.toString(16).padStart(2, '0'),
    ).join('');
    await py.runPythonAsync(harness);
    for (const c of data.cases) {
      self.postMessage({ type: 'case-start', id, caseId: c.id });
      const start = performance.now();
      py.globals.set(
        '_bugproof_payload',
        JSON.stringify({
          source: data.source,
          functionName: data.functionName,
          args: c.args,
          kwargs: c.kwargs,
        }),
      );
      const result = JSON.parse(py.runPython('_execute_case_json(_bugproof_payload)'));
      self.postMessage({
        type: 'case-result',
        id,
        outcome: {
          ...result,
          caseId: c.id,
          policyHash,
          elapsedMs: Math.round(performance.now() - start),
        },
      });
    }
    self.postMessage({ type: 'done', id });
  } catch (error) {
    self.postMessage({ type: 'error', id, message: String(error) });
  }
};
