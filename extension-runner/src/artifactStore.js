/**
 * Artifact Store — Phase 6C Step 4
 *
 * Provides secure storage and retrieval of screenshot artifacts.
 * All inputs are validated with strict allowlists before any file operations.
 */
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

// ── Validators ──────────────────────────────────────────────────────────────

/**
 * Validate a run ID. Only alphanumeric characters, hyphens, and underscores are allowed.
 * Rejects all path traversal, separator, and encoding attacks.
 * @param {*} runId
 * @throws {Error} if runId is invalid
 */
export function validateRunId(runId) {
  if (runId === null || runId === undefined) {
    throw new Error('Run ID must not be null or undefined');
  }
  if (typeof runId !== 'string') {
    throw new Error('Run ID must be a string');
  }
  if (runId.length === 0) {
    throw new Error('Run ID must not be empty');
  }

  // Reject null bytes
  if (runId.includes('\0')) {
    throw new Error('Run ID contains a null byte');
  }

  // Reject percent-encoded null bytes
  const lower = runId.toLowerCase();
  if (lower.includes('%00')) {
    throw new Error('Run ID contains encoded null byte (%00)');
  }

  // Reject encoded path separators and traversal sequences (case-insensitive)
  if (lower.includes('%2f') || lower.includes('%5c') || lower.includes('%2e')) {
    throw new Error('Run ID contains encoded path-traversal or separator characters');
  }

  // Reject double-encoded variants
  if (lower.includes('%252f') || lower.includes('%252e') || lower.includes('%255c')) {
    throw new Error('Run ID contains double-encoded path-traversal characters');
  }

  // Reject dot-dot traversal (literal)
  if (runId.includes('..')) {
    throw new Error('Run ID cannot contain path traversal sequences (..)');
  }

  // Reject POSIX path separator
  if (runId.includes('/')) {
    throw new Error('Run ID cannot contain path separators (/)');
  }

  // Reject Windows path separator
  if (runId.includes('\\')) {
    throw new Error('Run ID cannot contain path separators (\\)');
  }

  // Reject absolute POSIX paths
  if (runId.startsWith('/')) {
    throw new Error('Run ID cannot be an absolute path');
  }

  // Reject Windows drive paths (e.g. C:, D:)
  if (/^[a-zA-Z]:/.test(runId)) {
    throw new Error('Run ID cannot be a Windows drive-rooted path');
  }

  // Reject Windows UNC paths
  if (runId.startsWith('\\\\')) {
    throw new Error('Run ID cannot be a Windows UNC path');
  }

  // Strict allowlist: only alphanumeric, hyphen, underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(runId)) {
    throw new Error(`Run ID contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed. Got: '${runId}'`);
  }
}

/**
 * Validate a screenshot filename. Must be a safe basename ending in .png.
 * Rejects all path traversal, separator, and encoding attacks.
 * @param {*} filename
 * @throws {Error} if filename is invalid
 */
export function validateFilename(filename) {
  if (filename === null || filename === undefined) {
    throw new Error('Filename must not be null or undefined');
  }
  if (typeof filename !== 'string') {
    throw new Error('Filename must be a string');
  }
  if (filename.length === 0) {
    throw new Error('Filename must not be empty');
  }

  // Reject null bytes
  if (filename.includes('\0')) {
    throw new Error('Filename contains a null byte');
  }

  const lower = filename.toLowerCase();

  // Reject encoded null bytes
  if (lower.includes('%00')) {
    throw new Error('Filename contains encoded null byte (%00)');
  }

  // Reject encoded path separators and traversal sequences
  if (lower.includes('%2f') || lower.includes('%5c') || lower.includes('%2e')) {
    throw new Error('Filename contains encoded path-traversal or separator characters');
  }

  // Reject double-encoded variants
  if (lower.includes('%252f') || lower.includes('%252e') || lower.includes('%255c')) {
    throw new Error('Filename contains double-encoded path-traversal characters');
  }

  // Reject dot-dot traversal
  if (filename.includes('..')) {
    throw new Error('Filename cannot contain path traversal sequences (..)');
  }

  // Reject POSIX path separator
  if (filename.includes('/')) {
    throw new Error('Filename cannot contain path separators (/)');
  }

  // Reject Windows path separator
  if (filename.includes('\\')) {
    throw new Error('Filename cannot contain path separators (\\)');
  }

  // Reject absolute POSIX paths
  if (filename.startsWith('/')) {
    throw new Error('Filename cannot be an absolute path');
  }

  // Reject Windows drive paths
  if (/^[a-zA-Z]:/.test(filename)) {
    throw new Error('Filename cannot be a Windows drive-rooted path');
  }

  // Reject Windows UNC paths
  if (filename.startsWith('\\\\')) {
    throw new Error('Filename cannot be a Windows UNC path');
  }

  // Must end with .png
  if (!lower.endsWith('.png')) {
    throw new Error(`Filename must have a .png extension. Got: '${filename}'`);
  }

  // Strict allowlist: only alphanumeric, underscore, hyphen, and .png suffix
  if (!/^[a-zA-Z0-9_-]+\.png$/i.test(filename)) {
    throw new Error(`Filename contains invalid characters. Only alphanumeric characters, hyphens, underscores, and a .png extension are allowed. Got: '${filename}'`);
  }
}

