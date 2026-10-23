export const CASE_TEXT_LIMIT = 128 * 1024;
const byteLength = (text) => new TextEncoder().encode(text).length;

export function parseCaseText(text, label = 'Cases') {
  if (typeof text !== 'string' || byteLength(text) > CASE_TEXT_LIMIT)
    throw new Error(`${label}: JSON text exceeds 128 KiB.`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label}: invalid JSON. Check quotes, commas and brackets.`);
  }
}

export function formatCaseText(value, label = 'Cases') {
  if (!Array.isArray(value)) throw new Error('Cases must be a JSON array.');
  const expanded = JSON.stringify(value, null, 2);
  if (byteLength(expanded) <= CASE_TEXT_LIMIT) return { text: expanded, compact: false };
  const compact = JSON.stringify(value);
  if (byteLength(compact) > CASE_TEXT_LIMIT)
    throw new Error(`${label}: case data exceeds the editor's 128 KiB limit.`);
  return { text: compact, compact: true };
}
