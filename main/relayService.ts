/**
 * Home access relay service
 * @secure Process timeout and error handling
 */
import { spawn, spawnSync, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { createLogger } from '../logs/logger';

const logger = createLogger();
const PROCESS_TIMEOUT = 15000; // 15 second timeout
const MAX_TIMEOUT_SECONDS = 300; // Max 5 minutes for light activation

function getPythonCommand(): string {
  if (process.env.PYTHON_EXECUTABLE?.trim()) {
    return process.env.PYTHON_EXECUTABLE.trim();
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

export class HomeAccessRelay {
  private readonly scriptPath: string;

  constructor() {
    this.scriptPath = path.join(__dirname, '../../../plc/logo_controller.py');
  }

  /**
   * Validate timeout parameter
   */
  private validateTimeout(seconds: number): number {
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > MAX_TIMEOUT_SECONDS) {
      throw new Error(`Invalid timeout: must be between 1 and ${MAX_TIMEOUT_SECONDS} seconds`);
    }
    return seconds;
  }

  /**
   * Activate entrance light with timeout protection
   * @param timeoutSeconds Duration to activate light in seconds
   * @returns Promise resolving to activation result
   */
  activateLight(timeoutSeconds: number): Promise<string> {
    try {
      const validatedTimeout = this.validateTimeout(timeoutSeconds);
      logger.info('Activating entrance light for %d seconds', validatedTimeout);

      return new Promise<string>((resolve, reject) => {
        const subprocess: ChildProcessWithoutNullStreams = spawn(getPythonCommand(), [
          this.scriptPath,
          '--activate',
          validatedTimeout.toString()
        ], {
          timeout: PROCESS_TIMEOUT
        });

        let output = '';
        let errorOutput = '';
        let processKilled = false;

        // Set a hard timeout
        const timer = setTimeout(() => {
          processKilled = true;
          subprocess.kill('SIGTERM');
          logger.error('Home access relay activation timeout');
          reject(new Error('Home access relay activation timeout'));
        }, PROCESS_TIMEOUT);

        subprocess.stdout.on('data', (chunk: Buffer) => {
          output += chunk.toString();
        });

        subprocess.stderr.on('data', (chunk: Buffer) => {
          errorOutput += chunk.toString();
        });

        subprocess.on('close', (code: number | null) => {
          clearTimeout(timer);
          
          if (processKilled) {
            return; // Already rejected
          }

          if (code !== 0) {
            logger.error('Home access relay activation failed', { code, stderr: errorOutput });
            return reject(new Error(errorOutput.trim() || `Relay activation failed with code ${code}`));
          }

          logger.info('Home access relay activated successfully');
          resolve(output.trim());
        });

        subprocess.on('error', (error: Error) => {
          clearTimeout(timer);
          logger.error('Home access relay process error', { error });
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Home access relay validation failed', { error });
      throw error;
    }
  }

  /**
   * Read current relay status
   * @returns Current relay status string
   */
  readStatus(): string {
    try {
      logger.info('Reading home access relay status');
      
      const result = spawnSync(getPythonCommand(), [
        this.scriptPath,
        '--status'
      ], {
        encoding: 'utf8',
        timeout: PROCESS_TIMEOUT
      });

      if (result.error) {
        logger.error('Home access relay status read failed', { error: result.error });
        throw result.error;
      }

      if (result.signal) {
        logger.error('Home access relay status process killed by signal', { signal: result.signal });
        throw new Error(`Relay status process killed: ${result.signal}`);
      }

      if (result.status !== 0) {
        logger.error('Home access relay status command failed', { status: result.status, stderr: result.stderr });
        throw new Error(result.stderr?.toString() || 'Relay status read failed');
      }

      const status = result.stdout?.toString().trim();
      logger.info('Home access relay status retrieved', { status });
      return status || 'unknown';
    } catch (error) {
      logger.error('Home access relay status read error', { error });
      throw error;
    }
  }
}
