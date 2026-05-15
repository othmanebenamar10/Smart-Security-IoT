import cv2

class RTSPClient:
    def __init__(self, url: str, timeout: int = 10):
        self.url = url
        self.timeout = timeout
        self.capture = cv2.VideoCapture(self.url)

    def read_frame(self):
        if not self.capture.isOpened():
            raise RuntimeError('RTSP stream not available')
        success, frame = self.capture.read()
        if not success:
            raise RuntimeError('Failed to read RTSP frame')
        return frame

    def release(self):
        self.capture.release()
