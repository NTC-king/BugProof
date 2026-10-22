// LCS-based line diff. Bounded to prevent a large pasted file from freezing the editor.
export function lineDiff(before, after, limit = 400) {
  const a = before.split('\n'),
    b = after.split('\n');
  if (a.length > limit || b.length > limit)
    return {
      limited: true,
      rows: [],
      message: `Line diff is limited to ${limit} lines per version. Inspect the source editors instead.`,
    };
  const matrix = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      matrix[i][j] =
        a[i] === b[j] ? matrix[i + 1][j + 1] + 1 : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
  const rows = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      rows.push({ kind: 'unchanged', text: a[i], beforeLine: ++i, afterLine: ++j });
    } else if (i < a.length && (j === b.length || matrix[i + 1][j] >= matrix[i][j + 1])) {
      rows.push({ kind: 'removed', text: a[i], beforeLine: ++i, afterLine: null });
    } else {
      rows.push({ kind: 'added', text: b[j], beforeLine: null, afterLine: ++j });
    }
  }
  return { limited: false, rows };
}
