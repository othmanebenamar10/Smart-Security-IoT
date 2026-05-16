#!/usr/bin/env python3
"""
Face Recognition Service for Smart Secure Access IoT System
@author BENAMAR Othmane
@secure Validates all payloads and includes comprehensive error handling
"""
import argparse
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

import cv2
import face_recognition
from deepface import DeepFace

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SNAPSHOT_DIR = os.path.join(BASE_DIR, 'snapshots')
AUTHORIZED_FILE = os.path.join(BASE_DIR, 'authorized_users.json')
RTSP_URL = os.getenv('RTSP_URL', 'rtsp://camera.local:554/stream')
CAMERA_ID = os.getenv('CAMERA_ID', 'camera-01')
TOLERANCE = float(os.getenv('FACE_TOLERANCE', '0.6'))
MAX_RETRIES = 3

# Create snapshot directory
Path(SNAPSHOT_DIR).mkdir(parents=True, exist_ok=True)


def load_authorized_users():
    """Load authorized users from JSON file with validation."""
    try:
        if not os.path.exists(AUTHORIZED_FILE):
            logger.error(f"Authorized users file not found: {AUTHORIZED_FILE}")
            sys.exit(1)
        
        with open(AUTHORIZED_FILE, 'r', encoding='utf-8') as f:
            users = json.load(f)
        
        if not isinstance(users, list):
            logger.error("Authorized users must be a list")
            sys.exit(1)
        
        logger.info(f"Loaded {len(users)} authorized users")
        return users
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in authorized users file: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to load authorized users: {e}")
        sys.exit(1)


def load_face_encodings(users):
    """Load and validate face encodings from authorized users."""
    known_encodings = []
    
    for user in users:
        if not isinstance(user, dict):
            logger.warning("User entry is not a dictionary, skipping")
            continue
        
        nom = user.get('nom')
        encoding = user.get('face_encoding')
        
        if not nom or not encoding:
            logger.warning(f"User missing nom or face_encoding: {user}")
            continue
        
        try:
            if isinstance(encoding, str):
                face_data = json.loads(encoding)
            else:
                face_data = encoding
            
            known_encodings.append((nom, face_data))
        except (json.JSONDecodeError, TypeError) as e:
            logger.warning(f"Invalid face encoding for user {nom}: {e}")
            continue
    
    logger.info(f"Loaded {len(known_encodings)} face encodings")
    return known_encodings


def validate_frame(frame):
    """Validate frame is valid image data."""
    if frame is None or frame.size == 0:
        return False
    return True


def detect_and_recognize_faces(frame, known_encodings):
    """Detect faces and compare with known encodings."""
    try:
        # Detect face using DeepFace
        try:
            face_image = DeepFace.detectFace(frame, detector_backend='opencv')
        except Exception as e:
            logger.debug(f"DeepFace detection failed: {e}")
            return None
        
        if face_image is None:
            return None
        
        # Get face locations and encodings
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        if not face_encodings:
            return None
        
        # Compare with known encodings
        for encoding in face_encodings:
            for name, known_encoding in known_encodings:
                try:
                    matches = face_recognition.compare_faces(
                        [known_encoding],
                        encoding,
                        tolerance=TOLERANCE
                    )
                    
                    if matches and matches[0]:
                        return name
                except Exception as e:
                    logger.warning(f"Comparison failed for user {name}: {e}")
                    continue
        
        return None
    except Exception as e:
        logger.error(f"Face recognition error: {e}")
        return None


def save_snapshot(frame):
    """Save frame as snapshot with secure naming."""
    try:
        timestamp = datetime.utcnow().isoformat() + 'Z'
        safe_filename = f"face_{timestamp.replace(':', '-')}.png"
        snapshot_path = os.path.join(SNAPSHOT_DIR, safe_filename)
        
        success = cv2.imwrite(snapshot_path, frame)
        if not success:
            logger.warning(f"Failed to save snapshot: {snapshot_path}")
            return None
        
        logger.debug(f"Snapshot saved: {snapshot_path}")
        return snapshot_path
    except Exception as e:
        logger.error(f"Error saving snapshot: {e}")
        return None


def main():
    """Main face recognition service loop."""
    parser = argparse.ArgumentParser(
        description='Face recognition service for Smart Secure Access IoT'
    )
    parser.add_argument('--run-once', action='store_true', help='Process one frame and exit')
    args = parser.parse_args()
    
    try:
        # Load authorized users
        authorized_users = load_authorized_users()
        known_encodings = load_face_encodings(authorized_users)
        
        if not known_encodings:
            logger.warning("No valid face encodings loaded")
        
        # Connect to RTSP stream
        logger.info(f"Connecting to RTSP stream: {RTSP_URL}")
        capture = cv2.VideoCapture(RTSP_URL)
        
        if not capture.isOpened():
            logger.error("Unable to open RTSP stream")
            sys.exit(1)
        
        logger.info("RTSP stream opened successfully")
        
        frame_count = 0
        consecutive_errors = 0
        
        while True:
            try:
                ret, frame = capture.read()
                
                if not ret:
                    consecutive_errors += 1
                    if consecutive_errors > MAX_RETRIES:
                        logger.error("RTSP stream read failed after retries")
                        break
                    logger.warning(f"Frame read failed (attempt {consecutive_errors}/{MAX_RETRIES})")
                    continue
                
                consecutive_errors = 0
                frame_count += 1
                
                # Process every 5th frame to reduce CPU load
                if frame_count % 5 != 0:
                    continue
                
                # Validate frame
                if not validate_frame(frame):
                    logger.warning("Invalid frame received")
                    continue
                
                # Recognize faces
                matched_user = detect_and_recognize_faces(frame, known_encodings)
                
                # Save snapshot
                snapshot_path = save_snapshot(frame)
                
                # Prepare result
                timestamp = datetime.utcnow().isoformat() + 'Z'
                result = {
                    'timestamp': timestamp,
                    'snapshotPath': snapshot_path or '',
                    'cameraId': CAMERA_ID
                }
                
                if matched_user:
                    result.update({
                        'user': matched_user,
                        'status': 'authorized'
                    })
                    logger.info(f"Face recognized: {matched_user}")
                else:
                    result.update({
                        'user': 'unknown',
                        'status': 'unauthorized',
                        'reason': 'Face not matched to authorized database'
                    })
                    logger.info("Unauthorized face detected")
                
                # Output result as JSON
                sys.stdout.write(json.dumps(result) + '\n')
                sys.stdout.flush()
                
                if args.run_once:
                    break
            
            except Exception as e:
                logger.error(f"Processing error: {e}")
                consecutive_errors += 1
                if consecutive_errors > MAX_RETRIES:
                    logger.error("Too many consecutive errors, exiting")
                    break
                continue
        
        capture.release()
        logger.info("Face recognition service stopped")
    
    except KeyboardInterrupt:
        logger.info("Face recognition service interrupted")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Critical error in face recognition service: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
