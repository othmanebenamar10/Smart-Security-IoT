/**
 * Face Recognition Service Manager
 * @author BENAMAR Othmane
 * @secure Validates all payloads and manages process lifecycle
 */
import { spawn, ChildProcess } from 'child_process';
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

function getPythonCommand(): string {
  if (process.env.PYTHON_EXECUTABLE?.trim()) {
    return process.env.PYTHON_EXECUTABLE.trim();
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

/**
 * Validate face event payload
 * @param payload Payload to validate
 * @returns Validated FaceEvent
 */
function validateFaceEvent(payload: unknown): FaceEvent {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid face event: not an object');
  }

  const event = payload as Record<string, unknown>;
  
  if (typeof event.user !== 'string' || !event.user.trim()) {
    throw new Error('Invalid face event: missing user');
  }
  
  if (event.status !== 'authorized' && event.status !== 'unauthorized') {
    throw new Error('Invalid face event: invalid status');
  }
  
  if (typeof event.timestamp !== 'string') {
    throw new Error('Invalid face event: missing timestamp');
  }
  
  if (typeof event.snapshotPath !== 'string' || !event.snapshotPath.trim()) {
    throw new Error('Invalid face event: missing snapshotPath');
  }
  
  if (typeof event.cameraId !== 'string' || !event.cameraId.trim()) {
    throw new Error('Invalid face event: missing cameraId');
  }
  
  return {
    user: event.user.trim(),
    status: event.status,
    timestamp: event.timestamp,
    snapshotPath: event.snapshotPath,
    cameraId: event.cameraId,
    reason: typeof event.reason === 'string' ? event.reason : undefined
  };
}

let pythonProcess: ChildProcess | null = null;

/**
 * Launch face recognition service
 * @param callbacks Callbacks for authorized/unauthorized events
 */
export function launchFaceService(callbacks: FaceServiceCallbacks): void {
  try {
    if (pythonProcess) {
      logger.warn('Face recognition service is already running');
      return;
    }

    const servicePath = path.join(__dirname, '../../../ai/face_service.py');
    const args = [servicePath];

    pythonProcess = spawn(getPythonCommand(), args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000 // 30 second kill timeout
    });

    let buffer = '';

    // Handle stdout with buffering for partial JSON messages
    pythonProcess.stdout?.on('data', async (data) => {
      try {
        buffer += data.toString();
        const lines = buffer.split('\n');
        
        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          try {
            const payload = JSON.parse(line);
            const event = validateFaceEvent(payload);
            
            if (event.status === 'authorized') {
              await callbacks.onAuthorized(event);
            } else {
              await callbacks.onUnauthorized(event);
            }
          } catch (parseError) {
            logger.error('Failed to parse face service event', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              line
            });
          }
        }
        
        // Keep incomplete line in buffer
        buffer = lines[lines.length - 1];
      } catch (error) {
        logger.error('Face service data handling error', { error });
      }
    });

    // Handle stderr
    pythonProcess.stderr?.on('data', (data) => {
      logger.error('Face service error: %s', data.toString().trim());
    });

    // Handle process exit
    pythonProcess.on('close', (code) => {
      logger.warn('Face service process closed', { code });
      pythonProcess = null;
    });

    // Handle process errors
    pythonProcess.on('error', (error) => {
      logger.error('Face service process error', { error });
      pythonProcess = null;
    });

    logger.info('Face recognition service launched');
  } catch (error) {
    logger.error('Failed to launch face recognition service', { error });
    throw error;
  }
}

/**
 * Stop face recognition service
 */
export function stopFaceService(): void {
  if (pythonProcess) {
    pythonProcess.kill('SIGTERM');
    pythonProcess = null;
    logger.info('Face recognition service stopped');
  }
}
