const { spawn } = require('child_process');

const env = {
  ...process.env,
  CAMERA_SOURCE: 'webcam',
  WEBCAM_INDEX: process.env.WEBCAM_INDEX || '0',
  CAMERA_ID: process.env.CAMERA_ID || 'webcam-pc'
};

const child = spawn(
  'py',
  ['-3.10', 'ai\\face_service.py', '--run-once'],
  {
    stdio: 'inherit',
    shell: false,
    env
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
