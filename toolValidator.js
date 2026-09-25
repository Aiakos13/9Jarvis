const { getTool } = require("./tools");

function validateToolData(toolData) {
  if (!toolData || typeof toolData !== "object") {
    return {
      valid: false,
      error: "Invalid tool data",
    };
  }

  if (toolData.needsTool === false) {
    return {
      valid: true,
      data: {
        needsTool: false,
        tool: null,
        input: null,
      },
    };
  }

  if (toolData.needsTool !== true) {
    return {
      valid: false,
      error: "Invalid needsTool value",
    };
  }

  if (typeof toolData.tool !== "string") {
    return {
      valid: false,
      error: "Invalid tool name",
    };
  }

  const tool = getTool(toolData.tool);

  if (typeof tool !== "function") {
    return {
      valid: false,
      error: `Unknown tool: ${toolData.tool}`,
    };
  }

  return {
    valid: true,
    data: {
      needsTool: true,
      tool: toolData.tool,
      input: toolData.input ?? null,
    },
  };
}

module.exports = {
  validateToolData,
};
