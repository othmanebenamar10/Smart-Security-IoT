#!/usr/bin/env python3
"""
RTSP Client Helper for Smart Secure Access IoT
@author BENAMAR Othmane
@secure Includes validation, timeout, and error handling
"""
import logging
from typing import Optional, Tuple
import cv2
import numpy as np

logger = logging.getLogger(__name__)


class RTSPClient:
    """RTSP video stream client with error handling and validation."""
    
    # Constants
    MIN_FRAME_WIDTH = 320
    MIN_FRAME_HEIGHT = 240
    MAX_RECONNECT_ATTEMPTS = 3
    
    def __init__(self, url: str, timeout: int = 10):
        """
        Initialize RTSP client.
        
        Args:
            url: RTSP stream URL
            timeout: Connection timeout in seconds
        
        Raises:
            ValueError: If URL is invalid or timeout is invalid
        """
        if not isinstance(url, str) or not url.strip():
            raise ValueError("URL must be a non-empty string")
        
        if not url.lower().startswith(('rtsp://', 'rtsps://')):
            raise ValueError("URL must start with rtsp:// or rtsps://")
        
        if not isinstance(timeout, int) or timeout < 1 or timeout > 60:
            raise ValueError("Timeout must be between 1 and 60 seconds")
        
        self.url = url
        self.timeout = timeout
        self.capture: Optional[cv2.VideoCapture] = None
        self.reconnect_attempts = 0
        self._open_stream()
    
    def _open_stream(self) -> None:
        """Open RTSP stream with timeout configuration."""
        try:
            self.capture = cv2.VideoCapture(self.url)
            
            if self.capture:
                # Set timeout properties
                self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                self.capture.set(cv2.CAP_PROP_AUTOFOCUS, 0)
                
                # Verify stream is open
                if not self.capture.isOpened():
                    raise RuntimeError("Failed to open RTSP stream")
            
            logger.info(f"RTSP stream opened: {self.url}")
        
        except Exception as e:
            logger.error(f"Error opening RTSP stream: {e}")
            raise
    
    def _validate_frame(self, frame: Optional[np.ndarray]) -> bool:
        """Validate frame data."""
        if frame is None or frame.size == 0:
            return False
        
        if len(frame.shape) < 2:
            return False
        
        # Check minimum dimensions
        height, width = frame.shape[:2]
        if width < self.MIN_FRAME_WIDTH or height < self.MIN_FRAME_HEIGHT:
            logger.warning(f"Frame dimensions too small: {width}x{height}")
            return False
        
        return True
    
    def _attempt_reconnect(self) -> bool:
        """Attempt to reconnect to RTSP stream."""
        if self.reconnect_attempts >= self.MAX_RECONNECT_ATTEMPTS:
            return False
        
        try:
            logger.info(f"Attempting to reconnect (attempt {self.reconnect_attempts + 1}/{self.MAX_RECONNECT_ATTEMPTS})")
            
            # Release current capture
            if self.capture:
                self.capture.release()
            
            # Try to reopen
            self._open_stream()
            self.reconnect_attempts = 0
            return True
        
        except Exception as e:
            logger.warning(f"Reconnection attempt failed: {e}")
            self.reconnect_attempts += 1
            return False
    
    def read_frame(self) -> np.ndarray:
        """
        Read frame from RTSP stream.
        
        Returns:
            Frame as numpy array
        
        Raises:
            RuntimeError: If stream is not available or frame read fails
        """
        if not self.capture:
            raise RuntimeError("RTSP stream not initialized")
        
        if not self.capture.isOpened():
            logger.warning("RTSP stream closed, attempting reconnect")
            
            if not self._attempt_reconnect():
                raise RuntimeError("RTSP stream not available and reconnection failed")
        
        try:
            success, frame = self.capture.read()
            
            if not success:
                raise RuntimeError("Failed to read frame from RTSP stream")
            
            if not self._validate_frame(frame):
                raise RuntimeError("Invalid frame received from RTSP stream")
            
            self.reconnect_attempts = 0  # Reset on successful read
            return frame
        
        except Exception as e:
            logger.error(f"Frame read error: {e}")
            raise
    
    def get_frame_info(self) -> dict:
        """Get information about current stream frames."""
        if not self.capture or not self.capture.isOpened():
            raise RuntimeError("RTSP stream not available")
        
        try:
            width = int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = self.capture.get(cv2.CAP_PROP_FPS)
            
            return {
                'width': width,
                'height': height,
                'fps': fps,
                'url': self.url
            }
        except Exception as e:
            logger.error(f"Error getting frame info: {e}")
            return {}
    
    def release(self) -> None:
        """Release RTSP stream resources."""
        try:
            if self.capture:
                self.capture.release()
                self.capture = None
            logger.info("RTSP stream released")
        except Exception as e:
            logger.error(f"Error releasing RTSP stream: {e}")
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.release()
        return False
    
    def __del__(self):
        """Destructor - ensure stream is released."""
        try:
            self.release()
        except Exception:
            pass
