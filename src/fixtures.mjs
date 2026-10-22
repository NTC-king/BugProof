const value = (id, args, expected) => ({
  id,
  args,
  expect: { kind: 'value', value: expected },
  provenance: 'self_authored_fixture',
});
const raises = (id, args, type) => ({
  id,
  args,
  expect: { kind: 'raises', type },
  provenance: 'self_authored_fixture',
});
export const fixtures = [
  {
    id: 'median',
    title: 'Median: the even-length trap',
    functionName: 'median',
    contract:
      'Return the median of finite numeric values, sorting without mutating input. For an even count, average the two central values. Empty input must raise ValueError.',
    source:
      'def median(values):\n    ordered = sorted(values)\n    return ordered[(len(ordered) - 1) // 2]\n',
    inadequate:
      'def median(values):\n    ordered = sorted(values)\n    if not ordered:\n        raise ValueError("empty input")\n    if len(ordered) == 2:\n        return (ordered[0] + ordered[1]) / 2\n    return ordered[len(ordered) // 2]\n',
    correct:
      'def median(values):\n    ordered = sorted(values)\n    n = len(ordered)\n    if not n:\n        raise ValueError("empty input")\n    if n % 2:\n        return ordered[n // 2]\n    return (ordered[n // 2 - 1] + ordered[n // 2]) / 2\n',
    examples: [value('odd', [[3, 1, 2]], 2), value('two', [[2, 8]], 5)],
    challenges: [
      value('four', [[10, 2, 8, 4]], 6),
      value('negative', [[-9, -3, -5, -1]], -4),
      value('single', [[7]], 7),
      raises('empty', [[]], 'ValueError'),
    ],
  },
  {
    id: 'clamp',
    title: 'Clamp: invalid bounds',
    functionName: 'clamp',
    contract:
      'Clamp x into the inclusive interval [low, high]. If low > high, raise ValueError. Equal bounds are valid.',
    source: 'def clamp(x, low, high):\n    return min(high, x)\n',
    inadequate: 'def clamp(x, low, high):\n    return max(low, min(high, x))\n',
    correct:
      'def clamp(x, low, high):\n    if low > high:\n        raise ValueError("reversed bounds")\n    return max(low, min(high, x))\n',
    examples: [value('inside', [5, 0, 10], 5), value('below', [-2, 0, 10], 0)],
    challenges: [
      value('above', [30, 0, 10], 10),
      value('equal', [4, 3, 3], 3),
      raises('reversed', [2, 10, 0], 'ValueError'),
    ],
  },
  {
    id: 'unique',
    title: 'Deduplicate: preserve order',
    functionName: 'unique',
    contract:
      'Return each integer once, preserving the order of its first appearance. Empty input returns an empty list.',
    source: 'def unique(values):\n    return values\n',
    inadequate: 'def unique(values):\n    return sorted(set(values))\n',
    correct:
      'def unique(values):\n    return [x for i, x in enumerate(values) if x not in values[:i]]\n',
    examples: [value('sorted', [[1, 1, 2, 2]], [1, 2]), value('empty', [[]], [])],
    challenges: [
      value('order', [[3, 1, 3, 2]], [3, 1, 2]),
      value('negative', [[0, -2, 0, -2, 1]], [0, -2, 1]),
    ],
  },
  {
    id: 'chunks',
    title: 'Chunking: keep the last piece',
    functionName: 'chunks',
    contract:
      'Split values into consecutive chunks of size n, retaining a shorter final chunk. n must be a positive integer, otherwise raise ValueError.',
    source:
      'def chunks(values, n):\n    return [values[i:i+n] for i in range(0, len(values) - n + 1, n)]\n',
    inadequate:
      'def chunks(values, n):\n    if n <= 0:\n        raise ValueError("size")\n    return [values[i:i+n] for i in range(0, len(values) - n + 1, n)]\n',
    correct:
      'def chunks(values, n):\n    if n <= 0 or int(n) != n:\n        raise ValueError("size")\n    return [values[i:i+n] for i in range(0, len(values), n)]\n',
    examples: [
      value(
        'even',
        [[1, 2, 3, 4], 2],
        [
          [1, 2],
          [3, 4],
        ],
      ),
      raises('zero', [[1], 0], 'ValueError'),
    ],
    challenges: [
      value('remainder', [[1, 2, 3], 2], [[1, 2], [3]]),
      value('short', [[1], 5], [[1]]),
      value('empty', [[], 2], []),
      raises('negative', [[1], -1], 'ValueError'),
    ],
  },
];
fixtures.push(
  {
    id: 'mean',
    title: 'Mean: fractional results',
    functionName: 'mean',
    contract: 'Return the arithmetic mean of finite numeric values. Empty input raises ValueError.',
    source: 'def mean(values):\n    return sum(values) // len(values)\n',
    inadequate:
      'def mean(values):\n    if not values:\n        raise ValueError("empty")\n    if len(values) == 2:\n        return sum(values) / 2\n    return sum(values) // len(values)\n',
    correct:
      'def mean(values):\n    if not values:\n        raise ValueError("empty")\n    return sum(values) / len(values)\n',
    examples: [value('pair', [[1, 2]], 1.5), raises('empty', [[]], 'ValueError')],
    challenges: [
      value('three', [[0, 0, 3]], 1),
      value('four', [[1, 1, 1, 2]], 1.25),
      value('negative', [[-2, -3]], -2.5),
    ],
  },
  {
    id: 'sorted',
    title: 'Sorted: look beyond the ends',
    functionName: 'is_sorted',
    contract:
      'Return true if numeric values are in nondecreasing order. Duplicates are allowed. Empty and singleton lists are sorted.',
    source:
      'def is_sorted(values):\n    return all([values[i] < values[i+1] for i in range(len(values)-1)])\n',
    inadequate:
      'def is_sorted(values):\n    if len(values) < 2:\n        return True\n    return values[0] <= values[-1]\n',
    correct:
      'def is_sorted(values):\n    return all([values[i] <= values[i+1] for i in range(len(values)-1)])\n',
    examples: [value('duplicates', [[1, 1, 2]], true), value('descending', [[3, 2]], false)],
    challenges: [
      value('interior', [[1, 4, 2, 5]], false),
      value('empty', [[]], true),
      value('single', [[5]], true),
    ],
  },
  {
    id: 'first',
    title: 'Find: the first occurrence',
    functionName: 'find_first',
    contract:
      'Return the zero-based index of the first occurrence of target in integer values, or -1 if absent.',
    source:
      'def find_first(values, target):\n    result = -1\n    for i, x in enumerate(values):\n        if x == target:\n            result = i\n    return result\n',
    inadequate:
      'def find_first(values, target):\n    for i, x in enumerate(values):\n        if x == target:\n            return i\n    return 0\n',
    correct:
      'def find_first(values, target):\n    for i, x in enumerate(values):\n        if x == target:\n            return i\n    return -1\n',
    examples: [value('duplicates', [[2, 7, 2], 2], 0), value('middle', [[1, 7, 3], 7], 1)],
    challenges: [
      value('missing', [[1, 2], 9], -1),
      value('empty', [[], 1], -1),
      value('last', [[1, 2, 3], 3], 2),
    ],
  },
  {
    id: 'ceil',
    title: 'Ceiling division: negative values',
    functionName: 'ceil_div',
    contract:
      'For integer a and positive integer b, return the smallest integer greater than or equal to a/b. b <= 0 raises ValueError.',
    source: 'def ceil_div(a, b):\n    return a // b\n',
    inadequate:
      'def ceil_div(a, b):\n    if b <= 0:\n        raise ValueError("denominator")\n    return int(a / b) + (a % b != 0)\n',
    correct:
      'def ceil_div(a, b):\n    if b <= 0:\n        raise ValueError("denominator")\n    return -(-a // b)\n',
    examples: [value('fraction', [3, 2], 2), value('exact', [6, 3], 2)],
    challenges: [
      value('negative', [-3, 2], -1),
      value('negative_exact', [-4, 2], -2),
      raises('zero', [3, 0], 'ValueError'),
    ],
  },
  {
    id: 'intersection',
    title: 'Intersection: stable and unique',
    functionName: 'intersection',
    contract:
      'Return integers present in both lists, once each, in the order of first appearance in the left list.',
    source: 'def intersection(left, right):\n    return [x for x in left if x in right]\n',
    inadequate:
      'def intersection(left, right):\n    return sorted(set([x for x in left if x in right]))\n',
    correct:
      'def intersection(left, right):\n    return [x for i, x in enumerate(left) if x in right and x not in left[:i]]\n',
    examples: [value('duplicates', [[1, 1, 2], [1]], [1]), value('empty', [[], [1]], [])],
    challenges: [
      value(
        'order',
        [
          [3, 1, 2, 3],
          [2, 3],
        ],
        [3, 2],
      ),
      value('none', [[1, 2], [3]], []),
    ],
  },
  {
    id: 'ratio',
    title: 'Safe ratio: zero is a result',
    functionName: 'safe_ratio',
    contract:
      'Return numerator / denominator for finite numbers. If denominator is zero return None. A zero numerator with nonzero denominator returns zero.',
    source: 'def safe_ratio(numerator, denominator):\n    return numerator / denominator\n',
    inadequate:
      'def safe_ratio(numerator, denominator):\n    if not numerator or not denominator:\n        return None\n    return numerator / denominator\n',
    correct:
      'def safe_ratio(numerator, denominator):\n    if denominator == 0:\n        return None\n    return numerator / denominator\n',
    examples: [value('normal', [6, 2], 3), value('zero_denominator', [1, 0], null)],
    challenges: [
      value('zero_numerator', [0, 5], 0),
      value('both_zero', [0, 0], null),
      value('negative', [-6, 2], -3),
    ],
  },
  {
    id: 'rotate',
    title: 'Rotate: wrap the count',
    functionName: 'rotate_left',
    contract:
      'Rotate an integer list left by integer n positions, wrapping n modulo its length. Negative n rotates right. Empty input returns an empty list.',
    source: 'def rotate_left(values, n):\n    return values[n:] + values[:n]\n',
    inadequate:
      'def rotate_left(values, n):\n    n = n % len(values)\n    return values[n:] + values[:n]\n',
    correct:
      'def rotate_left(values, n):\n    if not values:\n        return []\n    n = n % len(values)\n    return values[n:] + values[:n]\n',
    examples: [value('wrap', [[1, 2, 3], 4], [2, 3, 1]), value('one', [[1, 2, 3], 1], [2, 3, 1])],
    challenges: [
      value('empty', [[], 5], []),
      value('negative', [[1, 2, 3], -1], [3, 1, 2]),
      value('zero', [[1, 2], 0], [1, 2]),
    ],
  },
  {
    id: 'prefix',
    title: 'Running sums: keep negatives',
    functionName: 'running_sum',
    contract:
      'Return inclusive prefix sums for finite numeric values, retaining negative sums. Empty input returns an empty list.',
    source: 'def running_sum(values):\n    return [sum(values[:i]) for i in range(len(values))]\n',
    inadequate:
      'def running_sum(values):\n    return [max(0, sum(values[:i+1])) for i in range(len(values))]\n',
    correct:
      'def running_sum(values):\n    return [sum(values[:i+1]) for i in range(len(values))]\n',
    examples: [value('positive', [[1, 2, 3]], [1, 3, 6]), value('zeros', [[0, 0]], [0, 0])],
    challenges: [
      value('negative', [[-2, 1, -3]], [-2, -1, -4]),
      value('empty', [[]], []),
      value('mixed', [[3, -5, 4]], [3, -2, 2]),
    ],
  },
);
// All variants are deliberately hand-authored, not observed model outputs.
for (const f of fixtures.slice(0, 6))
  f.extraMutants = [
    `def ${f.functionName}(${f.source.match(/^def\s+\w+\(([^)]*)\)/)[1]}):\n    return None\n`,
  ];
