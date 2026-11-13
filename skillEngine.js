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

// Persian keywords mapped to English concepts used by Skills.
const PERSIAN_TO_ENGLISH = {
  // General and programming
  متن: "text",
  کدنویسی: "programming",
  کد‌نویسی: "programming",
  توسعه: "programming",
  توسعه‌دهنده: "programming",
  ترجمه: "translator",
  مترجم: "translator",
  کد: "code",
  برنامه: "programming",
  برنامه‌نویسی: "programming",
  "برنامه نویسی": "programming",
  جاوااسکریپت: "javascript",
  جاوا: "java",
  پایتون: "python",
  باگ: "debugging",
  اشکال: "debugging",
  دیباگ: "debugging",
  رفع: "fix",
  اصلاح: "fix",
  اصلاح‌شده: "fix",
  بازبینی: "review",
  بازنویسی: "refactoring",
  تست: "testing",
  آزمون: "testing",
  خطا: "error",
  بررسی: "review",
  توضیح: "explain",
  منطقی: "logic",
  عملکرد: "behavior",
  تابع: "function",
  اشکال‌زدایی: "debugging",

  // System troubleshooting
  مشکل: "troubleshooting",
  عیب‌یابی: "troubleshooting",
  ویندوز: "windows",
  پاورشل: "powershell",
  سخت‌افزار: "hardware",
  درایور: "driver",
  شبکه: "network",
  سرور: "server",
  استقرار: "deployment",
  داکر: "docker",
  کانتینر: "container",
  پایپ‌لاین: "pipeline",
  مانیتورینگ: "monitoring",

  // Database
  پایگاه: "database",
  دیتابیس: "database",
  داده: "data",
  اس‌کیوال: "sql",
  کوئری: "query",
  جدول: "table",
  شاخص: "index",

  // Software architecture
  معماری: "architecture",
  طراحی: "design",
  ساختار: "structure",
  سیستم: "system",
  مقیاس‌پذیری: "scalability",

  // Security
  امنیت: "security",
  آسیب‌پذیری: "vulnerability",
  نفوذ: "attack",
  احراز: "authentication",
  مجوز: "authorization",
  رمزنگاری: "encryption",

  // Automation and DevOps
  خودکارسازی: "automation",
  خودکار: "automation",
  گردش‌کار: "workflow",
  وب‌هوک: "webhook",
  زمان‌بندی: "scheduling",
  شرط: "conditional",
  یکپارچه‌سازی: "integration",

  // Email
  ایمیل: "email",
  جیمیل: "gmail",
  صندوق: "inbox",
  نامه: "email",
  ارسال: "send",
  پیش‌نویس: "draft",

  // Files
  فایل: "file",
  پوشه: "folder",
  جابجایی: "move",
  انتقال: "move",
  تغییرنام: "rename",
  کپی: "copy",
  حذف: "delete",
  مرتب‌سازی: "organize",

  // Knowledge management
  یادداشت: "notes",
  سند: "documents",
  اسناد: "documents",
  مستندات: "documents",
  دانش: "knowledge",
  سابقه: "history",
  ترجیحات: "preferences",
  ترجیح: "preferences",
  تصمیمات: "decisions",
  قبلی: "previous",
  شخصی: "personal",
  حافظه: "memory",

  // Learning
  آموزش: "teach",
  یادگیری: "learning",
  تمرین: "exercise",
  یادبگیر: "learn",
  درس: "lesson",

  // Meetings
  جلسه: "meeting",
  صورتجلسه: "minutes",
  تصمیم: "decision",
  وظیفه: "action",
  مهلت: "deadline",

  // Agents
  عامل: "agent",
  ایجنت: "agent",
  چندعاملی: "multi-agent",
  هماهنگی: "coordinate",
  تقسیم: "delegate",
  موازی: "parallel",
  عامل‌ها: "agents",
  ایجنت‌ها: "agents",

  // Translation and languages
  زبان: "language",
  ترکی: "turkish",
  روسی: "russian",
  فارسی: "persian",
  انگلیسی: "english",
  آلمانی: "german",
  آذربایجانی: "azerbaijani",

  // Research
  تحقیق: "research",
  پژوهش: "research",
  جستجو: "search",
  منبع: "source",
  منابع: "sources",
  معتبر: "reliable",
  مستند: "evidence",
  گزارش: "report",
  اعتبارسنجی: "validate",
  راستی‌آزمایی: "verify",

  // Browser
  مرورگر: "browser",
  وبسایت: "website",
  وب‌سایت: "website",
  صفحه: "page",
  استخراج: "extract",
  پیمایش: "navigate",

  // Computer vision
  تصویر: "image",
  عکس: "image",
  اسکرین‌شات: "screenshot",
  رابط: "interface",
  نمودار: "chart",
  بصری: "visual",
  اشیا: "objects",
  شیء: "object",
};

