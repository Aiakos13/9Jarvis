const { exec, execFile, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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
      error: error.message || "Web search failed",
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
      error: error.message || "Geocoding failed",
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

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
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
      error: error.message || "Weather request failed",
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
      error: error.message || "Currency request failed",
    };
  }
}

function openApp(app) {
  try {
    if (typeof app !== "string" || !app.trim()) {
      return {
        success: false,
        error: "Invalid application name",
      };
    }

    const cleanApp = app.trim();

    exec(`start "" "${cleanApp}"`, (error) => {
      if (error) {
        console.error("Open app error:", error.message);
      }
    });

    return {
      success: true,
      result: `${cleanApp} opened`,
    };
  } catch {
    return {
      success: false,
      error: "Failed to open application",
    };
  }
}

function openUrl(url) {
  try {
    if (typeof url !== "string" || !url.trim()) {
      return {
        success: false,
        error: "Invalid URL",
      };
    }

    const cleanUrl = url.trim();

    let parsedUrl;

    try {
      parsedUrl = new URL(cleanUrl);
    } catch {
      return {
        success: false,
        error: "Invalid URL",
      };
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        success: false,
        error: "Only HTTP and HTTPS URLs are allowed",
      };
    }

    exec(`start "" "${cleanUrl}"`, (error) => {
      if (error) {
        console.error("Open URL error:", error.message);
      }
    });

    return {
      success: true,
      result: `${cleanUrl} opened`,
    };
  } catch {
    return {
      success: false,
      error: "Failed to open URL",
    };
  }
}

function closeApp(app) {
  try {
    if (typeof app !== "string" || !app.trim()) {
      return {
        success: false,
        error: "Invalid application name",
      };
    }

    const cleanApp = app.trim();

    exec(`taskkill /IM "${cleanApp}.exe" /F`, (error) => {
      if (error) {
        console.error("Close app error:", error.message);
      }
    });

    return {
      success: true,
      result: `${cleanApp} closed`,
    };
  } catch {
    return {
      success: false,
      error: "Failed to close application",
    };
  }
}

function pressKey(key) {
  try {
    if (typeof key !== "string" || !key.trim()) {
      return {
        success: false,
        error: "Invalid key",
      };
    }

    const normalizedKey = key.trim().toUpperCase();

    const keyMap = {
      ENTER: "{ENTER}",
      ESC: "{ESC}",
      ESCAPE: "{ESC}",
      TAB: "{TAB}",
      SPACE: " ",
      BACKSPACE: "{BACKSPACE}",
      DELETE: "{DELETE}",
      UP: "{UP}",
      DOWN: "{DOWN}",
      LEFT: "{LEFT}",
      RIGHT: "{RIGHT}",
      HOME: "{HOME}",
      END: "{END}",
      PGUP: "{PGUP}",
      PGDN: "{PGDN}",
    };

    if (!keyMap[normalizedKey]) {
      return {
        success: false,
        error: `Unsupported key: ${key}`,
      };
    }

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${keyMap[normalizedKey]}')`,
      ],
      (error) => {
        if (error) {
          console.error("Press key error:", error.message);
        }
      },
    );

    return {
      success: true,
      result: `${normalizedKey} pressed`,
    };
  } catch {
    return {
      success: false,
      error: "Failed to press key",
    };
  }
}

function typeText(text) {
  try {
    if (typeof text !== "string" || !text) {
      return {
        success: false,
        error: "Invalid text",
      };
    }

    const escapedText = text.replace(/\\/g, "\\\\").replace(/'/g, "''");

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${escapedText}')`,
      ],
      (error) => {
        if (error) {
          console.error("Type text error:", error.message);
        }
      },
    );

    return {
      success: true,
      result: "Text typed",
    };
  } catch {
    return {
      success: false,
      error: "Failed to type text",
    };
  }
}

function focusApp(app) {
  try {
    if (typeof app !== "string" || !app.trim()) {
      return {
        success: false,
        error: "Invalid application name",
      };
    }

    const cleanApp = app.trim();

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `$wshell = New-Object -ComObject WScript.Shell; if ($wshell.AppActivate('${cleanApp}')) { exit 0 } else { exit 1 }`,
      ],
      (error) => {
        if (error) {
          console.error("Focus app error:", error.message);
        }
      },
    );

    return {
      success: true,
      result: `${cleanApp} focused`,
    };
  } catch {
    return {
      success: false,
      error: "Failed to focus application",
    };
  }
}