// ── Storage ──────────────────────────────────────────────────────────────────

/**
 * Store a screenshot file into artifacts/<runId>/<filename>.
 * Validates both runId and filename before performing any file operations.
 *
 * @param {string} runId       - The test run ID (validated)
 * @param {string} filename    - The destination filename (must end in .png, validated)
 * @param {string} sourceFilePath - Absolute path to the source PNG file to copy
 * @returns {Promise<string>}  - Resolved destination path
 * @throws {Error} on validation failure or containment violation
 */
export async function storeScreenshot(runId, filename, sourceFilePath) {
  validateRunId(runId);
  validateFilename(filename);

  const artifactsBase = path.resolve(config.artifactsDir);
  const resolvedArtifactsBase = path.resolve(artifactsBase);
  const runDir = path.join(resolvedArtifactsBase, runId);
  const resolvedRunDir = path.resolve(runDir);

  // Containment check: runDir must be strictly inside artifactsBase
  if (!resolvedRunDir.startsWith(resolvedArtifactsBase + path.sep)) {
    throw new Error('Run directory escaped artifacts directory');
  }

  fs.mkdirSync(resolvedRunDir, { recursive: true });

  const candidatePath = path.join(resolvedRunDir, filename);
  const destPath = path.resolve(candidatePath);

  // Containment check: destination must be strictly inside resolvedRunDir
  if (!destPath.startsWith(resolvedRunDir + path.sep)) {
    throw new Error('Artifact destination path escaped run directory');
  }

  if (Buffer.isBuffer(sourceFilePath)) {
    await fs.promises.writeFile(destPath, sourceFilePath);
  } else {
    await fs.promises.copyFile(sourceFilePath, destPath);
  }
  return destPath;
}

/**
 * Get the canonical real path of an artifact.
 * Uses realpathSync to resolve symlinks, then verifies containment.
 *
 * @param {string} runId    - The test run ID (validated)
 * @param {string} filename - The artifact filename (validated)
 * @returns {Promise<string|null>} - Real path if file exists and is safe; null if not found
 * @throws {Error} if path escapes artifacts directory (symlink escape attempt)
 */
export async function getArtifactPath(runId, filename) {
  validateRunId(runId);
  validateFilename(filename);

  const artifactsBase = path.resolve(config.artifactsDir);
  const resolvedArtifactsBase = path.resolve(artifactsBase);
  const runDir = path.join(resolvedArtifactsBase, runId);
  const resolvedRunDir = path.resolve(runDir);

  if (!resolvedRunDir.startsWith(resolvedArtifactsBase + path.sep)) {
    throw new Error('Run directory escaped artifacts directory');
  }

  const candidatePath = path.join(resolvedRunDir, filename);

  let realPath;
  try {
    realPath = fs.realpathSync(candidatePath);
  } catch (err) {
    // ENOENT: file doesn't exist — not found
    if (err.code === 'ENOENT') {
      return null;
    }
    // Other errors: propagate
    throw err;
  }

  let realRunDir;
  try {
    realRunDir = fs.realpathSync(resolvedRunDir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }

  // Containment check using real (symlink-resolved) paths
  let realArtifactsBase;
  try {
    realArtifactsBase = fs.realpathSync(resolvedArtifactsBase);
  } catch {
    realArtifactsBase = resolvedArtifactsBase;
  }

  if (!realRunDir.startsWith(realArtifactsBase + path.sep) && realRunDir !== realArtifactsBase) {
    throw new Error('Run directory escaped artifacts directory');
  }

  if (!realPath.startsWith(realRunDir + path.sep)) {
    throw new Error('Artifact path escaped run directory');
  }

  const stat = fs.statSync(realPath);
  if (!stat.isFile()) {
    return null;
  }

  return realPath;
}
