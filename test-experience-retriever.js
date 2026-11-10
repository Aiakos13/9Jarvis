"use strict";

const assert = require("assert");
const {
  normalizeText,
  getCharacterNgrams,
  retrieveFromExperiences,
} = require("./experienceRetriever");

let passed = 0;
let failed = 0;

function test(name, callback) {
  try {
    callback();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL  ${name}`);
    console.error(`      ${error.message}`);
  }
}

const experiences = [
  {
    id: "calc-success",
    request: "۲۳ ضربدر ۱۹ را با ابزار calculator محاسبه کن",
    success: true,
    actions: [{ tool: "calculator" }],
  },
  {
    id: "calc-failure",
    request: "۲۳ ضربدر ۱۹ را با ابزار calculator محاسبه کن",
    success: false,
    actions: [{ tool: "calculator" }],
  },
  {
    id: "notepad",
    request: "برنامه Notepad را باز کن",
    success: true,
    actions: [{ tool: "open_app" }],
  },
];

test("Persian and Arabic characters normalize correctly", () => {
  assert.strictEqual(normalizeText("ي ك ۱۲۳"), "ی ک 123");
});

test("Arabic and Persian digits normalize equally", () => {
  assert.strictEqual(normalizeText("۱۲۳۴۵"), normalizeText("١٢٣٤٥"));
});

test("ZWNJ and whitespace normalize correctly", () => {
  assert.strictEqual(
    normalizeText("باز\u200cکردن   برنامه"),
    "باز کردن برنامه",
  );
});

test("Character ngrams are generated", () => {
  const result = getCharacterNgrams("سلام");
  assert.ok(result instanceof Map);
  assert.ok(result.size > 0);
});

test("Relevant calculator experiences are retrieved", () => {
  const results = retrieveFromExperiences(
    "۲۳ ضربدر ۱۹ را با calculator محاسبه کن",
    experiences,
  );

  assert.ok(results.some((item) => item.id === "calc-success"));
  assert.ok(results.some((item) => item.id === "calc-failure"));
});

test("Successful experience ranks above failed experience", () => {
  const results = retrieveFromExperiences(
    "۲۳ ضربدر ۱۹ را با ابزار calculator محاسبه کن",
    experiences,
  );

  assert.strictEqual(results[0].id, "calc-success");
});

test("Unrelated experience is excluded with stricter threshold", () => {
  const results = retrieveFromExperiences(
    "۲۳ ضربدر ۱۹ را با ابزار calculator محاسبه کن",
    experiences,
    { minScore: 0.2 },
  );

  assert.ok(!results.some((item) => item.id === "notepad"));
});
test("Maximum result count is respected", () => {
  const results = retrieveFromExperiences(
    "۲۳ ضربدر ۱۹ را با ابزار calculator محاسبه کن",
    experiences,
    { maxResults: 1 },
  );

  assert.strictEqual(results.length, 1);
});

test("Empty input returns no results", () => {
  assert.deepStrictEqual(retrieveFromExperiences("   ", experiences), []);
});

test("Invalid experience list returns no results", () => {
  assert.deepStrictEqual(retrieveFromExperiences("calculator", null), []);
});

test("Invalid maxResults is rejected", () => {
  assert.throws(
    () =>
      retrieveFromExperiences("calculator", experiences, {
        maxResults: 0,
      }),
    /maxResults/,
  );
});

test("Invalid minScore is rejected", () => {
  assert.throws(
    () =>
      retrieveFromExperiences("calculator", experiences, {
        minScore: 2,
      }),
    /minScore/,
  );
});

test("Returned records expose only controlled workflow data", () => {
  const results = retrieveFromExperiences(
    "۲۳ ضربدر ۱۹ را با ابزار calculator محاسبه کن",
    experiences,
  );

  for (const item of results) {
    assert.deepStrictEqual(
      Object.keys(item).sort(),
      [
        "id",
        "request",
        "success",
        "tools",
        "error",
        "workflow",
        "score",
        "lexicalScore",
      ].sort(),
    );

    assert.ok(!("actions" in item));
    assert.ok(Array.isArray(item.workflow));

    if (!item.success) {
      assert.deepStrictEqual(item.workflow, []);
    }

    for (const action of item.workflow) {
      assert.strictEqual(typeof action.step, "number");
      assert.ok(action.step > 0);
      assert.ok(action.tool === null || typeof action.tool === "string");
      assert.strictEqual(typeof action.success, "boolean");
      assert.ok("input" in action);
      assert.ok("result" in action);
    }
  }
});
test("Sensitive workflow keys are redacted recursively", () => {
  const results = retrieveFromExperiences("آزمایش امنیتی workflow", [
    {
      id: "security-keys",
      request: "آزمایش امنیتی workflow",
      success: true,
      actions: [
        {
          tool: "test",
          input: {
            apiKey: "SECRET_API_KEY",
            normal: "safe",
            nested: {
              password: "SECRET_PASSWORD",
              value: "safe",
            },
          },
          result: null,
        },
      ],
    },
  ]);

  const input = results[0].workflow[0].input;

  assert.strictEqual(input.apiKey, "[REDACTED]");
  assert.strictEqual(input.normal, "safe");
  assert.strictEqual(input.nested.password, "[REDACTED]");
  assert.strictEqual(input.nested.value, "safe");
});

test("Workflow strings are length-limited", () => {
  const results = retrieveFromExperiences("آزمایش محدودیت رشته", [
    {
      id: "string-limit",
      request: "آزمایش محدودیت رشته",
      success: true,
      actions: [
        {
          tool: "test",
          input: "A".repeat(1500),
        },
      ],
    },
  ]);

  assert.strictEqual(results[0].workflow[0].input.length, 1200);
});

test("Workflow arrays and object keys are limited", () => {
  const largeArray = Array.from({ length: 25 }, (_, i) => i);

  const largeObject = Object.fromEntries(
    Array.from({ length: 35 }, (_, i) => [`key${i}`, i]),
  );

  const results = retrieveFromExperiences("آزمایش محدودیت ساختار", [
    {
      id: "structure-limit",
      request: "آزمایش محدودیت ساختار",
      success: true,
      actions: [
        {
          tool: "test",
          input: {
            items: largeArray,
            data: largeObject,
          },
        },
      ],
    },
  ]);

  const input = results[0].workflow[0].input;

  assert.strictEqual(input.items.length, 20);
  assert.strictEqual(Object.keys(input.data).length, 30);
});

test("Workflow object depth is limited", () => {
  const results = retrieveFromExperiences("آزمایش محدودیت عمق", [
    {
      id: "depth-limit",
      request: "آزمایش محدودیت عمق",
      success: true,
      actions: [
        {
          tool: "test",
          input: {
            a: {
              b: {
                c: {
                  d: {
                    e: "hidden",
                  },
                },
              },
            },
          },
        },
      ],
    },
  ]);

  assert.strictEqual(results[0].workflow[0].input.a.b.c.d, "[MAX_DEPTH]");
});
console.log(`\nTotal: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exitCode = 1;
}
