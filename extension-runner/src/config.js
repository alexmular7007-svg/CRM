import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveExtensionPath() {
  if (process.env.EXTENSION_PATH) {
    return path.resolve(process.cwd(), process.env.EXTENSION_PATH);
  }
  const containerPath = '/app/chrome-extension';
  if (fs.existsSync(containerPath)) {
    return containerPath;
  }
  return path.resolve(__dirname, '../../chrome-extension');
}

export const config = {
  extensionPath: resolveExtensionPath(),
  headless: process.env.HEADLESS === 'true' ? 'new' : (process.env.HEADLESS === 'false' ? false : false),
  browserTimeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10),
  testServerPort: parseInt(process.env.TEST_PORT || '8899', 10),
  runnerPort: parseInt(process.env.PORT || process.env.RUNNER_PORT || '9090', 10),
  runnerHost: process.env.HOST || process.env.RUNNER_HOST || '127.0.0.1',
  runnerSharedSecret: process.env.RUNNER_SHARED_SECRET || '',
  artifactsDir: process.env.ARTIFACTS_DIR
    ? path.resolve(process.cwd(), process.env.ARTIFACTS_DIR)
    : path.resolve(__dirname, '../artifacts'),
};

