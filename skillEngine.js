"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_SKILLS_DIR = path.join(__dirname, "skills");

const LIMITS = {
  maxSkills: 50,
  maxFileBytes: 64 * 1024,
  maxBodyChars: 16 * 1024,
  maxNameChars: 64,
  maxDescriptionChars: 500,
  maxResults: 3,
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .toLowerCase();
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that",
  "have", "has", "are", "was", "were", "you", "your",
  "about", "into", "using", "use", "tool", "please",
  "can", "could", "would", "should", "want", "need",
  "write", "make", "create", "get", "show"
]);

function tokenize(value) {
  const tokens =
    normalizeText(value).match(/[\p{L}\p{N}][\p{L}\p{N}_-]{1,}/gu) || [];
  return tokens.filter((token) => !STOP_WORDS.has(token));
}

function parseFrontmatter(content) {
  if (typeof content !== "string" || !content.startsWith("---\n")) {
    throw new Error("Missing YAML frontmatter.");
  }

  const end = content.indexOf("\n---", 4);
  if (end === -1) throw new Error("Unclosed YAML frontmatter.");

  const header = content.slice(4, end);
  const body = content.slice(end + 4).replace(/^\r?\n/, "").trim();
  const metadata = Object.create(null);

  for (const line of header.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;

    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*?)\s*$/);
    if (!match) throw new Error("Invalid frontmatter line.");

    const key = match[1];
    let value = match[2];

    if (Object.prototype.hasOwnProperty.call(metadata, key)) {
      throw new Error("Duplicate frontmatter key.");
    }

    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1).replace(/''/g, "'");
    }

    if (/[{}[\]|>&*!`]/.test(value)) {
      throw new Error("Unsupported YAML value.");
    }

    metadata[key] = value;
  }

  const { name, description } = metadata;

  if (
    typeof name !== "string" ||
    name.length < 1 ||
    name.length > LIMITS.maxNameChars ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)
  ) {
    throw new Error("Invalid Skill name.");
  }

  if (
    typeof description !== "string" ||
    !description.trim() ||
    description.length > LIMITS.maxDescriptionChars
  ) {
    throw new Error("Invalid Skill description.");
  }

  if (!body || body.length > LIMITS.maxBodyChars) {
    throw new Error("Invalid Skill body size.");
  }

  return { name, description: description.trim(), body };
}

function isInside(parent, target) {
  const relative = path.relative(parent, target);
  return (
    relative !== "" &&
    !relative.startsWith(".." + path.sep) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  );
}

function loadSkills(options = {}) {
  const skillsDir = path.resolve(options.skillsDir || DEFAULT_SKILLS_DIR);
  const skills = [];
  const diagnostics = [];

  try {
    const rootStat = fs.lstatSync(skillsDir);
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
      return { skills, diagnostics: ["Invalid skills directory."] };
    }
  } catch (error) {
    if (error.code === "ENOENT") return { skills, diagnostics };
    return { skills, diagnostics: ["Skills directory unavailable."] };
  }

  let entries;
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return { skills, diagnostics: ["Cannot read skills directory."] };
  }

  for (const entry of entries) {
    if (skills.length >= LIMITS.maxSkills) break;
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;

    const folderPath = path.join(skillsDir, entry.name);
    const skillPath = path.join(folderPath, "SKILL.md");

    try {
      const folderStat = fs.lstatSync(folderPath);
      const fileStat = fs.lstatSync(skillPath);

      if (
        !folderStat.isDirectory() ||
        folderStat.isSymbolicLink() ||
        !fileStat.isFile() ||
        fileStat.isSymbolicLink() ||
        fileStat.size > LIMITS.maxFileBytes
      ) {
        diagnostics.push(`${entry.name}: rejected file or directory.`);
        continue;
      }

      const realRoot = fs.realpathSync(skillsDir);
      const realFolder = fs.realpathSync(folderPath);
      const realFile = fs.realpathSync(skillPath);

      if (!isInside(realRoot, realFolder) || !isInside(realFolder, realFile)) {
        diagnostics.push(`${entry.name}: path outside Skills directory.`);
        continue;
      }

      const parsed = parseFrontmatter(fs.readFileSync(realFile, "utf8"));

      if (parsed.name !== entry.name) {
        diagnostics.push(`${entry.name}: folder and Skill name mismatch.`);
        continue;
      }

      skills.push({
        id: parsed.name,
        name: parsed.name,
        description: parsed.description,
        body: parsed.body,
      });
    } catch (error) {
      diagnostics.push(`${entry.name}: ${error.message || "invalid Skill."}`);
    }
  }

  return { skills, diagnostics };
}

function scoreSkill(queryTokens, skill) {
  if (!queryTokens.length) return 0;

  const nameTokens = new Set(tokenize(skill.name.replace(/-/g, " ")));
  const descriptionTokens = new Set(tokenize(skill.description));
  const bodyTokens = new Set(tokenize(skill.body));

  let score = 0;

  for (const token of new Set(queryTokens)) {
    if (nameTokens.has(token)) score += 3;
    if (descriptionTokens.has(token)) score += 2;
    if (bodyTokens.has(token)) score += 0.5;
  }

  return score / Math.max(1, new Set(queryTokens).size);
}

function findRelevantSkills(userInput, options = {}) {
  if (typeof userInput !== "string" || !userInput.trim()) return [];

  const loaded = loadSkills(options);
  const queryTokens = tokenize(userInput);

  if (!queryTokens.length) return [];

  const maxResults = Number.isInteger(options.maxResults)
    ? Math.max(0, Math.min(options.maxResults, LIMITS.maxResults))
    : LIMITS.maxResults;

  const minScore = typeof options.minScore === "number" ? options.minScore : 0.5;

  return loaded.skills
    .map((skill) => ({
      ...skill,
      score: Number(scoreSkill(queryTokens, skill).toFixed(4)),
    }))
    .filter((skill) => skill.score >= minScore)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, maxResults);
}

module.exports = {
  loadSkills,
  findRelevantSkills,
  parseFrontmatter,
  normalizeText,
};
