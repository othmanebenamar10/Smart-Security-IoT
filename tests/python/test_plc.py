import os
import subprocess


def test_plc_status_cli():
    script = os.path.join(os.path.dirname(__file__), '..', 'plc', 'logo_controller.py')
    result = subprocess.run(['python3', script, '--status'], capture_output=True, text=True, timeout=10)
    assert result.returncode == 0
    assert result.stdout.strip() in ['ON', 'OFF']
