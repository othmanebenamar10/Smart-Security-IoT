import threading
import time
import cv2
import os

class RTSPStreamer:
    """Background RTSP/OpenCV reader that keeps the latest frame available.

    Use `get_frame()` to fetch the last JPEG bytes, or use `start()` to begin capture.
    """
    def __init__(self, source=0, width=640, height=480, fps=10):
        self.source = source
        self.width = width
        self.height = height
        self.fps = fps
        self.running = False
        self.frame = None
        self.lock = threading.Lock()
        self.thread = None

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)

    def _run(self):
        cap = cv2.VideoCapture(self.source)
        if self.width:
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        if self.height:
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        interval = 1.0 / max(1, self.fps)
        while self.running:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue
            # resize for stability
            frame = cv2.resize(frame, (self.width, self.height))
            # encode as JPEG
            ret2, jpg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if ret2:
                with self.lock:
                    self.frame = jpg.tobytes()
            time.sleep(interval)
        try:
            cap.release()
        except Exception:
            pass

    def get_frame(self):
        with self.lock:
            return self.frame


_default_streamer = None

def get_default_streamer(rtsp_url=None):
    global _default_streamer
    if _default_streamer is None:
        src = rtsp_url if rtsp_url else 0
        _default_streamer = RTSPStreamer(source=src)
        _default_streamer.start()
    return _default_streamer


def mjpeg_generator(streamer):
    """Yield multipart MJPEG frames from a RTSPStreamer instance."""
    boundary = b'--frame'
    while True:
        frame = streamer.get_frame()
        if frame:
            yield boundary + b"\r\nContent-Type: image/jpeg\r\nContent-Length: " + str(len(frame)).encode() + b"\r\n\r\n" + frame + b"\r\n"
        else:
            time.sleep(0.05)