const PERSIAN_STOP_WORDS = new Set([
  "این",
  "آن",
  "را",
  "از",
  "به",
  "با",
  "در",
  "برای",
  "که",
  "و",
  "یا",
  "اگر",
  "اما",
  "هم",
  "یک",
  "من",
  "تو",
  "شما",
  "ما",
  "او",
  "آنها",
  "اینها",
  "کن",
  "کنید",
  "کند",
  "کرد",
  "کردن",
  "شود",
  "شده",
  "است",
  "هست",
  "بود",
  "باشد",
  "می",
  "میخواهم",
  "می‌خواهم",
  "لطفا",
  "لطفاً",
  "چطور",
  "چگونه",
  "چی",
  "چه",
  "چرا",
  "پیدا",
  "علت",
  "کامل",
  "نسخه",
  "ارائه",
  "مورد",
  "مربوط",
  "مختلف",
  "مناسب",
  "زیر",
  "نظر",
  "بده",
  "بنویس",
  "بنویسید",
  "بگو",
  "بگویید",
  "لطفا",
]);

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
  "a",
  "an",
  "the",
  "what",
  "is",
  "by",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "have",
  "has",
  "are",
  "was",
  "were",
  "you",
  "your",
  "about",
  "into",
  "using",
  "use",
  "tool",
  "please",
  "can",
  "could",
  "would",
  "should",
  "want",
  "need",
  "write",
  "make",
  "create",
  "get",
  "show",
]);

const TOKEN_SYNONYMS = {
  debug: "debugging",
  bug: "debugging",
  bugs: "debugging",
  debugging: "debugging",
  troubleshoot: "troubleshooting",
  troubleshooting: "troubleshooting",
  fix: "fix",
  repair: "fix",
  explain: "explain",
  explanation: "explain",
  review: "review",
  inspect: "review",
  javascript: "javascript",
  js: "javascript",
  python: "python",
  programming: "programming",
  coding: "programming",
  developer: "programming",
};

