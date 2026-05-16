import json
import os
import subprocess
import sys


def test_face_service_starts():
    script = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'ai', 'face_service.py'))
    result = subprocess.run([sys.executable, script, '--run-once'], capture_output=True, text=True, timeout=30)
    if result.returncode == 0:
        assert 'snapshotPath' in result.stdout or 'Face not matched to authorized database' in result.stdout
    else:
        # Accept common startup failures on CI/desktop without camera or model
        stderr = (result.stderr or '').lower()
        assert any(msg in stderr for msg in [
            'unable to open camera source',
            'no trained face model found',
            'failed to resolve hostname',
            'camera frame read failed'
        ])
