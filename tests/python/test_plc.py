import os
import subprocess
import sys
import pytest

# Skip PLC tests when snap7 is not installed in the environment
try:
    import snap7  # type: ignore
except Exception:
    pytest.skip('snap7 not installed, skipping PLC tests', allow_module_level=True)


def test_plc_status_cli():
    script = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'plc', 'logo_controller.py'))
    result = subprocess.run([sys.executable, script, '--status'], capture_output=True, text=True, timeout=10)
    if result.returncode == 0:
        assert result.stdout.strip() in ['ON', 'OFF']
    else:
        stderr = (result.stderr or '').lower()
        assert 'error' in stderr or 'failed' in stderr
