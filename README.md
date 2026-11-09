# 🤖 9Jarvis

**Languages:** [English](README.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md)

A modular personal AI assistant designed to combine language models, persistent memory, intelligent tool usage, and Windows computer control.

9Jarvis is an evolving project focused on building a reliable assistant that can understand, remember, decide, and act.

## 📑 Quick Navigation

- [✨ Overview](#-overview)
- [🚀 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [⚙️ Installation](#️-installation)
- [💬 Usage](#-usage)
- [🧪 Testing](#-testing)
- [🗺️ Roadmap](#️-roadmap)
- [📄 License](#-license)

---

## ✨ Overview

9Jarvis follows a modular architecture and an incremental development approach.

**Development Workflow:**

`One Change → Test → Inspect Output → Next Change`

## 🚀 Features

| Component        | Description                                                 | Status      |
| ---------------- | ----------------------------------------------------------- | ----------- |
| AI Core          | LLM integration via OpenRouter                              | Implemented |
| Memory           | Persistent local memory and context retrieval               | Implemented |
| Tools            | Calculator, web search, weather, currency, and system tools | Implemented |
| Agent            | Native function calling and multi-step execution            | Implemented |
| Computer Control | Vision-based Windows interaction                            | In Progress |
| Automation       | Task automation                                             | Planned     |
| Voice            | Speech interaction                                          | Planned     |
| GUI              | Graphical interface                                         | Planned     |

**Current Models**

- Chat: `openai/gpt-oss-20b`
- Vision: `deepseek/deepseek-v4.1-flash`

**Technology & Services:** Node.js · OpenRouter · Tavily · Open-Meteo · Frankfurter

## 🏗️ Architecture

```text
User
  ↓
AI Core
  ↓
Memory + Context
  ↓
Agent
  ↓
Tool Validation
  ↓
Tools / Computer Control
  ↓
Result Processing
  ↓
Response
```

**Main Modules:** `main.js` · `agent.js` · `memory.js` · `tools.js` · `toolValidator.js`

## ⚙️ Installation

**Requirements:** Windows, Node.js, npm, Git, OpenRouter API key, and Tavily API key.

**1. Clone the repository**

```bash
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment**

```powershell
Copy-Item .env.example .env
```

Add your API keys to `.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavily_api_key
```

Never commit `.env` or expose API keys.

## 💬 Usage

Start the assistant:

```bash
node main.js
```

Example requests:

```text
سلام
What time is it?
Calculate 25 * 18
Search the web for...
Open an application
```

Type `exit` to quit.

## 🧪 Testing

Run the Agent tests:

```bash
node test-agent.js
```

**Current test results:** 19/19 passed.

Check JavaScript syntax:

```bash
node --check main.js
node --check agent.js
node --check tools.js
```

## 🗺️ Roadmap

- [x] AI Core
- [x] Persistent Memory
- [x] Tool System
- [x] Agent Architecture
- [x] Basic Computer Control
- [ ] Windows UI Automation
- [ ] Reliable action verification
- [ ] Advanced Automation
- [ ] Voice Interaction
- [ ] Graphical Interface

## 📄 License

A formal open-source license has not yet been added.
