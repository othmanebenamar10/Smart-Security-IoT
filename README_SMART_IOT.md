Smart Security IoT - Minimal local version

Quick start:

1. Create a python virtualenv and install requirements:

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\activate
py -3.10 -m pip install -r requirements.txt
```

2. Initialize database:

```powershell
py -3.10 database\init_db.py
```

3. Start backend:

```powershell
py -3.10 -m backend.app
```

4. Start AI service (simulated if no camera):

```powershell
py -3.10 ai\face_service.py --run-once
# or continuous
py -3.10 ai\face_service.py
```

5. Open frontend: http://localhost:5000/

Notes:
- `face_recognition` requires dlib and can be heavy to install on Windows. The AI service will run in simulation mode if it cannot access the camera or if face_recognition is unavailable.
- Place known face images into `ai/known_faces/` to have them recognized (filenames used as names).
