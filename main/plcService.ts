import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { createLogger } from '../logs/logger';

const logger = createLogger();

export class LogoController {
  private readonly scriptPath: string;

  constructor() {
    this.scriptPath = path.join(__dirname, '../../plc/logo_controller.py');
  }

  activateLight(timeoutSeconds: number) {
    logger.info('Activating entrance light for %s seconds', timeoutSeconds);
    return new Promise<string>((resolve, reject) => {
      const subprocess = spawn('python3', [this.scriptPath, '--activate', timeoutSeconds.toString()], { encoding: 'utf8' });
      let output = '';
      let errorOutput = '';

      subprocess.stdout.on('data', (chunk) => {
        output += chunk.toString();
      });
      subprocess.stderr.on('data', (chunk) => {
        errorOutput += chunk.toString();
      });
      subprocess.on('close', (code) => {
        if (code !== 0) {
          logger.error('PLC light activation failed', { code, stderr: errorOutput });
          return reject(new Error(errorOutput || 'PLC activation failed'));
        }
        resolve(output.trim());
      });
      subprocess.on('error', (error) => {
        logger.error('PLC activation process failed', { error });
        reject(error);
      });
    });
  }

  readStatus() {
    const result = spawnSync('python3', [this.scriptPath, '--status'], { encoding: 'utf8' });
    if (result.error) {
      logger.error('PLC status read failed', { error: result.error });
      throw result.error;
    }
    return result.stdout.trim();
  }
}