function openDefaultBrowser(url = "") {
  try {
    const cleanUrl = typeof url === "string" ? url.trim() : "";

    const command = cleanUrl ? `start "" "${cleanUrl}"` : `start ""`;

    exec(command, (error) => {
      if (error) {
        console.error("Open default browser error:", error.message);
      }
    });

    return {
      success: true,
      result: cleanUrl
        ? `${cleanUrl} opened in default browser`
        : "Default browser opened",
    };
  } catch {
    return {
      success: false,
      error: "Failed to open default browser",
    };
  }
}

function hotkey(keys) {
  try {
    if (typeof keys !== "string" || !keys.trim()) {
      return {
        success: false,
        error: "Invalid hotkey",
      };
    }

    const parts = keys
      .split("+")
      .map((key) => key.trim().toUpperCase())
      .filter(Boolean);

    if (parts.length < 2) {
      return {
        success: false,
        error: "Hotkey must contain at least two keys",
      };
    }

    const keyMap = {
      CTRL: "^",
      CONTROL: "^",
      ALT: "%",
      SHIFT: "+",
      WIN: "{LWIN}",
      WINDOWS: "{LWIN}",
      ENTER: "{ENTER}",
      ESC: "{ESC}",
      TAB: "{TAB}",
      SPACE: " ",
      BACKSPACE: "{BACKSPACE}",
      DELETE: "{DELETE}",
      UP: "{UP}",
      DOWN: "{DOWN}",
      LEFT: "{LEFT}",
      RIGHT: "{RIGHT}",
      HOME: "{HOME}",
      END: "{END}",
      PGUP: "{PGUP}",
      PGDN: "{PGDN}",
    };

    const convertedKeys = parts.map((key) => {
      if (key.length === 1) {
        return key.toLowerCase();
      }

      if (keyMap[key]) {
        return keyMap[key];
      }

      if (/^F([1-9]|1[0-2])$/.test(key)) {
        return `{${key}}`;
      }

      throw new Error(`Unsupported key: ${key}`);
    });

    const command = convertedKeys.join("");

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${command}')`,
      ],
      (error) => {
        if (error) {
          console.error("Hotkey error:", error.message);
        }
      },
    );

    return {
      success: true,
      result: `${keys} pressed`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to press hotkey",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* SCREEN / MOUSE                                                             */
/* -------------------------------------------------------------------------- */

function getPrimaryScreenBounds() {
  try {
    const output = execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `
Add-Type -AssemblyName System.Windows.Forms;
$screen = [System.Windows.Forms.Screen]::PrimaryScreen;
$bounds = $screen.Bounds;

[PSCustomObject]@{
    X = $bounds.X;
    Y = $bounds.Y;
    Width = $bounds.Width;
    Height = $bounds.Height;
} | ConvertTo-Json -Compress;
        `,
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    const parsed = JSON.parse(output.trim());

    const x = Number(parsed.X);
    const y = Number(parsed.Y);
    const width = Number(parsed.Width);
    const height = Number(parsed.Height);

    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error("Invalid screen dimensions");
    }

    return {
      x,
      y,
      width,
      height,
    };
  } catch (error) {
    throw new Error(error.message || "Failed to detect primary screen");
  }
}

function validateScreenCoordinates(x, y, screen) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return false;
  }

  return (
    x >= screen.x &&
    x < screen.x + screen.width &&
    y >= screen.y &&
    y < screen.y + screen.height
  );
}

