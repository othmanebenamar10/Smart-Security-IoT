const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Nom du visage a enregistrer: ', (name) => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    console.error('Nom invalide.');
    rl.close();
    process.exit(1);
  }

  rl.close();

  console.log('Ouverture de la webcam...');
  console.log('Apres avoir appuye sur Espace, le premier chargement IA peut prendre un moment.');

  const env = {
    ...process.env,
    CAMERA_SOURCE: 'webcam',
    WEBCAM_INDEX: process.env.WEBCAM_INDEX || '0'
  };

  const child = spawn(
    'py',
    ['-3.10', 'ai\\enroll_face.py', '--name', trimmedName, '--role', 'admin'],
    {
      stdio: 'inherit',
      shell: false,
      env
    }
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
});
