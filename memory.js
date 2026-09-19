const fs = require("fs");

const MEMORY_FILE = "./memory.json";

function loadMemory() {
  return JSON.parse(
    fs.readFileSync(MEMORY_FILE, "utf-8")
  );
}

function saveMemory(memory) {
  fs.writeFileSync(
    MEMORY_FILE,
    JSON.stringify(memory, null, 2),
    "utf-8"
  );
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

module.exports = {
  loadMemory,
  saveMemory,
  updateMemory,
};