import { spawn } from 'child_process';
import path from 'path';
import { createLogger } from '../logs/logger';

const logger = createLogger();

export interface FaceEvent {
  user: string;
  status: 'authorized' | 'unauthorized';
  timestamp: string;
  snapshotPath: string;
  cameraId: string;
  reason?: string;
}

interface FaceServiceCallbacks {
  onAuthorized: (event: FaceEvent) => Promise<void>;
  onUnauthorized: (event: FaceEvent) => Promise<void>;
}

export function launchFaceService(callbacks: FaceServiceCallbacks) {
  const servicePath = path.join(__dirname, '../../ai/face_service.py');
  const args = [servicePath];
  const pythonProcess = spawn('python3', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  pythonProcess.stdout.on('data', async (data) => {
    try {
      const payload = JSON.parse(data.toString());
      if (payload.status === 'authorized') {
        await callbacks.onAuthorized(payload);
      } else {
        await callbacks.onUnauthorized(payload);
      }
    } catch (error) {
      logger.error('Failed to parse face service event', { error, raw: data.toString() });
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    logger.error('Face service error: %s', data.toString());
  });

  pythonProcess.on('close', (code) => {
    logger.error('Face service stopped with code %s', code);
  });
}