function mouseClick(input) {
  try {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Invalid mouse click input",
      };
    }

    const parsedX = Number(input.x);
    const parsedY = Number(input.y);

    const normalizedButton = String(input.button || "left")
      .trim()
      .toLowerCase();

    if (!Number.isInteger(parsedX) || !Number.isInteger(parsedY)) {
      return {
        success: false,
        error: "Invalid coordinates",
      };
    }

    if (!["left", "right"].includes(normalizedButton)) {
      return {
        success: false,
        error: "Unsupported mouse button",
      };
    }

    const screen = getPrimaryScreenBounds();

    if (!validateScreenCoordinates(parsedX, parsedY, screen)) {
      return {
        success: false,
        error: `Coordinates are outside the primary screen: (${parsedX}, ${parsedY})`,
      };
    }

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `
Add-Type @'
using System;
using System.Runtime.InteropServices;

public class MouseControl {
    [DllImport("user32.dll")]
    public static extern void SetCursorPos(int x, int y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(
        uint flags,
        uint dx,
        uint dy,
        uint data,
        UIntPtr extraInfo
    );
}
'@;

[MouseControl]::SetCursorPos(
    ${parsedX},
    ${parsedY}
);

if ("${normalizedButton}" -eq "left") {
    [MouseControl]::mouse_event(
        0x0002,
        0,
        0,
        0,
        [UIntPtr]::Zero
    );

    [MouseControl]::mouse_event(
        0x0004,
        0,
        0,
        0,
        [UIntPtr]::Zero
    );
}
else {
    [MouseControl]::mouse_event(
        0x0008,
        0,
        0,
        0,
        [UIntPtr]::Zero
    );

    [MouseControl]::mouse_event(
        0x0010,
        0,
        0,
        0,
        [UIntPtr]::Zero
    );
}
        `,
      ],
      (error) => {
        if (error) {
          console.error("Mouse click error:", error.message);
        }
      },
    );

    return {
      success: true,
      result: `${normalizedButton} click at (${parsedX}, ${parsedY})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to click mouse",
    };
  }
}

function mouseMove(input) {
  try {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Invalid mouse move input",
      };
    }

    const parsedX = Number(input.x);
    const parsedY = Number(input.y);

    if (!Number.isInteger(parsedX) || !Number.isInteger(parsedY)) {
      return {
        success: false,
        error: "Invalid coordinates",
      };
    }

    const screen = getPrimaryScreenBounds();

    if (!validateScreenCoordinates(parsedX, parsedY, screen)) {
      return {
        success: false,
        error: `Coordinates are outside the primary screen: (${parsedX}, ${parsedY})`,
      };
    }

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `
Add-Type @'
using System;
using System.Runtime.InteropServices;

public class MouseMoveControl {
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int x, int y);
}
'@;

[MouseMoveControl]::SetCursorPos(
    ${parsedX},
    ${parsedY}
);
        `,
      ],
      (error) => {
        if (error) {
          console.error("Mouse move error:", error.message);
        }
      },
    );

    return {
      success: true,
      result: `Mouse moved to (${parsedX}, ${parsedY})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to move mouse",
    };
  }
}

function mouseDoubleClick(input) {
  try {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Invalid mouse double click input",
      };
    }

    const parsedX = Number(input.x);
    const parsedY = Number(input.y);

    if (!Number.isInteger(parsedX) || !Number.isInteger(parsedY)) {
      return {
        success: false,
        error: "Invalid coordinates",
      };
    }

    const screen = getPrimaryScreenBounds();

    if (!validateScreenCoordinates(parsedX, parsedY, screen)) {
      return {
        success: false,
        error: `Coordinates are outside the primary screen: (${parsedX}, ${parsedY})`,
      };
    }

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `
Add-Type @'
using System;
using System.Runtime.InteropServices;

public class MouseDoubleClickControl {
    [DllImport("user32.dll")]
    public static extern void SetCursorPos(int x, int y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(
        uint flags,
        uint dx,
        uint dy,
        uint data,
        UIntPtr extraInfo
    );
}
'@;

[MouseDoubleClickControl]::SetCursorPos(
    ${parsedX},
    ${parsedY}
);

[MouseDoubleClickControl]::mouse_event(
    0x0002,
    0,
    0,
    0,
    [UIntPtr]::Zero
);

[MouseDoubleClickControl]::mouse_event(
    0x0004,
    0,
    0,
    0,
    [UIntPtr]::Zero
);

Start-Sleep -Milliseconds 100;

[MouseDoubleClickControl]::mouse_event(
    0x0002,
    0,
    0,
    0,
    [UIntPtr]::Zero
);

[MouseDoubleClickControl]::mouse_event(
    0x0004,
    0,
    0,
    0,
    [UIntPtr]::Zero
);
        `,
      ],
      (error) => {
        if (error) {
          console.error("Mouse double click error:", error.message);
        }
      },
    );

    return {
      success: true,
      result: `Double click at (${parsedX}, ${parsedY})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to double click",
    };
  }
}
function scroll(input) {
  try {
    const amount = Number(input);

    if (!Number.isInteger(amount) || amount === 0) {
      return {
        success: false,
        error: "Invalid scroll amount",
      };
    }

    const scrollAmount =
      amount > 0 ? Math.min(amount, 20) : Math.max(amount, -20);

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `
Add-Type @'
using System;
using System.Runtime.InteropServices;

public class MouseScrollControl {
    [DllImport("user32.dll")]
    public static extern void mouse_event(
        uint flags,
        uint dx,
        uint dy,
        int data,
        UIntPtr extraInfo
    );
}
'@;

[MouseScrollControl]::mouse_event(
    0x0800,
    0,
    0,
    ${scrollAmount * 120},
    [UIntPtr]::Zero
);
        `,
      ],
      (error) => {
        if (error) {
          console.error("Mouse scroll error:", error.message);
        }
      },
    );

    return {
      success: true,
      result: `Scrolled ${scrollAmount > 0 ? "up" : "down"} by ${Math.abs(scrollAmount)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to scroll",
    };
  }
}
/* -------------------------------------------------------------------------- */
/* SCREENSHOT                                                                 */
/* -------------------------------------------------------------------------- */

