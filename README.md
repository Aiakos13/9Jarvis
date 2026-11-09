# 9Jarvis 🤖

> A modular personal assistant combining conversational AI, local memory, tools, and experimental Windows desktop interaction.

**Languages:** English · [فارسی](README.fa.md) · [Türkçe](README.tr.md)

9Jarvis is a publicly available project exploring a personal AI assistant that can understand requests, retrieve relevant context, use tools, and interact with a Windows desktop. Some features are implemented; desktop interaction remains experimental and may behave differently across applications.

## Features and status

- **Chat:** Generates responses through OpenRouter using the `openai/gpt-oss-20b` model configured in the current code.
- **Agent:** Tool decisions use a local Ollama-compatible endpoint. The default endpoint is `http://localhost:11434/v1`, and the default model is `qwen3:4b-instruct`.
- **Memory:** Selected user and project information is stored locally in `memory.json` and may be included in relevant context.
- **Tools:** Calculator, time, date, random number, web search, geocoding, weather, currency rates, application and browser launching, application closing and focusing, keyboard and mouse input, scrolling, and screenshots.
- **Vision:** Screenshots can be analyzed through OpenRouter using the vision model configured in the current code, `deepseek/deepseek-v4.1-flash`.
- **Desktop interaction (experimental):** Windows-specific tools can launch and close applications, open URLs, capture and analyze screenshots, and perform supported mouse and keyboard actions. Applications can be opened and closed; URLs can only be opened. Text entry uses Windows UI Automation to target a Notepad text editor.

Web search uses Tavily and requires its API key. Geocoding and weather use Open-Meteo APIs. Currency rates use Frankfurter.

## Requirements

- Windows with PowerShell.
- Node.js and npm.
- Git.
- An OpenRouter API key.
- Ollama running locally with the configured model for Agent tool decisions.
- A Tavily API key only if you want to use web search.

Other operating systems are not documented as supported.

## Install and configure

```powershell
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
npm install
Copy-Item .env.example .env
```

Set `OPENROUTER_API_KEY` in your local `.env` file. Add `TAVILY_API_KEY` if you need web search. The Agent configuration can optionally be changed with `OLLAMA_BASE_URL` and `OLLAMA_MODEL`; their defaults are `http://localhost:11434/v1` and `qwen3:4b-instruct`.

Never commit `.env` or share API keys. Do not put credentials or private data in documentation or screenshots.

## Run

```bash
npm start
```

The root `package.json` defines this command as `node main.js`. You can also run `node main.js` directly.

## Tests

Run the Agent test script with:

```bash
node test-agent.js
```

The script prints parser and native tool-call test results. The root `npm test` command does not run these tests: it is currently a placeholder that prints a message and exits with an error.

## Safety and privacy

Desktop tools can send keyboard and mouse input, launch applications, and force-close application processes. Supervise their use and avoid relying on them for sensitive or irreversible actions. Screenshot content sent for vision analysis is processed through the configured model provider; review that provider’s data policies before use. Memory is stored in the local `memory.json` file, which may contain personal information.

## Limitations and roadmap

Computer interaction is under development. Vision-based element detection and coordinate-based actions may be inaccurate. The current UI Automation implementation for text entry specifically targets a Notepad text editor; it does not establish general UI Automation support across desktop applications. Automation workflows, voice interaction, and a graphical interface are planned, not current features.

## Project license

This repository does not currently provide a root-level license file. Do not assume the code is licensed for reuse or redistribution; check the repository’s licensing terms first.

Bug reports and suggestions can be submitted through [GitHub Issues](https://github.com/Aiakos13/9Jarvis/issues).
