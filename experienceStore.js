const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const EXPERIENCE_FILE = path.join(DATA_DIR, "experiences.jsonl");

const MAX_STRING_LENGTH = 4000;

const SENSITIVE_KEY_PATTERN =
  /api.?key|access.?token|refresh.?token|password|passwd|secret|authorization|cookie|credential|private.?key/i;

function sanitizeString(value) {
  return value
    .replace(/Bearer\s+[^\s"'`]+/gi, "Bearer [REDACTED]")
    .replace(/\bsk-[a-zA-Z0-9_-]{12,}\b/g, "[REDACTED]")
    .replace(/\bsk-or-v1-[a-zA-Z0-9]{12,}\b/g, "[REDACTED]")
    .replace(/\bgh[pousr]_[a-zA-Z0-9]{20,}\b/g, "[REDACTED]")
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

function saveExperience(experience) {
  if (!experience || typeof experience !== "object") {
    throw new TypeError("Experience must be an object.");
  }

  if (
    typeof experience.request !== "string" ||
    !experience.request.trim()
  ) {
    throw new TypeError("Experience request must be a non-empty string.");
  }

  ensureStorage();

  const record = {
    id: crypto.randomUUID(),
    request: sanitizeString(experience.request.trim()),
    actions: normalizeHistory(experience.history),
    success: Boolean(experience.success),
    error: experience.error
      ? sanitizeString(String(experience.error))
      : null,
    createdAt: new Date().toISOString(),
    durationMs:
      Number.isFinite(experience.durationMs) &&
      experience.durationMs >= 0
        ? experience.durationMs
        : null,
  };

  fs.appendFileSync(
    EXPERIENCE_FILE,
    JSON.stringify(record) + "\n",
    "utf8",
  );

  return record;
}

function getRecentExperiences(limit = 20) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError("Limit must be a positive integer.");
  }

  if (!fs.existsSync(EXPERIENCE_FILE)) {
    return [];
  }

  const content = fs.readFileSync(EXPERIENCE_FILE, "utf8");

  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .reverse()
    .slice(0, limit)
    .map((line) => JSON.parse(line));
}

function getExperienceCount() {
  if (!fs.existsSync(EXPERIENCE_FILE)) {
    return 0;
  }

  const content = fs.readFileSync(EXPERIENCE_FILE, "utf8");

  return content.split(/\r?\n/).filter(Boolean).length;
}

module.exports = {
  saveExperience,
  getRecentExperiences,
  getExperienceCount,
};