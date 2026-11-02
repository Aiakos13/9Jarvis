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
    const isNewsQuery =
      /اخبار|خبرهای|خبر|تحولات اخیر|آخرین.*(هوش مصنوعی|فناوری)|latest news|recent news/i.test(
        query,
      );
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query.trim(),
        topic: isNewsQuery ? "news" : "general",
        search_depth: isNewsQuery ? "advanced" : "basic",
        max_results: isNewsQuery ? 10 : 5,
        ...(isNewsQuery ? { days: 30 } : {}),
        include_raw_content: isNewsQuery,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Search API error: ${response.status}`,
      };
    }
    const data = await response.json();

    let results = data.results || [];

    if (isNewsQuery) {
      const aiKeywords =
        /هوش مصنوعی|هوش‌مصنوعی|artificial intelligence|\bAI\b|machine learning|یادگیری ماشین|مدل زبانی|مدل هوش مصنوعی|هوش مولد|generative ai/i;

      results = results.filter((item) => {
        const text = `${item.title || ""} ${item.content || ""}`;
        return aiKeywords.test(text);
      });
    }

    return {
      success: true,
      result: results,
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
function getWeatherDescription(code) {
  const weatherCodes = {
    0: "آسمان صاف",
    1: "عمدتاً صاف",
    2: "نیمه‌ابری",
    3: "کاملاً ابری",
    45: "مه",
    48: "مه یخ‌زده",
    51: "نم‌نم باران خفیف",
    53: "نم‌نم باران متوسط",
    55: "نم‌نم باران شدید",
    56: "باران یخ‌زده خفیف",
    57: "باران یخ‌زده شدید",
    61: "باران خفیف",
    63: "باران متوسط",
    65: "باران شدید",
    66: "باران یخ‌زده خفیف",
    67: "باران یخ‌زده شدید",
    71: "برف خفیف",
    73: "برف متوسط",
    75: "برف شدید",
    77: "دانه‌های برف",
    80: "رگبار باران خفیف",
    81: "رگبار باران متوسط",
    82: "رگبار باران شدید",
    85: "رگبار برف خفیف",
    86: "رگبار برف شدید",
    95: "طوفان تندری",
    96: "طوفان تندری همراه با تگرگ خفیف",
    99: "طوفان تندری همراه با تگرگ شدید",
  };

  return weatherCodes[code] || "وضعیت نامشخص";
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
      `&temperature_unit=celsius` +
      `&wind_speed_unit=ms` +
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
        weatherDescription: getWeatherDescription(data.current?.weather_code),
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

    if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(target)) {
      return {
        success: false,
        error: "Currency codes must contain exactly 3 letters",
      };
    }

    if (base === target) {
      return {
        success: true,
        result: {
          from: base,
          to: target,
          rate: 1,
          date: new Date().toISOString().slice(0, 10),
        },
      };
    }

    const url =
      `https://api.frankfurter.app/latest` +
      `?from=${encodeURIComponent(base)}` +
      `&to=${encodeURIComponent(target)}`;

    const response = await fetch(url);

    if (response.status === 404) {
      const currenciesResponse = await fetch(
        "https://api.frankfurter.app/currencies",
      );

      if (!currenciesResponse.ok) {
        return {
          success: false,
          error: "Unable to validate currency codes",
        };
      }

      const currencies = await currenciesResponse.json();

      const baseValid = Object.hasOwn(currencies, base);
      const targetValid = Object.hasOwn(currencies, target);

      if (!baseValid || !targetValid) {
        const invalidCodes = [];

        if (!baseValid) invalidCodes.push(base);
        if (!targetValid) invalidCodes.push(target);

        return {
          success: false,
          error: `Unsupported currency code: ${invalidCodes.join(", ")}`,
        };
      }

      return {
        success: false,
        error: `Exchange rate unavailable: ${base} -> ${target}`,
      };
    }
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

