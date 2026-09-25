const { updateMemory } = require("./memory");

updateMemory(
  "user.preference.programming_languages",
  ["JavaScript", "Python"]
);

console.log("Programming languages restored.");
