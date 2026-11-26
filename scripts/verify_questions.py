"""
Run every question's SymPy `verify` code and print its answers as JSON lines (docs/SPEC.md §11.3).

Convention for a question's `verify` field (Python):

    def answers(**params):
        # params are the variant's parameters ({} for questions without variants)
        return {"a": sympy_value, "b": [x, y], "c": "option-id"}

Values may be SymPy expressions, ints, Fractions/Rationals, lists (vectors, lists, sets) or
strings (MCQ option IDs). The Node side (packages/content/src/verify.ts) checks each value
against the question's answer key using the app's own checker.

Usage: python3 scripts/verify_questions.py content/questions > out.jsonl
"""
import json
import sys
import traceback
from pathlib import Path

import sympy
import yaml

sys.path.insert(0, str(Path(__file__).parent))
import verify_geometry  # noqa: E402


def to_payload(value):
    if isinstance(value, str):
        return {"kind": "choice", "value": value}
    if isinstance(value, (list, tuple)):
        return {"kind": "list", "value": [sympy.latex(sympy.sympify(v)) for v in value]}
    return {"kind": "latex", "value": sympy.latex(sympy.nsimplify(value) if isinstance(value, float) else sympy.sympify(value))}


def main(root: str) -> int:
    failures = 0
    for path in sorted(Path(root).rglob("*.yaml")):
        docs = yaml.safe_load(path.read_text())
        for q in docs if isinstance(docs, list) else [docs]:
            code = q.get("verify")
            if not code:
                continue
            variants = q.get("variants") or [{}]
            for i, params in enumerate(variants):
                ns = {"sympy": sympy, **{k: getattr(sympy, k) for k in dir(sympy) if not k.startswith("_")}}
                ns.update({k: getattr(verify_geometry, k) for k in dir(verify_geometry) if not k.startswith("_") and k not in ("math", "sympy")})
                try:
                    exec(code, ns)
                    result = ns["answers"](**params)
                    for part, value in result.items():
                        print(json.dumps({"question": q["id"], "variant": i if q.get("variants") else None, "part": part, **to_payload(value)}))
                except Exception:
                    failures += 1
                    print(json.dumps({"question": q["id"], "variant": i, "error": traceback.format_exc(limit=2)}))
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "content/questions"))
