"""Refresh `bytes` and `sha256` of every file listed in sandbox metadata.yaml files.

Sandbox_Training (https://github.com/CrashingGuru/Sandbox_Training) validates these fields against
schema/agent.metadata.schema.json and schema/notebook.metadata.schema.json. Run after editing agent.py or
the notebook:

    python3 sandbox/refresh_metadata.py            # rewrite in place
    python3 sandbox/refresh_metadata.py --check    # exit 1 if any hash is stale
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ENTRY = re.compile(r"(- path: (?P<path>\S+)\n\s+bytes: )(?P<bytes>\d+)(\n\s+sha256: )(?P<sha>[a-f0-9]{64})")


def refresh(meta: Path, check: bool) -> bool:
    item_dir = meta.parent.parent
    text = meta.read_text()

    def sub(m: re.Match) -> str:
        data = (item_dir / m["path"]).read_bytes()
        return f"{m.group(1)}{len(data)}{m.group(4)}{hashlib.sha256(data).hexdigest()}"

    new = ENTRY.sub(sub, text)
    if new != text:
        if check:
            print(f"stale: {meta.relative_to(ROOT)}")
            return False
        meta.write_text(new)
        print(f"updated: {meta.relative_to(ROOT)}")
    return True


if __name__ == "__main__":
    check = "--check" in sys.argv
    ok = all([refresh(m, check) for m in sorted(ROOT.glob("*/*/metadata/metadata.yaml"))])
    sys.exit(0 if ok else 1)
