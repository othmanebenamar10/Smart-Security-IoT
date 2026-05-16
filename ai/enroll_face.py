import argparse
import json
import os
import sys
from datetime import datetime

import cv2
import numpy as np
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUTHORIZED_FILE = os.path.join(BASE_DIR, 'authorized_users.json')
MODEL_FILE = os.path.join(BASE_DIR, 'face_model.yml')
load_dotenv(os.path.join(BASE_DIR, '..', '.env'))
CAMERA_SOURCE = os.getenv('CAMERA_SOURCE', 'webcam').strip().lower()
RTSP_URL = os.getenv('RTSP_URL', 'rtsp://camera.local:554/stream')
WEBCAM_INDEX = int(os.getenv('WEBCAM_INDEX', '0'))
SAMPLES_PER_USER = int(os.getenv('FACE_ENROLL_SAMPLES', '12'))
FACE_SIZE = (200, 200)


def get_face_cascade():
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    cascade = cv2.CascadeClassifier(cascade_path)
    if cascade.empty():
        raise RuntimeError('Unable to load Haar cascade')
    return cascade


def detect_single_face(frame, cascade):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(80, 80))
    if len(faces) != 1:
        return None

    x, y, w, h = faces[0]
    face = gray[y:y + h, x:x + w]
    face = cv2.resize(face, FACE_SIZE)
    return face, (x, y, w, h)


def open_capture():
    if CAMERA_SOURCE == 'webcam':
        return cv2.VideoCapture(WEBCAM_INDEX)
    return cv2.VideoCapture(RTSP_URL)


def load_users():
    if not os.path.exists(AUTHORIZED_FILE):
        return []
    with open(AUTHORIZED_FILE, 'r', encoding='utf-8') as file:
        data = json.load(file)
    return data if isinstance(data, list) else []


def save_users(users):
    with open(AUTHORIZED_FILE, 'w', encoding='utf-8') as file:
        json.dump(users, file, indent=2, ensure_ascii=False)


def build_training_set(users):
    faces = []
    labels = []

    for user in users:
        samples = user.get('samples', [])
        label = user.get('label')
        if not isinstance(label, int):
            continue

        for sample in samples:
            if not isinstance(sample, list):
                continue
            try:
                face = np.array(sample, dtype=np.uint8)
                if face.shape != FACE_SIZE:
                    face = cv2.resize(face, FACE_SIZE)
                faces.append(face)
                labels.append(label)
            except Exception:
                continue

    return faces, labels


def train_model(users):
    faces, labels = build_training_set(users)
    if not faces:
        return

    if not hasattr(cv2, 'face') or not hasattr(cv2.face, 'LBPHFaceRecognizer_create'):
        raise RuntimeError('OpenCV face module unavailable. Install opencv-contrib-python.')

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(faces, np.array(labels, dtype=np.int32))
    recognizer.save(MODEL_FILE)


parser = argparse.ArgumentParser(description='Enroll one known face into authorized_users.json')
parser.add_argument('--name', required=True, help='Displayed user name')
parser.add_argument('--role', default='user', help='User role')
args = parser.parse_args()

print('Initialisation de la webcam...')

capture = open_capture()
if not capture.isOpened():
    sys.stderr.write('Unable to open camera source for enrollment\n')
    sys.exit(1)

cascade = get_face_cascade()
users = load_users()
existing_user = next((user for user in users if user.get('nom') == args.name), None)
label = existing_user.get('label') if existing_user and isinstance(existing_user.get('label'), int) else (
    max([user.get('label', 0) for user in users if isinstance(user.get('label'), int)], default=0) + 1
)

samples = []
print(f'Capture en cours. {SAMPLES_PER_USER} images visage necessaires.')
print('Regarde la webcam. Appuie sur ESC pour annuler.')

while len(samples) < SAMPLES_PER_USER:
    success, frame = capture.read()
    if not success:
        sys.stderr.write('Unable to read camera frame during enrollment\n')
        capture.release()
        sys.exit(1)

    detected = detect_single_face(frame, cascade)
    preview = frame.copy()

    if detected is not None:
        face, (x, y, w, h) = detected
        cv2.rectangle(preview, (x, y), (x + w, y + h), (0, 255, 0), 2)
        samples.append(face.tolist())

    cv2.putText(
        preview,
        f'Samples: {len(samples)}/{SAMPLES_PER_USER}',
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )
    cv2.imshow('Enroll Face', preview)

    key = cv2.waitKey(120) & 0xFF
    if key == 27:
        capture.release()
        cv2.destroyAllWindows()
        sys.exit(0)

capture.release()
cv2.destroyAllWindows()

users = [user for user in users if user.get('nom') != args.name]
users.append({
    'nom': args.name,
    'role': args.role,
    'label': label,
    'samples': samples,
    'created_at': datetime.utcnow().isoformat() + 'Z'
})
save_users(users)
train_model(users)

print(f'Face enrolled successfully for {args.name}.')
