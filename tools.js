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

async function webSearch(query) {
  try {
    if (typeof query !== "string" || !query.trim()) {
      return {
        success: false,
        error: "Invalid search query",
      };
    }

    if (!process.env.TAVILY_API_KEY) {
      return {
        success: false,
        error: "TAVILY_API_KEY is missing",
      };
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query.trim(),
        search_depth: "basic",
        max_results: 5,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Search API error: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      result: data.results || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function geocodeCity(city) {
  try {
    if (typeof city !== "string" || !city.trim()) {
      return {
        success: false,
        error: "Invalid city",
      };
    }

    const url =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(city.trim())}` +
      `&count=1` +
      `&language=fa` +
      `&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Geocoding API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!Array.isArray(data.results) || data.results.length === 0) {
      return {
        success: false,
        error: `City not found: ${city}`,
      };
    }

    const location = data.results[0];

    return {
      success: true,
      result: {
        city: location.name,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function getWeather(input) {
  try {
    let latitude;
    let longitude;
    let city;

    if (typeof input === "string" && input.trim()) {
      const geoResult = await geocodeCity(input.trim());

      if (!geoResult.success) {
        return {
          success: false,
          error: geoResult.error,
        };
      }

      latitude = geoResult.result.latitude;
      longitude = geoResult.result.longitude;
      city = geoResult.result.city;
    } else if (input && typeof input === "object") {
      latitude = input.latitude;
      longitude = input.longitude;
      city = input.city || null;
    } else {
      return {
        success: false,
        error: "Invalid weather input",
      };
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return {
        success: false,
        error: "Invalid coordinates",
      };
    }

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&timezone=auto`;

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Weather API error: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      result: {
        city,
        temperature: data.current?.temperature_2m,
        humidity: data.current?.relative_humidity_2m,
        weatherCode: data.current?.weather_code,
        windSpeed: data.current?.wind_speed_10m,
        time: data.current?.time,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function getCurrencyRate(input) {
  try {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Invalid currency input",
      };
    }

    const { from, to } = input;

    if (
      typeof from !== "string" ||
      typeof to !== "string" ||
      !from.trim() ||
      !to.trim()
    ) {
      return {
        success: false,
        error: "Invalid currency input",
      };
    }

    const base = from.trim().toUpperCase();
    const target = to.trim().toUpperCase();

    const url =
      `https://api.frankfurter.app/latest` +
      `?from=${encodeURIComponent(base)}` +
      `&to=${encodeURIComponent(target)}`;

    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `Currency API error: ${response.status}`,
      };
    }

    const data = await response.json();

    const rate = data.rates?.[target];

    if (typeof rate !== "number") {
      return {
        success: false,
        error: `Exchange rate not found: ${base} -> ${target}`,
      };
    }

    return {
      success: true,
      result: {
        from: base,
        to: target,
        rate,
        date: data.date,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

const tools = {
  calculator,
  time: getCurrentTime,
  date: getCurrentDate,
  random: getRandomNumber,
  web_search: webSearch,
  geocode: geocodeCity,
  weather: getWeather,
  currency: getCurrencyRate,
};

function getTool(name) {
  return tools[name];
}

async function executeTool(name, input) {
  const tool = getTool(name);

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${name}`,
    };
  }

  return await tool(input);
}

module.exports = {
  calculator,
  getCurrentTime,
  getCurrentDate,
  getRandomNumber,
  webSearch,
  geocodeCity,
  getWeather,
  getCurrencyRate,
  tools,
  getTool,
  executeTool,
};