function screenshot() {
  try {
    const screenshotPath = path.join(
      process.env.TEMP || process.cwd(),
      "9jarvis-screenshot.png",
    );

    const screen = getPrimaryScreenBounds();

    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `
Add-Type -AssemblyName System.Windows.Forms;
Add-Type -AssemblyName System.Drawing;

$screen = [System.Windows.Forms.Screen]::PrimaryScreen;
$bounds = $screen.Bounds;

$bitmap = New-Object System.Drawing.Bitmap(
    $bounds.Width,
    $bounds.Height
);

$graphics = [System.Drawing.Graphics]::FromImage($bitmap);

$graphics.CopyFromScreen(
    $bounds.Location,
    [System.Drawing.Point]::Empty,
    $bounds.Size
);

$bitmap.Save(
    "${screenshotPath.replace(/\\/g, "\\\\")}",
    [System.Drawing.Imaging.ImageFormat]::Png
);

$graphics.Dispose();
$bitmap.Dispose();
        `,
      ],
      {
        stdio: "pipe",
      },
    );

    if (!fs.existsSync(screenshotPath)) {
      return {
        success: false,
        error: "Screenshot file was not created",
      };
    }

    const imageBuffer = fs.readFileSync(screenshotPath);

    if (!imageBuffer.length) {
      return {
        success: false,
        error: "Screenshot file is empty",
      };
    }

    const imageBase64 = imageBuffer.toString("base64");

    return {
      success: true,
      result: "Screenshot captured",
      image: imageBase64,
      mimeType: "image/png",

      // Actual screen information.
      width: screen.width,
      height: screen.height,
      screenLeft: screen.x,
      screenTop: screen.y,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to capture screenshot",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* TOOL REGISTRY                                                              */
/* -------------------------------------------------------------------------- */

const tools = {
  calculator,
  time: getCurrentTime,
  date: getCurrentDate,
  random: getRandomNumber,
  web_search: webSearch,
  geocode: geocodeCity,
  weather: getWeather,
  currency: getCurrencyRate,

  open_app: openApp,
  open_url: openUrl,
  close_app: closeApp,

  press_key: pressKey,
  hotkey,
  type_text: typeText,
  focus_app: focusApp,
  open_default_browser: openDefaultBrowser,

  mouse_click: mouseClick,
  mouse_move: mouseMove,
  mouse_double_click: mouseDoubleClick,
  scroll,

  screenshot,
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

  openApp,
  openUrl,
  closeApp,

  pressKey,
  typeText,
  focusApp,
  openDefaultBrowser,
  hotkey,

  mouseClick,
  mouseMove,
  mouseDoubleClick,
  scroll,

  screenshot,

  tools,
  getTool,
  executeTool,
};
