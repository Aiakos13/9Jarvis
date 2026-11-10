const { readExperiences } = require("./experienceStore");

const DEFAULT_HISTORY_LIMIT = 200;
const DEFAULT_MAX_RESULTS = 3;
const DEFAULT_MIN_SCORE = 0.12;
const MAX_REQUEST_LENGTH = 500;

const MAX_WORKFLOW_STRING_LENGTH = 1200;
const MAX_WORKFLOW_ARRAY_LENGTH = 20;
const MAX_WORKFLOW_OBJECT_KEYS = 30;
const MAX_WORKFLOW_DEPTH = 4;

const SENSITIVE_WORKFLOW_KEY_PATTERN =
  /api.?key|access.?token|refresh.?token|token|password|passwd|secret|authorization|cookie|credential|private.?key|client.?secret|session.?id/i;
function normalizeText(value) {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCharacterNgrams(value, size = 3) {
  const text = `  ${normalizeText(value)}  `;
  const ngrams = new Map();

  if (!text.trim()) return ngrams;

  for (let i = 0; i <= text.length - size; i++) {
    const gram = text.slice(i, i + size);
    ngrams.set(gram, (ngrams.get(gram) || 0) + 1);
  }

  return ngrams;
}

function buildIdf(ngramDocuments) {
  const documentFrequency = new Map();

  for (const document of ngramDocuments) {
    for (const gram of document.keys()) {
      documentFrequency.set(gram, (documentFrequency.get(gram) || 0) + 1);
    }
  }

  const totalDocuments = ngramDocuments.length;
  const idf = new Map();

  for (const [gram, frequency] of documentFrequency) {
    idf.set(gram, Math.log(1 + totalDocuments / (1 + frequency)) + 1);
  }

  return idf;
}

function buildVector(ngrams, idf) {
  const vector = new Map();

  for (const [gram, count] of ngrams) {
    const weight = idf.get(gram) || 1;
    vector.set(gram, count * weight);
  }

  return vector;
}

function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA.size || !vectorB.size) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const value of vectorA.values()) {
    magnitudeA += value * value;
  }

  for (const value of vectorB.values()) {
    magnitudeB += value * value;
  }

  for (const [gram, value] of vectorA) {
    dotProduct += value * (vectorB.get(gram) || 0);
  }

  if (!magnitudeA || !magnitudeB) return 0;

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function extractTools(actions) {
  if (!Array.isArray(actions)) return new Set();

  return new Set(
    actions
      .map((action) => {
        if (!action || typeof action !== "object") return null;

        return typeof action.tool === "string"
          ? action.tool.trim().toLowerCase()
          : null;
      })
      .filter(Boolean),
  );
}

function toolSimilarity(toolsA, toolsB) {
  if (!toolsA.size || !toolsB.size) return 0;

  let intersection = 0;

  for (const tool of toolsA) {
    if (toolsB.has(tool)) intersection++;
  }

  const union = new Set([...toolsA, ...toolsB]).size;

  return union ? intersection / union : 0;
}
function limitWorkflowValue(value, depth = 0) {
  if (value === null || typeof value !== "object") {
    if (typeof value === "string") {
      return value.slice(0, MAX_WORKFLOW_STRING_LENGTH);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    return null;
  }

  if (depth >= MAX_WORKFLOW_DEPTH) {
    return "[MAX_DEPTH]";
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_WORKFLOW_ARRAY_LENGTH)
      .map((item) => limitWorkflowValue(item, depth + 1));
  }

  const limited = {};

  for (const [key, childValue] of Object.entries(value).slice(
    0,
    MAX_WORKFLOW_OBJECT_KEYS,
  )) {
    if (SENSITIVE_WORKFLOW_KEY_PATTERN.test(key)) {
      limited[key] = "[REDACTED]";
      continue;
    }

    limited[key] = limitWorkflowValue(childValue, depth + 1);
  }

  return limited;
}
function retrieveFromExperiences(userInput, experiences, options = {}) {
  const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
  const minScore = options.minScore ?? DEFAULT_MIN_SCORE;

  if (typeof userInput !== "string" || !userInput.trim()) {
    return [];
  }

  if (!Array.isArray(experiences) || experiences.length === 0) {
    return [];
  }

  if (!Number.isInteger(maxResults) || maxResults < 1) {
    throw new Error("maxResults must be a positive integer.");
  }

  if (
    typeof minScore !== "number" ||
    !Number.isFinite(minScore) ||
    minScore < 0 ||
    minScore > 1
  ) {
    throw new Error("minScore must be between 0 and 1.");
  }

  const validExperiences = experiences.filter(
    (experience) =>
      experience &&
      typeof experience === "object" &&
      typeof experience.request === "string" &&
      experience.request.trim(),
  );

  if (validExperiences.length === 0) return [];

  const queryNgrams = getCharacterNgrams(userInput);

  const documentNgrams = validExperiences.map((experience) =>
    getCharacterNgrams(experience.request),
  );

  const idf = buildIdf([queryNgrams, ...documentNgrams]);
  const queryVector = buildVector(queryNgrams, idf);

  const queryTools = extractTools(options.requestedTools);

  const results = validExperiences.map((experience, index) => {
    const documentVector = buildVector(documentNgrams[index], idf);
    const lexicalScore = cosineSimilarity(queryVector, documentVector);

    const experienceTools = extractTools(experience.actions);
    const toolsScore = toolSimilarity(queryTools, experienceTools);

    const successBonus = experience.success === true ? 0.03 : 0;

    const score = lexicalScore * 0.95 + toolsScore * 0.02 + successBonus;

    return {
      id: typeof experience.id === "string" ? experience.id : null,
      request: experience.request.slice(0, MAX_REQUEST_LENGTH),
      success: experience.success === true,
      tools: [...experienceTools],

      error:
        experience.success === true
          ? null
          : typeof experience.error === "string"
            ? experience.error.slice(0, MAX_WORKFLOW_STRING_LENGTH)
            : null,

      workflow:
        experience.success === true && Array.isArray(experience.actions)
          ? experience.actions
              .filter(
                (action) =>
                  action &&
                  typeof action === "object" &&
                  !Array.isArray(action),
              )
              .slice(0, MAX_WORKFLOW_ARRAY_LENGTH)
              .map((action, index) => ({
                step:
                  Number.isInteger(action.step) && action.step > 0
                    ? action.step
                    : index + 1,

                tool:
                  typeof action.tool === "string"
                    ? action.tool.slice(0, 100)
                    : null,

                input: limitWorkflowValue(action.input),

                success: action.success === true,

                result: limitWorkflowValue(action.result),
              }))
          : [],

      score: Number(Math.min(score, 1).toFixed(4)),
      lexicalScore: Number(lexicalScore.toFixed(4)),
    };
  });

  return results
    .filter((result) => result.lexicalScore >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

function findRelevantExperiences(userInput, options = {}) {
  const historyLimit = options.historyLimit ?? DEFAULT_HISTORY_LIMIT;

  if (!Number.isInteger(historyLimit) || historyLimit < 1) {
    throw new Error("historyLimit must be a positive integer.");
  }

  const experiences = readExperiences({ limit: historyLimit });

  return retrieveFromExperiences(userInput, experiences, options);
}

module.exports = {
  normalizeText,
  getCharacterNgrams,
  retrieveFromExperiences,
  findRelevantExperiences,
};
