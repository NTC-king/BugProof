function tooLarge() {
  const error = new Error(
    'Repair request exceeds 64 KiB. Reduce the source/visible examples and try again.',
  );
  error.status = 413;
  return error;
}
export function readRequestBody(request, limit = 65536) {
  if (Number(request.headers['content-length']) > limit) {
    request.once('error', () => {});
    request.resume();
    return Promise.reject(tooLarge());
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0,
      settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      request.removeListener('data', data);
      request.removeListener('end', end);
      request.removeListener('close', close);
      if (error) {
        chunks.length = 0;
        request.resume();
        reject(error);
      } else resolve(Buffer.concat(chunks, length));
    };
    const data = (chunk) => {
      length += chunk.length;
      if (length > limit) finish(tooLarge());
      else chunks.push(chunk);
    };
    const end = () => finish();
    const close = () => {
      if (!request.complete) finish(new Error('Request body was interrupted.'));
    };
    request.on('data', data);
    request.once('end', end);
    request.once('close', close);
    // Remains installed through a post-rejection socket reset; no uncaught stream error.
    request.once('error', (error) => finish(error));
  });
}