async function openApp(app) {
  if (typeof app !== "string" || !app.trim()) {
    return {
      success: false,
      error: "Invalid application name",
    };
  }

  const cleanApp = app.trim();

  try {
    await new Promise((resolve, reject) => {
      exec(`start "" "${cleanApp}"`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    const processName = cleanApp.replace(/\.exe$/i, "");

    if (/^[a-zA-Z0-9_.-]+$/.test(processName)) {
      const escapedName = processName.replace(/'/g, "''");

      const command = `
$deadline = (Get-Date).AddSeconds(5)
$windowFound = $false

do {
  $processes = Get-Process -Name '${escapedName}' -ErrorAction SilentlyContinue

  foreach ($process in $processes) {
    if ($process.MainWindowHandle -ne 0) {
      $windowFound = $true
      break
    }
  }

  if (-not $windowFound) {
    Start-Sleep -Milliseconds 200
  }
} while (-not $windowFound -and (Get-Date) -lt $deadline)

if (-not $windowFound) {
  Write-Error 'Application window did not appear within 5 seconds'
  exit 1
}
`;

      await new Promise((resolve, reject) => {
        execFile(
          "powershell.exe",
          ["-NoProfile", "-Command", command],
          (error) => {
            if (error) reject(error);
            else resolve();
          },
        );
      });
    }

    return {
      success: true,
      result: `${cleanApp} opened`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to open application",
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

async function closeApp(app) {
  if (typeof app !== "string" || !app.trim()) {
    return {
      success: false,
      error: "Invalid application name",
    };
  }

  const cleanApp = app.trim().replace(/\.exe$/i, "");

  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanApp)) {
    return {
      success: false,
      error: "Invalid application name",
    };
  }

  try {
    await new Promise((resolve, reject) => {
      exec(`taskkill /IM "${cleanApp}.exe" /F`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr?.trim() || error.message));
        } else {
          resolve(stdout);
        }
      });
    });

    return {
      success: true,
      result: `${cleanApp} closed`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to close application",
    };
  }
}

async function pressKey(key) {
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

  try {
    await new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${keyMap[normalizedKey]}')`,
        ],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

    return {
      success: true,
      result: `${normalizedKey} pressed`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to press key",
    };
  }
}

async function typeText(text) {
  if (typeof text !== "string" || !text) {
    return {
      success: false,
      error: "Invalid text",
    };
  }

  const encodedText = Buffer.from(text, "utf16le").toString("base64");

  const command = [
    "$ErrorActionPreference = 'Stop'",
    "Add-Type -AssemblyName UIAutomationClient",
    `$bytes = [Convert]::FromBase64String('${encodedText}')`,
    "$text = [System.Text.Encoding]::Unicode.GetString($bytes)",
    "$process = Get-Process -Name 'notepad' -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1",
    "if (-not $process) { throw 'Notepad window not found' }",
    "$root = [System.Windows.Automation.AutomationElement]::FromHandle($process.MainWindowHandle)",
    "$condition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, 'Text editor')",
    "$editor = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)",
    "if (-not $editor) { throw 'Text editor not found' }",
    "$pattern = $null",
    "if (-not $editor.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$pattern)) { throw 'ValuePattern unavailable' }",
    "$pattern.SetValue($text)",
  ].join("; ");

  try {
    await new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-Command", command],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

    return { success: true, result: "Text written through UI Automation" };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to write text",
    };
  }
}

