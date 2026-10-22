const APP = 'http://127.0.0.1:4100';
let active = null;
const send = (data) => parent.postMessage(data, APP);
function finish() { if (active) { clearTimeout(active.timer); active.worker.terminate(); active = null; } }
window.addEventListener('message', event => {
  if (event.source !== parent || event.origin !== APP || !event.data || typeof event.data.id !== 'string') return;
  const data = event.data;
  if (data.type === 'cancel') { if (active?.id === data.id) finish(); return; }
  if (data.type !== 'run' || !Array.isArray(data.cases) || !data.cases.length || data.cases.length > 32 || typeof data.source !== 'string' || data.source.length > 12288 || typeof data.functionName !== 'string') return;
  finish();
  const worker = new Worker('/worker.mjs', { type: 'module' });
  const state = { id: data.id, worker, timer: null, completed: [] };
  active = state;
  const deadline = (ms) => { clearTimeout(state.timer); state.timer = setTimeout(() => { if (active !== state) return; send({ type: 'done', id: data.id, outcomes: state.completed, interruption: 'timeout' }); finish(); }, ms); };
  deadline(30000);
  worker.onmessage = ({ data: message }) => {
    if (active !== state || !message || message.id !== data.id) return;
    if (message.type === 'case-start') { deadline(2500); send({ type: 'progress', id: data.id, caseId: message.caseId }); }
    if (message.type === 'case-result') { state.completed.push(message.outcome); deadline(2500); }
    if (message.type === 'done') { send({ type: 'done', id: data.id, outcomes: state.completed }); finish(); }
    if (message.type === 'error') { send({ type: 'done', id: data.id, outcomes: state.completed, interruption: 'runtime_error', message: String(message.message).slice(0, 2000) }); finish(); }
  };
  worker.onerror = () => { if (active !== state) return; send({ type: 'done', id: data.id, outcomes: state.completed, interruption: 'runtime_error', message: 'Python runtime failed to initialize or execute.' }); finish(); };
  worker.postMessage({ id: data.id, source: data.source, functionName: data.functionName, cases: data.cases.map(c => ({ id: c.id, args: c.args, kwargs: c.kwargs ?? {} })) });
});
send({ type: 'runner-ready' });
