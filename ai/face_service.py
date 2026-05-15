import argparse
import json
import os
import sys
from datetime import datetime

import cv2
import face_recognition
from deepface import DeepFace

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT_DIR = os.path.join(BASE_DIR, 'snapshots')
AUTHORIZED_FILE = os.path.join(BASE_DIR, 'authorized_users.json')
RTSP_URL = os.getenv('RTSP_URL', 'rtsp://camera.local:554/stream')
CAMERA_ID = os.getenv('CAMERA_ID', 'camera-01')

os.makedirs(SNAPSHOT_DIR, exist_ok=True)

with open(AUTHORIZED_FILE, 'r', encoding='utf-8') as auth_file:
    authorized_users = json.load(auth_file)

known_encodings = []
for user in authorized_users:
    if user.get('face_encoding'):
        try:
            known_encodings.append((user['nom'], json.loads(user['face_encoding'])))
        except Exception:
            continue

parser = argparse.ArgumentParser(description='Face recognition service for Smart Secure Access IoT')
parser.add_argument('--run-once', action='store_true', help='Process one frame and exit')
args = parser.parse_args()

capture = cv2.VideoCapture(RTSP_URL)
if not capture.isOpened():
    sys.stderr.write('Unable to open RTSP stream\n')
    sys.exit(1)

frame_count = 0
while True:
    ret, frame = capture.read()
    if not ret:
        sys.stderr.write('RTSP frame read failed\n')
        break

    frame_count += 1
    if frame_count % 5 != 0:
        continue

    try:
        face_image = DeepFace.detectFace(frame, detector_backend='opencv')
    except Exception as error:
        sys.stderr.write(f'DeepFace detection error: {error}\n')
        continue

    if face_image is None:
        continue

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    timestamp = datetime.utcnow().isoformat() + 'Z'
    snapshot_file = os.path.join(SNAPSHOT_DIR, f"face_{timestamp.replace(':', '-')}.png")
    cv2.imwrite(snapshot_file, frame)

    result = {
        'timestamp': timestamp,
        'snapshotPath': snapshot_file,
        'cameraId': CAMERA_ID
    }

    matched_user = None
    for encoding in face_encodings:
        for name, known_encoding in known_encodings:
            matches = face_recognition.compare_faces([known_encoding], encoding, tolerance=0.55)
            if matches[0]:
                matched_user = name
                break
        if matched_user:
            break

    if matched_user:
        result.update({
            'user': matched_user,
            'status': 'authorized'
        })
    else:
        result.update({
            'user': 'unknown',
            'status': 'unauthorized',
            'reason': 'Face not matched to authorized database'
        })

    sys.stdout.write(json.dumps(result) + '\n')
    sys.stdout.flush()

    if args.run_once:
        break

capture.release()
