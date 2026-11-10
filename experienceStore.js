const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const EXPERIENCE_FILE = path.join(DATA_DIR, "experiences.jsonl");

const MAX_STRING_LENGTH = 4000;

const SENSITIVE_KEY_PATTERN =
  /api.?key|access.?token|refresh.?token|token|password|passwd|secret|authorization|cookie|credential|private.?key|client.?secret|session.?id/i;

function sanitizeString(value) {
  return value
    .replace(/Bearer\s+[^\s"'`]+/gi, "Bearer [REDACTED]")
    .replace(/\bsk-[a-zA-Z0-9_-]{12,}\b/g, "[REDACTED]")
    .replace(/\bsk-or-v1-[a-zA-Z0-9]{12,}\b/g, "[REDACTED]")
    .replace(/\bgh[pousr]_[a-zA-Z0-9]{20,}\b/g, "[REDACTED]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED]")
    .replace(/\bAIza[0-9A-Za-z_-]{30,}\b/g, "[REDACTED]")
    .replace(/\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g, "[REDACTED]")
    .replace(/\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g, "[REDACTED]")
    .replace(/\bhttps?:\/\/[^\/\s:@]+:[^\/\s@]+@[^\/\s]+/gi, "[URL WITH CREDENTIALS REDACTED]")
    .replace(/\b(api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|passwd|client[_-]?secret|secret|authorization|cookie|credential|private[_-]?key|session[_-]?id)\s*[:=]\s*["']?([^\s"'\x60,;]+)/gi, "$1=[REDACTED]")
    .replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/gi, "[IMAGE OMITTED]")
    .slice(0, MAX_STRING_LENGTH);
}

function sanitizeValue(value, key = "") {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  const sanitized = {};

  for (const [childKey, childValue] of Object.entries(value)) {
    sanitized[childKey] = sanitizeValue(childValue, childKey);
  }

  return sanitized;
}

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.map((item) => ({
    step: item.step ?? null,
    tool: item.tool ?? null,
    input: sanitizeValue(item.input ?? null),
    success: Boolean(item.success),
    result: sanitizeValue(item.result ?? null),
  }));
}

function ensureTrailingNewline() {
  if (!fs.existsSync(EXPERIENCE_FILE)) {
    return;
  }

  const stats = fs.statSync(EXPERIENCE_FILE);

  if (stats.size === 0) {
    return;
  }

  const fd = fs.openSync(EXPERIENCE_FILE, "r");

  try {
    const lastByte = Buffer.alloc(1);

    fs.readSync(fd, lastByte, 0, 1, stats.size - 1);

    if (lastByte[0] !== 0x0a) {
      fs.appendFileSync(EXPERIENCE_FILE, "\n", "utf8");
    }
  } finally {
    fs.closeSync(fd);
  }
}

function saveExperience(experience) {
  if (!experience || typeof experience !== "object") {
    throw new TypeError("Experience must be an object.");
  }

  if (typeof experience.request !== "string" || !experience.request.trim()) {
    throw new TypeError("Experience request must be a non-empty string.");
  }

  ensureStorage();
  ensureTrailingNewline();

  const record = {
    id: crypto.randomUUID(),
    request: sanitizeString(experience.request.trim()),
    actions: normalizeHistory(experience.history),
    success: Boolean(experience.success),
    error: experience.error ? sanitizeString(String(experience.error)) : null,
    createdAt: new Date().toISOString(),
    durationMs:
      Number.isFinite(experience.durationMs) && experience.durationMs >= 0
        ? experience.durationMs
        : null,
  };

  fs.appendFileSync(EXPERIENCE_FILE, JSON.stringify(record) + "\n", "utf8");

  return record;
}

function readExperiences({ limit = 20 } = {}) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError("Limit must be a positive integer.");
  }

  if (!fs.existsSync(EXPERIENCE_FILE)) {
    return [];
  }

  const content = fs.readFileSync(EXPERIENCE_FILE, "utf8");
  const experiences = [];

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    try {
      const record = JSON.parse(line);

      if (record && typeof record === "object" && !Array.isArray(record)) {
        experiences.push(record);
      }
    } catch {
      // Ignore malformed or incomplete records.
    }
  }

  return experiences.reverse().slice(0, limit);
}

function getRecentExperiences(limit = 20) {
  return readExperiences({ limit });
}

function getExperienceCount() {
  return readExperiences({ limit: Number.MAX_SAFE_INTEGER }).length;
}

module.exports = {
  saveExperience,
  readExperiences,
  getRecentExperiences,
  getExperienceCount,
};
