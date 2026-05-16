import argparse
import json
import os
import sys
from datetime import datetime

import cv2
import requests
import base64
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT_DIR = os.path.join(BASE_DIR, 'snapshots')
AUTHORIZED_FILE = os.path.join(BASE_DIR, 'authorized_users.json')
MODEL_FILE = os.path.join(BASE_DIR, 'face_model.yml')
load_dotenv(os.path.join(BASE_DIR, '..', '.env'))
CAMERA_SOURCE = os.getenv('CAMERA_SOURCE', 'rtsp').strip().lower()
RTSP_URL = os.getenv('RTSP_URL', 'rtsp://camera.local:554/stream')
WEBCAM_INDEX = int(os.getenv('WEBCAM_INDEX', '0'))
CAMERA_ID = os.getenv('CAMERA_ID', 'camera-01')
MATCH_THRESHOLD = float(os.getenv('FACE_MATCH_THRESHOLD', '70'))
FACE_SIZE = (200, 200)

os.makedirs(SNAPSHOT_DIR, exist_ok=True)


def get_face_cascade():
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    cascade = cv2.CascadeClassifier(cascade_path)
    if cascade.empty():
        raise RuntimeError('Unable to load Haar cascade')
    return cascade


def detect_faces(frame, cascade):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(80, 80))
    result = []
    for (x, y, w, h) in faces:
        face = gray[y:y + h, x:x + w]
        face = cv2.resize(face, FACE_SIZE)
        result.append(face)
    return result


def open_capture():
    if CAMERA_SOURCE == 'webcam':
        return cv2.VideoCapture(WEBCAM_INDEX)
    return cv2.VideoCapture(RTSP_URL)


def load_users():
    if not os.path.exists(AUTHORIZED_FILE):
        return []
    with open(AUTHORIZED_FILE, 'r', encoding='utf-8') as auth_file:
        data = json.load(auth_file)
    return data if isinstance(data, list) else []


def load_recognizer():
    if not os.path.exists(MODEL_FILE):
        return None
    if not hasattr(cv2, 'face') or not hasattr(cv2.face, 'LBPHFaceRecognizer_create'):
        raise RuntimeError('OpenCV face module unavailable. Install opencv-contrib-python.')
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(MODEL_FILE)
    return recognizer


def post_event_to_backend(payload: dict):
    try:
        url = os.getenv('BACKEND_URL', 'http://127.0.0.1:5000/api/report_event')
        requests.post(url, json=payload, timeout=5)
        return True
    except Exception:
        return False


parser = argparse.ArgumentParser(description='Face recognition service for Smart Secure Access IoT')
parser.add_argument('--run-once', action='store_true', help='Process one frame and exit')
args = parser.parse_args()

users = load_users()
label_to_name = {
    user['label']: user['nom']
    for user in users
    if isinstance(user.get('label'), int) and isinstance(user.get('nom'), str)
}

capture = open_capture()
if not capture.isOpened():
    source_label = f'webcam index {WEBCAM_INDEX}' if CAMERA_SOURCE == 'webcam' else RTSP_URL
    sys.stderr.write(f'Unable to open camera source: {source_label}\n')
    sys.exit(1)

cascade = get_face_cascade()
recognizer = load_recognizer()
if recognizer is None:
    sys.stderr.write('No trained face model found. Enroll a face first.\n')
    sys.exit(1)

frame_count = 0
while True:
    ret, frame = capture.read()
    if not ret:
        sys.stderr.write('Camera frame read failed\n')
        break

    frame_count += 1
    if frame_count % 3 != 0:
        continue

    faces = detect_faces(frame, cascade)
    if not faces:
        continue

    timestamp = datetime.utcnow().isoformat() + 'Z'
    snapshot_file = os.path.join(SNAPSHOT_DIR, f"face_{timestamp.replace(':', '-')}.png")
    cv2.imwrite(snapshot_file, frame)
    label, confidence = recognizer.predict(faces[0])
    matched_user = label_to_name.get(label)

    result = {
        'timestamp': timestamp,
        'snapshotPath': snapshot_file,
        'cameraId': CAMERA_ID
    }

    if matched_user and confidence <= MATCH_THRESHOLD:
        result.update({
            'user': matched_user,
            'status': 'authorized'
        })
    else:
        result.update({
            'user': 'unknown',
            'status': 'unauthorized',
            'reason': f'Face not matched to authorized database (confidence={confidence:.2f})'
        })

    # try to notify backend with image
    payload = {'timestamp': timestamp, 'type': 'known' if result['status'] == 'authorized' else 'unknown', 'name': result.get('user')}
    try:
        with open(snapshot_file, 'rb') as f:
            b = f.read()
            payload['image_base64'] = base64.b64encode(b).decode('ascii')
    except Exception:
        pass

    posted = post_event_to_backend(payload)
    if not posted:
        # fallback to printing result
        sys.stdout.write(json.dumps(result) + '\n')
        sys.stdout.flush()

    if args.run_once:
        break

capture.release()
