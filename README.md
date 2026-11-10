# 🤖 9Jarvis

> A modular personal AI assistant built incrementally, combining conversational AI, local memory, tools, and experimental Windows desktop interaction.

**Languages:** English · [فارسی](README.fa.md) · [Türkçe](README.tr.md)

9Jarvis is a publicly available project exploring the architecture of personal AI assistants. The project is under active development: chat, local memory, and the Agent/tool flow are implemented, while computer interaction is experimental. Automation workflows, voice interaction, and a graphical interface are planned rather than current features.

## 📑 Contents

- [Overview](#-overview)
- [Features and status](#-features-and-status)
- [Architecture](#️-architecture)
- [Requirements and setup](#️-requirements-and-setup)
- [Usage](#-usage)
- [Testing](#-testing)
- [Safety and privacy](#-safety-and-privacy)
- [Roadmap](#-roadmap)
- [License](#-license)

## ✨ Overview

9Jarvis follows a modular, incremental development approach:

> **One Change → Test → Inspect Output → Next Change**

Its command-line application combines an OpenRouter-powered conversational model with a local Ollama-compatible Agent that selects and runs validated tools. Selected memory is stored in a local JSON file.

## 🚀 Features and status

| Component | Description | Status |
| --- | --- | --- |
| AI Core | Conversational responses through OpenRouter | Implemented |
| Memory | Selected user/project information stored locally and retrieved as context | Implemented |
| Tools | Utility, web-search, weather, currency, and Windows interaction tools | Implemented; see limitations |
| Agent | Local-model tool selection, validation, execution, and bounded multi-step loop | Implemented |
| Computer interaction | Windows application, keyboard/mouse, screenshot, and vision actions | Experimental; reliability varies |
| Automation, voice, GUI | Future extensions | Planned |

### Models and services

- Chat and final responses: `openai/gpt-oss-20b` through OpenRouter.
- Screenshot vision analysis: `deepseek/deepseek-v4.1-flash` through OpenRouter.
- Agent tool decisions: local Ollama-compatible API. Defaults are `http://localhost:11434/v1` and `qwen3:4b-instruct`; both can be overridden with environment variables.
- Web search: Tavily; requires `TAVILY_API_KEY`.
- Geocoding and weather: Open-Meteo APIs.
- Currency exchange rates: Frankfurter.

### Available tools

`calculator`, `time`, `date`, `random`, `web_search`, `geocode`, `weather`, `currency`, `open_app`, `open_url`, `close_app`, `press_key`, `hotkey`, `focus_app`, `type_text`, `open_default_browser`, `mouse_click`, `mouse_move`, `mouse_double_click`, `scroll`, and `screenshot`.

Application tools can launch and close applications; URL tools open URLs but do not close them. Text entry currently targets a Notepad text editor through Windows UI Automation. This does not imply general UI Automation support across desktop apps. Vision-based detection and coordinate-based actions can be inaccurate.

## 🏗️ Architecture

```text
User request
    ↓
main.js — CLI, memory context, final response
    ↓
agent.js — local Agent decides whether to call a tool
    ↓
toolValidator.js — validates tool and arguments
    ↓
tools.js — executes the operation and returns a result
    ↓
Agent loop — continues or finishes (bounded by step/retry limits)
```

Core modules include `main.js`, `config.js`, `agent.js`, `toolValidator.js`, `tools.js`, `memory.js`, `memoryDetector.js`, and `memoryQueryDetector.js`. The Agent is configured for at most 5 steps and 2 retries per action request.

Memory is stored in `memory.json` in the project working directory. It can contain personal details; inspect it before sharing project folders or backups.

## ⚙️ Requirements and setup

### Requirements

- Windows and PowerShell (the documented desktop tools are Windows-specific).
- Node.js and npm.
- Git.
- An OpenRouter API key.
- Ollama running locally with the configured model for Agent tool decisions.
- A Tavily API key only if you use web search.

### Install

```powershell
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
npm install
Copy-Item .env.example .env
```

Set `OPENROUTER_API_KEY` in your local `.env`. Add `TAVILY_API_KEY` only when using web search. The Agent endpoint and model can be changed with `OLLAMA_BASE_URL` and `OLLAMA_MODEL`; their defaults are `http://localhost:11434/v1` and `qwen3:4b-instruct`.

Do not commit `.env` or share API keys. The checked-in `.env.example` contains placeholders, not usable credentials.

## 💬 Usage

Start the CLI:

```bash
npm start
```

The root `package.json` maps `npm start` to `node main.js`. To exit, type `exit`.

Example requests:

```text
What time is it?
25 * 18
Search the web for recent news
What is the weather in Berlin?
Open Notepad
```

Web search requires Tavily configuration. Weather requests use geocoding followed by the weather API. Desktop examples require Windows and should be supervised.

## 🧪 Testing

Run the Agent parser and native tool-call tests with:

```bash
node test-agent.js
```

The root `npm test` command does **not** run this script. It is currently a placeholder that prints “Tests have not been configured yet” and exits with an error. Syntax checks for selected files can be run with `node --check <file>`.

## 🛡️ Safety and privacy

Desktop tools can send keyboard/mouse input, launch applications, and force-close application processes. Supervise their use; avoid using them for sensitive or irreversible actions. Screenshots sent for vision analysis are sent to the configured model provider. Review the provider’s data policies and avoid exposing private screen content. Local memory is kept in `memory.json` and may include personal information.

## 🗺️ Roadmap

- Improve computer-control reliability and validate actions after execution.
- Investigate broader Windows UI Automation support; beyond the current Notepad text-entry implementation, this is not a completed general feature.
- Develop automation workflows.
- Explore voice interaction.
- Build a graphical interface.

## 📄 License

No formal license file is currently provided at the repository root. Do not assume the project is licensed for reuse or redistribution; check the repository’s licensing terms first. Bug reports and suggestions can be submitted through [GitHub Issues](https://github.com/Aiakos13/9Jarvis/issues).
