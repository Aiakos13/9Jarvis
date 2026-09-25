const fs = require("fs");

const MEMORY_FILE = "./memory.json";

function loadMemory() {
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
}

function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), "utf-8");
}

function updateMemory(path, value) {
  const memory = loadMemory();

  const keys = path.split(".");
  let current = memory;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }

    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;

  saveMemory(memory);

  return memory;
}

function normalizeMemoryKey(category, key) {
  if (category === "preference") {
    const aliases = {
      programming_language: "programming_languages",
      favorite_programming_languages: "programming_languages",
      favorite_game: "favorite_games",
      favorite_music_type: "favorite_music",
      technology: "technologies",
    };

    return aliases[key] || key;
  }

  return key;
}

function saveDetectedMemory(category, key, value, multiple = false) {
  const memory = loadMemory();

  key = normalizeMemoryKey(category, key);

  if (category === "project") {
    if (!memory.project) {
      memory.project = {};
    }

    if (multiple) {
      if (!Array.isArray(memory.project[key])) {
        memory.project[key] = memory.project[key] ? [memory.project[key]] : [];
      }

      if (!memory.project[key].includes(value)) {
        memory.project[key].push(value);
      }
    } else {
      memory.project[key] = value;
    }

    saveMemory(memory);

    return memory;
  }

  if (!memory.user[category]) {
    memory.user[category] = {};
  }

  if (multiple) {
    if (!Array.isArray(memory.user[category][key])) {
      memory.user[category][key] = memory.user[category][key]
        ? [memory.user[category][key]]
        : [];
    }

    if (!memory.user[category][key].includes(value)) {
      memory.user[category][key].push(value);
    }
  } else {
    memory.user[category][key] = value;
  }

  saveMemory(memory);

  return memory;
}

function getMemoryContext() {
  const memory = loadMemory();

  return JSON.stringify(memory, null, 2);
}

function getMemoryValue(path) {
  const memory = loadMemory();

  const keys = path.split(".");
  let current = memory;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function getMemoryByKey(category, key) {
  const memory = loadMemory();

  if (category === "identity") {
    return memory.user?.[key];
  }

  if (category === "project") {
    return memory.project?.[key];
  }

  if (!memory.user?.[category]) {
    return undefined;
  }

  return memory.user[category][key];
}

function buildMemoryContext(requestedMemories) {
  const result = {};

  for (const memory of requestedMemories) {
    const value = getMemoryByKey(memory.category, memory.key);

    if (value !== undefined) {
      if (!result[memory.category]) {
        result[memory.category] = {};
      }

      result[memory.category][memory.key] = value;
    }
  }

  return JSON.stringify(result, null, 2);
}

module.exports = {
  loadMemory,
  saveMemory,
  updateMemory,
  saveDetectedMemory,
  getMemoryContext,
  getMemoryValue,
  getMemoryByKey,
  buildMemoryContext,
};