async function focusApp(app) {
  if (typeof app !== "string" || !app.trim()) {
    return {
      success: false,
      error: "Invalid application name",
    };
  }

  const cleanApp = app.trim();

  const escapedApp = cleanApp.replace(/'/g, "''");
  const processName = escapedApp.replace(/\.exe$/i, "");

  const command = `
$processes = Get-Process -Name '${processName}' -ErrorAction SilentlyContinue
if (-not $processes) {
  Write-Error 'Application process not found'
  exit 1
}

$wshell = New-Object -ComObject WScript.Shell
$activated = $false

foreach ($process in $processes) {
  if ($process.MainWindowHandle -ne 0 -and $wshell.AppActivate($process.Id)) {
    $activated = $true
    break
  }
}

if (-not $activated) {
  Write-Error 'Could not activate application window'
  exit 1
}
`;

  try {
    await new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-Command", command],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

    return {
      success: true,
      result: `${cleanApp} focused`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.stderr?.trim() || error.message || "Failed to focus application",
    };
  }
}

async function openDefaultBrowser(url = "") {
  const cleanUrl = typeof url === "string" ? url.trim() : "";

  if (cleanUrl) {
    try {
      const parsedUrl = new URL(cleanUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return {
          success: false,
          error: "Invalid URL protocol",
        };
      }
    } catch {
      return {
        success: false,
        error: "Invalid URL",
      };
    }
  }

  const command = cleanUrl ? `start "" "${cleanUrl}"` : `start ""`;

  try {
    await new Promise((resolve, reject) => {
      exec(command, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    return {
      success: true,
      result: cleanUrl
        ? `${cleanUrl} opened in default browser`
        : "Default browser opened",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to open default browser",
    };
  }
}

async function hotkey(keys) {
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

  let command;

  try {
    command = parts
      .map((key) => {
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
      })
      .join("");
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to press hotkey",
    };
  }

  try {
    await new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${command}')`,
        ],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

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

async function mouseClick(input) {
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

  const command = `
Add-Type @'
using System;
using System.Runtime.InteropServices;

public class MouseControl {
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int x, int y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(
        uint flags,
        uint dx,
        uint dy,
        uint data,
        UIntPtr extraInfo
    );
}
'@

if (-not [MouseControl]::SetCursorPos(${parsedX}, ${parsedY})) {
    throw 'Failed to move cursor'
}

if ("${normalizedButton}" -eq "left") {
    [MouseControl]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
    [MouseControl]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
}
else {
    [MouseControl]::mouse_event(0x0008, 0, 0, 0, [UIntPtr]::Zero)
    [MouseControl]::mouse_event(0x0010, 0, 0, 0, [UIntPtr]::Zero)
}
`;

  try {
    await new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-Command", command],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

    return {
      success: true,
      result: `${normalizedButton} click at (${parsedX}, ${parsedY})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.stderr?.trim() || error.message || "Failed to click mouse",
    };
  }
}

async function mouseMove(input) {
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

  const command = `
Add-Type @'
using System;
using System.Runtime.InteropServices;

public class MouseMoveControl {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetCursorPos(int x, int y);
}
'@

if (-not [MouseMoveControl]::SetCursorPos(${parsedX}, ${parsedY})) {
    throw "SetCursorPos failed"
}
`;

  try {
    await new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-Command", command],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

    return {
      success: true,
      result: `Mouse moved to (${parsedX}, ${parsedY})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.stderr?.trim() || error.message || "Failed to move mouse",
    };
  }
}

async function mouseDoubleClick(input) {
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

  const command = `
Add-Type @'
using System;
using System.Runtime.InteropServices;

public class MouseDoubleClickControl {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetCursorPos(int x, int y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(
        uint flags, uint dx, uint dy, uint data, UIntPtr extraInfo
    );
}
'@

if (-not [MouseDoubleClickControl]::SetCursorPos(${parsedX}, ${parsedY})) {
    throw "SetCursorPos failed"
}

[MouseDoubleClickControl]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
[MouseDoubleClickControl]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)

Start-Sleep -Milliseconds 100

[MouseDoubleClickControl]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
[MouseDoubleClickControl]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
`;

  try {
    await new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-Command", command],
        (error) => {
          if (error) reject(error);
          else resolve();
        },
      );
    });

    return {
      success: true,
      result: `Double click at (${parsedX}, ${parsedY})`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.stderr?.trim() || error.message || "Failed to double click",
    };
  }
}

async function scroll(input) {
  const amount = Number(input);

  if (!Number.isInteger(amount) || amount === 0) {
    return {
      success: false,
      error: "Invalid scroll amount",
    };
  }

  const scrollAmount =
    amount > 0 ? Math.min(amount, 20) : Math.max(amount, -20);

  const command = `
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
'@

[MouseScrollControl]::mouse_event(
    [uint32]0x0800,
    [uint32]0,
    [uint32]0,
    [int]${scrollAmount * 120},
    [UIntPtr]::Zero
)
`;

  const { execFile } = require("child_process");
  const { promisify } = require("util");
  const execFileAsync = promisify(execFile);

  try {
    await execFileAsync("powershell.exe", ["-NoProfile", "-Command", command]);

    return {
      success: true,
      result: `Scrolled ${scrollAmount > 0 ? "up" : "down"} by ${Math.abs(scrollAmount)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.stderr?.trim() || error.message || "Failed to scroll",
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
