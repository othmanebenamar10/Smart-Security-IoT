const { spawnSync } = require('child_process');

function run(command, args) {
  return spawnSync(command, args, { stdio: 'inherit', shell: false });
}

function canImportPytest(command) {
  const result = spawnSync(command, ['-c', 'import pytest'], { stdio: 'ignore', shell: false });
  return result.status === 0;
}

const pythonCandidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];
let selectedPython = null;

// On Windows prefer py -3.10 if available
if (process.platform === 'win32') {
  const probe = spawnSync('py', ['-3.10', '-c', 'print("ok")'], { stdio: 'ignore', shell: false });
  if (probe.status === 0) {
    selectedPython = 'py-3.10';
  }
}

if (!selectedPython) {
  for (const candidate of pythonCandidates) {
    const probeArgs = candidate === 'py' ? ['-3', '-c', 'print("ok")'] : ['-c', 'print("ok")'];
    const probe = spawnSync(candidate, probeArgs, { stdio: 'ignore', shell: false });
    if (probe.status === 0) {
      selectedPython = candidate;
      break;
    }
  }
}

if (!selectedPython) {
  console.log('Python non disponible, tests Python ignores.');
  process.exit(0);
}

if (selectedPython === 'py-3.10') {
  const pytestCheck = spawnSync('py', ['-3.10', '-c', 'import pytest'], { stdio: 'ignore', shell: false });
  if (pytestCheck.status !== 0) {
    console.log('pytest non installe, tests Python ignores.');
    process.exit(0);
  }

  const result = run('py', ['-3.10', '-m', 'pytest', 'tests/python']);
  process.exit(result.status ?? 1);
}

if (selectedPython === 'py') {
  const pytestCheck = spawnSync('py', ['-3', '-c', 'import pytest'], { stdio: 'ignore', shell: false });
  if (pytestCheck.status !== 0) {
    console.log('pytest non installe, tests Python ignores.');
    process.exit(0);
  }

  const result = run('py', ['-3', '-m', 'pytest', 'tests/python']);
  process.exit(result.status ?? 1);
}

if (!canImportPytest(selectedPython)) {
  console.log('pytest non installe, tests Python ignores.');
  process.exit(0);
}

const result = run(selectedPython, ['-m', 'pytest', 'tests/python']);
process.exit(result.status ?? 1);