const CODE_PATTERNS = [
  /\bfunction\s+[$\w]+\s*\(/u,
  /\b(?:const|let|var)\s+[$\w]+\s*=/u,
  /\bclass\s+[$\w]+/u,
  /\bconsole\.(?:log|error|warn)\s*\(/u,
  /=>/u,
  /\breturn\s+[^\s;]+/u,
];

function hasCodeSyntax(value) {
  return CODE_PATTERNS.some((pattern) => pattern.test(value));
}

function extractIntentText(value) {
  let text = normalizeText(value);

  // Remove fenced and inline code blocks.
  text = text.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");

  // Find the beginning of an unformatted code snippet.
  let codeStart = -1;

  for (const pattern of CODE_PATTERNS) {
    const match = pattern.exec(text);

    if (match && (codeStart === -1 || match.index < codeStart)) {
      codeStart = match.index;
    }
  }

  if (codeStart !== -1) {
    text = text.slice(0, codeStart);
  }

  // Treat Persian half-space as part of a word.
  text = text.replace(/برنامه\s+نویسی/g, "برنامه‌نویسی");

  return text;
}

function tokenize(value, options = {}) {
  const originalText = normalizeText(value);
  const text = options.intentOnly
    ? extractIntentText(originalText)
    : originalText;

  const tokens = text.match(/[\p{L}\p{N}][\p{L}\p{N}\u200c_-]*/gu) || [];

  const result = [];

  for (const rawToken of tokens) {
    const token = rawToken.trim();

    if (
      !token ||
      /^\p{N}+$/u.test(token) ||
      STOP_WORDS.has(token) ||
      PERSIAN_STOP_WORDS.has(token)
    ) {
      continue;
    }

    const mapped = PERSIAN_TO_ENGLISH[token] || TOKEN_SYNONYMS[token] || token;

    if (mapped) {
      result.push(mapped);
    }
  }

  // If the input contains only code, retain a programming intent.
  // if (
  //   options.intentOnly &&
  //   result.length === 0 &&
  //   hasCodeSyntax(originalText)
  // ) {
  //   return ["code", "programming"];
  // }

  return [...new Set(result)];
}

function parseFrontmatter(content) {
  if (typeof content !== "string" || !content.startsWith("---\n")) {
    throw new Error("Missing YAML frontmatter.");
  }

  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error("Unclosed YAML frontmatter.");
  }

  const header = content.slice(4, end);
  const body = content
    .slice(end + 4)
    .replace(/^\r?\n/, "")
    .trim();

  const metadata = Object.create(null);

  for (const line of header.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) {
      continue;
    }

    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*?)\s*$/);

    if (!match) {
      throw new Error("Invalid frontmatter line.");
    }

    const key = match[1];
    let value = match[2];

    if (Object.prototype.hasOwnProperty.call(metadata, key)) {
      throw new Error("Duplicate frontmatter key.");
    }

    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else if (
      value.startsWith("'") &&
      value.endsWith("'") &&
      value.length >= 2
    ) {
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

  return {
    name,
    description: description.trim(),
    body,
  };
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
      return {
        skills,
        diagnostics: ["Invalid skills directory."],
      };
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      return { skills, diagnostics };
    }

    return {
      skills,
      diagnostics: ["Skills directory unavailable."],
    };
  }

  let entries;

  try {
    entries = fs.readdirSync(skillsDir, {
      withFileTypes: true,
    });
  } catch {
    return {
      skills,
      diagnostics: ["Cannot read skills directory."],
    };
  }

  for (const entry of entries) {
    if (skills.length >= LIMITS.maxSkills) {
      break;
    }

    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      continue;
    }

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

  return {
    skills,
    diagnostics,
  };
}

function findRelevantSkills(userInput, options = {}) {
  if (typeof userInput !== "string" || !userInput.trim()) {
    return [];
  }

  const loaded = loadSkills(options);
  const queryTokens = [...new Set(tokenize(userInput, { intentOnly: true }))];

  if (!queryTokens.length) {
    return [];
  }

  const maxResults = Number.isInteger(options.maxResults)
    ? Math.max(0, Math.min(options.maxResults, LIMITS.maxResults))
    : LIMITS.maxResults;

  const minScore =
    typeof options.minScore === "number" ? options.minScore : 0.5;

  return loaded.skills
    .map((skill) => {
      const nameTokens = new Set(tokenize(skill.name.replace(/-/g, " ")));

      const descriptionTokens = new Set(tokenize(skill.description));

      const bodyTokens = new Set(tokenize(skill.body));

      const nameMatches = queryTokens.filter((token) =>
        nameTokens.has(token),
      ).length;

      const descriptionMatches = queryTokens.filter((token) =>
        descriptionTokens.has(token),
      ).length;

      const bodyMatches = queryTokens.filter((token) =>
        bodyTokens.has(token),
      ).length;

      const eligible =
        nameMatches >= 1 ||
        descriptionMatches >= 2 ||
        (bodyMatches >= 3 && bodyMatches / queryTokens.length >= 0.5);

      const rawScore =
        nameMatches * 3 + descriptionMatches * 2 + bodyMatches * 0.5;

      return {
        ...skill,
        score: eligible
          ? Number((rawScore / Math.sqrt(queryTokens.length)).toFixed(4))
          : 0,
      };
    })
    .filter((skill) => skill.score >= minScore)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, maxResults);
}
module.exports = {
  loadSkills,
  findRelevantSkills,
  parseFrontmatter,
  normalizeText,
  tokenize,
};
