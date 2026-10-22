import { validateTask, validateSource } from './domain.mjs';

export const WORKSPACE_LIMIT = 256 * 1024;
export function workspaceDocument(task, candidate) {
  const t = validateTask(task);
  validateSource(candidate);
  return { format: 'bugproof-workspace', version: 1, task: t, candidate };
}
export function parseWorkspace(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > WORKSPACE_LIMIT)
    throw new Error('Workspace file exceeds 256 KiB.');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Workspace file is not valid JSON.');
  }
  if (data?.format !== 'bugproof-workspace' || data.version !== 1)
    throw new Error('Choose a version 1 BugProof workspace JSON file, not an evidence report.');
  if (Object.keys(data).some((k) => !['format', 'version', 'task', 'candidate'].includes(k)))
    throw new Error(
      'Unexpected workspace fields. Only task data and candidate source are accepted.',
    );
  return workspaceDocument(data.task, data.candidate);
}
