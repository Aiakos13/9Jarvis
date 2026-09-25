function calculator(expression) {
  try {
    if (typeof expression !== "string") {
      return {
        success: false,
        error: "Invalid expression",
      };
    }

    const cleanExpression = expression.trim();

    if (!cleanExpression) {
      return {
        success: false,
        error: "Invalid expression",
      };
    }

    if (!/^[0-9+\-*/%().\s]+$/.test(cleanExpression)) {
      return {
        success: false,
        error: "Invalid expression",
      };
    }

    const result = Function(`"use strict"; return (${cleanExpression})`)();

    if (typeof result !== "number" || !Number.isFinite(result)) {
      return {
        success: false,
        error: "Invalid calculation",
      };
    }

    return {
      success: true,
      result,
    };
  } catch {
    return {
      success: false,
      error: "Invalid expression",
    };
  }
}

function getCurrentTime() {
  return {
    success: true,
    result: new Date().toLocaleTimeString("fa-IR"),
  };
}

function getCurrentDate() {
  return {
    success: true,
    result: new Date().toLocaleDateString("fa-IR"),
  };
}

function getRandomNumber() {
  return {
    success: true,
    result: Math.floor(Math.random() * 100) + 1,
  };
}

const tools = {
  calculator,
  time: getCurrentTime,
  date: getCurrentDate,
  random: getRandomNumber,
};

function getTool(name) {
  return tools[name];
}

function executeTool(name, input) {
  const tool = getTool(name);

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${name}`,
    };
  }

  return tool(input);
}

module.exports = {
  calculator,
  getCurrentTime,
  getCurrentDate,
  getRandomNumber,
  tools,
  getTool,
  executeTool,
};
