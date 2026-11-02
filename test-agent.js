const assert = require("node:assert/strict");

const { parseAgentAction, normalizeNativeToolCall } = require("./agent");

// ========================================
// Parser Tests
// ========================================

let parserPassed = 0;
let parserFailed = 0;

function test(name, input, expectedValid, expectedData = null) {
  try {
    const result = parseAgentAction(input);

    assert.equal(result.valid, expectedValid);

    if (expectedValid) {
      assert.deepEqual(result.data, expectedData);
    }

    console.log(`PASS: ${name}`);
    parserPassed++;
  } catch (error) {
    console.log(`FAIL: ${name} - ${error.message}`);
    parserFailed++;
  }
}

console.log("--- Parser Tests ---");

test("Finish action", '{"action":"finish"}', true, { action: "finish" });

test(
  "Calculator action",
  '{"action":"tool","tool":"calculator","input":"25 * 4"}',
  true,
  {
    action: "tool",
    tool: "calculator",
    input: "25 * 4",
  },
);

test("Shorthand tool action", '{"action":"type_text","input":"Hello"}', true, {
  action: "tool",
  tool: "type_text",
  input: "Hello",
});

test(
  "Unknown tool",
  '{"action":"tool","tool":"unknown_tool","input":""}',
  false,
);

test("Invalid JSON", '{"action":', false);

test("Empty response", "", false);

test("Markdown JSON", '```json\n{"action":"finish"}\n```', true, {
  action: "finish",
});

test(
  "Harmony calculator",
  ' to=calculator<|message|>{"expression":"12 * 5"}<|call|>',
  true,
  {
    action: "tool",
    tool: "calculator",
    input: "12 * 5",
  },
);

// ========================================
// Native Tool Call Tests
// ========================================

let nativePassed = 0;
let nativeFailed = 0;

function nativeTest(name, fn, shouldFail = false) {
  try {
    const result = fn();

    if (shouldFail) {
      console.log(`FAIL: ${name} (expected rejection)`);
      nativeFailed++;
      return;
    }

    console.log(`PASS: ${name}`);
    nativePassed++;
  } catch (error) {
    if (shouldFail) {
      console.log(`PASS: ${name} (correctly rejected)`);
      nativePassed++;
    } else {
      console.log(`FAIL: ${name} - ${error.message}`);
      nativeFailed++;
    }
  }
}

function checkNative(testName, functionName, args, expected) {
  nativeTest(testName, () => {
    const result = JSON.parse(
      normalizeNativeToolCall(functionName, JSON.stringify(args)),
    );

    assert.deepEqual(result, {
      action: "tool",
      tool: functionName,
      input: expected,
    });
  });
}

console.log("\n--- Native Tool Call Tests ---");

// Valid inputs

checkNative("Calculator", "calculator", { expression: "12 * 5" }, "12 * 5");

checkNative("Weather", "weather", { city: "Berlin" }, "Berlin");

checkNative(
  "Currency",
  "currency",
  { from: "EUR", to: "USD" },
  { from: "EUR", to: "USD" },
);

checkNative(
  "Mouse click",
  "mouse_click",
  { x: 500, y: 300 },
  { x: 500, y: 300 },
);

checkNative("Scroll", "scroll", { amount: -5 }, -5);

checkNative("Screenshot", "screenshot", {}, "");

// Invalid inputs

nativeTest(
  "Invalid JSON arguments",
  () => normalizeNativeToolCall("calculator", "{invalid"),
  true,
);

nativeTest(
  "Unknown tool",
  () => normalizeNativeToolCall("unknown_tool", "{}"),
  true,
);

nativeTest(
  "Invalid mouse coordinates",
  () => normalizeNativeToolCall("mouse_click", '{"x":"bad","y":300}'),
  true,
);

nativeTest(
  "Invalid currency arguments",
  () => normalizeNativeToolCall("currency", '{"from":"EUR"}'),
  true,
);

nativeTest(
  "Invalid mouse input override",
  () => normalizeNativeToolCall("mouse_click", '{"input":"bad"}'),
  true,
);

// ========================================
// Final Results
// ========================================

console.log("\n========== TEST SUMMARY ==========");

console.log(`Parser: ${parserPassed} passed, ${parserFailed} failed`);

console.log(`Native: ${nativePassed} passed, ${nativeFailed} failed`);

const totalPassed = parserPassed + nativePassed;
const totalFailed = parserFailed + nativeFailed;

console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);

if (totalFailed === 0) {
  console.log("\nAll tests passed.");
} else {
  console.log("\nSome tests need attention.");
}
