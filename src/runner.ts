const ORIGIN = 'http://127.0.0.1:4101';
export type Outcome = {
  caseId: string;
  status: string;
  value?: any;
  exceptionType?: string;
  message?: string;
  elapsedMs?: number;
  policyHash?: string;
  runtime?: { pyodide: string; python: string; implementation: string };
};
export function execute(
  frame: HTMLIFrameElement,
  source: string,
  functionName: string,
  cases: any[],
  signal: AbortSignal,
  progress: (text: string) => void,
): Promise<Outcome[]> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    let done = false;
    const cleanup = () => {
      window.removeEventListener('message', receive);
      signal.removeEventListener('abort', cancel);
      clearTimeout(timer);
    };
    const finish = (outcomes?: Outcome[], error?: Error) => {
      if (done) return;
      done = true;
      cleanup();
      if (error) reject(error);
      else resolve(outcomes ?? []);
    };
    const cancel = () => {
      frame.contentWindow?.postMessage({ type: 'cancel', id }, ORIGIN);
      finish(
        undefined,
        new DOMException('Run cancelled; no passing verdict was produced.', 'AbortError'),
      );
    };
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.origin !== ORIGIN || event.data?.id !== id)
        return;
      const message = event.data;
      if (message.type === 'progress')
        progress(`Executing ${String(message.caseId).slice(0, 64)}…`);
      if (
        message.type !== 'done' ||
        !Array.isArray(message.outcomes) ||
        message.outcomes.length > cases.length
      )
        return;
      const outcomes: Outcome[] = [];
      for (const o of message.outcomes) {
        if (
          !o ||
          typeof o.caseId !== 'string' ||
          !['returned', 'raised', 'blocked', 'runtime_error'].includes(o.status) ||
          JSON.stringify(o).length > 12000
        )
          return finish(undefined, new Error('Invalid runner response.'));
        outcomes.push(o);
      }
      if (message.interruption)
        for (const c of cases)
          if (!outcomes.some((o) => o.caseId === c.id))
            outcomes.push({
              caseId: c.id,
              status: message.interruption,
              message: message.message ?? 'Worker did not complete this case.',
            });
      finish(outcomes);
    };
    const timer = setTimeout(() => {
      frame.contentWindow?.postMessage({ type: 'cancel', id }, ORIGIN);
      finish(undefined, new Error('Runner timed out; no complete verdict is available.'));
    }, 125000);
    window.addEventListener('message', receive);
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) return cancel();
    progress('Initializing the isolated Python runtime…');
    frame.contentWindow?.postMessage(
      {
        type: 'run',
        id,
        source,
        functionName,
        cases: cases.map((c) => ({ id: c.id, args: c.args, kwargs: c.kwargs ?? {} })),
      },
      ORIGIN,
    );
  });
}
