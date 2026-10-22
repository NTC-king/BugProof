import ast
import builtins
import json
import math

class PolicyError(Exception):
    pass

_NAMES = ['len', 'sum', 'min', 'max', 'abs', 'sorted', 'list', 'set', 'dict', 'enumerate', 'zip', 'all', 'any', 'int', 'float', 'str', 'bool', 'round', 'ValueError', 'TypeError', 'ZeroDivisionError', 'IndexError', 'KeyError']
_ALLOWED = {getattr(ast, name) for name in ['Module', 'FunctionDef', 'arguments', 'arg', 'Return', 'Assign', 'AugAssign', 'If', 'For', 'Break', 'Continue', 'Raise', 'Expr', 'Pass', 'Name', 'Constant', 'List', 'Tuple', 'Dict', 'Set', 'Subscript', 'Slice', 'BinOp', 'UnaryOp', 'BoolOp', 'Compare', 'IfExp', 'ListComp', 'SetComp', 'DictComp', 'comprehension', 'Call', 'keyword', 'Load', 'Store', 'Add', 'Sub', 'Mult', 'Div', 'FloorDiv', 'Mod', 'UAdd', 'USub', 'Not', 'And', 'Or', 'Eq', 'NotEq', 'Gt', 'GtE', 'Lt', 'LtE', 'In', 'NotIn', 'Is', 'IsNot']}

def _range(*args):
    result = range(*args)
    if len(result) > 10000:
        raise PolicyError('range is limited to 10,000 items')
    return result

def _validate(source, function_name):
    if not isinstance(source, str) or len(source.encode()) > 12288:
        raise PolicyError('Source exceeds the supported size.')
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        raise PolicyError('Invalid Python syntax: ' + str(exc))
    if len(tree.body) != 1 or not isinstance(tree.body[0], ast.FunctionDef) or tree.body[0].name != function_name:
        raise PolicyError('Provide exactly one function with the declared name.')
    fn = tree.body[0]
    if fn.decorator_list or fn.returns or fn.args.defaults or any(x is not None for x in fn.args.kw_defaults) or fn.args.vararg or fn.args.kwarg:
        raise PolicyError('Decorators, annotations, defaults and variadic parameters are unsupported.')
    nodes = list(ast.walk(tree))
    if len(nodes) > 800:
        raise PolicyError('Function is too complex for this local prototype.')
    stack = [(tree, 0)]
    while stack:
        current, depth = stack.pop()
        if depth > 40:
            raise PolicyError('Python syntax nesting exceeds 40 levels.')
        stack.extend((child, depth + 1) for child in ast.iter_child_nodes(current))
    permitted_calls = set(_NAMES + ['range'])
    if function_name in permitted_calls or '__' in function_name:
        raise PolicyError('Function name conflicts with a reserved built-in.')
    for node in nodes:
        if type(node) not in _ALLOWED:
            raise PolicyError('Unsupported Python construct: ' + type(node).__name__)
        if isinstance(node, ast.arg) and (node.annotation or '__' in node.arg or node.arg in permitted_calls):
            raise PolicyError('Unsupported or reserved parameter name.')
        if isinstance(node, ast.Name) and ('__' in node.id or (isinstance(node.ctx, ast.Store) and node.id in permitted_calls)):
            raise PolicyError('Reserved names cannot be accessed or rebound.')
        if isinstance(node, ast.Call) and (not isinstance(node.func, ast.Name) or node.func.id not in permitted_calls or node.keywords):
            raise PolicyError('Only the documented direct built-in calls without keyword callbacks are supported.')
        if isinstance(node, ast.Constant):
            value = node.value
            if not isinstance(value, (str, int, float, bool, type(None))):
                raise PolicyError('Unsupported literal.')
            if isinstance(value, (int, float)) and (not math.isfinite(value) or abs(value) > 1e9):
                raise PolicyError('Numeric literal is too large.')
            if isinstance(value, str) and len(value) > 4096:
                raise PolicyError('String literal is too large.')
        if isinstance(node, ast.comprehension) and node.is_async:
            raise PolicyError('Async comprehensions are unsupported.')
    return compile(tree, '<submitted-function>', 'exec')

def _execute_case_json(payload_json):
    payload = json.loads(payload_json)
    try:
        compiled = _validate(payload['source'], payload['functionName'])
    except Exception as exc:
        return json.dumps({'status': 'blocked', 'message': str(exc)[:2000]})
    safe = {name: getattr(builtins, name) for name in _NAMES}
    safe['range'] = _range
    namespace = {'__builtins__': safe}
    try:
        exec(compiled, namespace, namespace)
        result = namespace[payload['functionName']](*payload['args'], **payload.get('kwargs', {}))
    except PolicyError as exc:
        return json.dumps({'status': 'blocked', 'message': str(exc)[:2000]})
    except Exception as exc:
        return json.dumps({'status': 'raised', 'exceptionType': type(exc).__name__, 'message': str(exc)[:1000]})
    try:
        encoded = json.dumps({'status': 'returned', 'value': result}, allow_nan=False)
        if len(encoded.encode()) > 8192:
            return json.dumps({'status': 'runtime_error', 'message': 'Returned output exceeds 8 KiB.'})
        return encoded
    except Exception:
        return json.dumps({'status': 'runtime_error', 'message': 'Return value is not supported finite JSON.'})
