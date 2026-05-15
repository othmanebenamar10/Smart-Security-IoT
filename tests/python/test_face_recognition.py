import json
import os
import subprocess


def test_face_service_starts():
    script = os.path.join(os.path.dirname(__file__), '..', 'ai', 'face_service.py')
    result = subprocess.run(['python3', script, '--run-once'], capture_output=True, text=True, timeout=30)
    assert result.returncode == 0
    assert 'snapshotPath' in result.stdout or 'Face not matched to authorized database' in result.stdout
