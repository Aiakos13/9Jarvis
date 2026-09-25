# 🤖 9Jarvis

> A modular personal AI assistant built from the ground up.

9Jarvis is a personal AI assistant project focused on building a modular, extensible, and reliable assistant capable of understanding context, maintaining persistent memory, using tools, performing multi-step tasks, automating workflows, and eventually interacting with the user's computer through multiple interfaces.

The project is intentionally developed incrementally. Each capability is built, tested, documented, and version-controlled before moving to the next layer.

---

## ✨ Vision

The long-term architecture of 9Jarvis is designed around the following progression:

```text
User
 │
 ▼
Chat / Interface
 │
 ▼
AI Assistant
 │
 ├── Context
 ├── Memory
 └── Personality / Behavior
 │
 ▼
Tools
 │
 ▼
Agent
 │
 ▼
Computer Control
 │
 ▼
Automation
 │
 ▼
Voice
 │
 ▼
Personal AI Assistant
```

The goal is not simply to create another chatbot, but to gradually build a practical assistant that can understand the user's context and eventually perform useful actions.

---

# 🚀 Current Status

| Phase | Component        | Status         |
| ----- | ---------------- | -------------- |
| 01    | Environment      | ✅ Complete     |
| 02    | AI Core          | ✅ Complete     |
| 03    | Assistant        | 🟡 In Progress |
| 04    | Agent            | ⚪ Planned      |
| 05    | Computer Control | ⚪ Planned      |
| 06    | Automation       | ⚪ Planned      |
| 07    | Voice            | ⚪ Planned      |
| 08    | Interface        | ⚪ Planned      |

### Current Focus

**Phase 03 — Smart Memory**

The current system already supports persistent memory, but the memory layer is still manually controlled. The next step is to make memory structured and intelligent.

---

# 🧩 Current Features

The current development version includes:

* AI-powered conversations
* OpenRouter integration
* Conversation context
* Custom system prompt
* 9Jarvis identity and behavior
* Persistent local memory
* Manual memory storage
* Memory management utilities
* Basic error handling
* Terminal-based interface
* Git version control
* GitHub repository integration

---

# 🧠 Memory System

9Jarvis currently maintains persistent memory locally using a JSON-based storage system.

### Current architecture

```text
User
 │
 ▼
9Jarvis
 │
 ▼
Memory Manager
 │
 ├── loadMemory()
 ├── saveMemory()
 └── updateMemory()
 │
 ▼
memory.json
```

### Current manual memory command

```text
remember <information>
```

Example:

```text
remember I am working on the 9Jarvis project
```

The current implementation stores manually provided information in the local memory file.

### Current memory structure

```json
{
  "user": {
    "name": "Sina",
    "note": "..."
  },
  "project": {
    "name": "9Jarvis",
    "description": "Personal AI assistant"
  }
}
```

> `memory.json` is intentionally excluded from version control because it may contain personal information.

---

# 🔮 Smart Memory

The next major milestone is **Smart Memory**.

The current system requires the user to explicitly use:

```text
remember ...
```

The planned system will allow 9Jarvis to determine whether information should be remembered and how it should be organized.

### Planned flow

```text
User Message
     │
     ▼
Memory Detection
     │
     ▼
Should this be remembered?
     │
     ▼
Classify Information
     │
     ▼
Select Memory Category
     │
     ├── Create
     ├── Update
     └── Delete
     │
     ▼
Structured Memory
```

### Planned structure

```text
user
├── name
├── preferences
├── goals
└── notes

project
├── name
└── description
```

Additional memory capabilities such as memory search, temporary vs. permanent information, conflict handling, and intelligent updates will be considered as the system evolves.

---

# 🏗️ Architecture

The current architecture is intentionally simple:

```text
┌──────────────────────┐
│       User           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      main.js         │
│   Chat / Context     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     OpenAI SDK       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      OpenRouter      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    AI Model          │
│ openai/gpt-oss-20b   │
└──────────────────────┘
```

Memory currently operates alongside the conversation layer:

```text
                ┌──────────────┐
                │   User       │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   main.js    │
                └──────┬───────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
       Conversation          Memory
         Context            Manager
              │                 │
              │                 ▼
              │            memory.json
              │
              ▼
         OpenRouter
              │
              ▼
          AI Model
```

---

# 🛠️ Technology Stack

## Current

* **JavaScript**
* **Node.js**
* **OpenAI SDK**
* **OpenRouter**
* **Git**
* **GitHub**
* **OpenCode**

## Planned

* Tool Calling
* Agent architecture
* File system tools
* Computer control
* Task automation
* Speech-to-Text
* Text-to-Speech
* Graphical User Interface

---

# 📁 Project Structure

```text
9jarvis/
│
├── .env
├── .gitignore
├── config.js
├── main.js
├── memory.js
├── memory.json
├── opencode.cmd
├── package.json
├── package-lock.json
│
└── node_modules/
```

### Core Files

| File           | Description                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| `main.js`      | Application entry point, chat loop, system prompt, and conversation handling |
| `config.js`    | Loads and validates environment configuration                                |
| `memory.js`    | Memory loading, saving, and updating utilities                               |
| `memory.json`  | Local persistent memory                                                      |
| `.env`         | Local environment variables and API credentials                              |
| `package.json` | Project metadata and dependencies                                            |
| `.gitignore`   | Files excluded from version control                                          |

---

# ⚙️ Setup

## Requirements

Before running 9Jarvis, install:

* Node.js
* npm
* Git
* An OpenRouter account
* An OpenRouter API key

---

## 1. Clone the Repository

```bash
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure the API Key

Create a `.env` file in the project root:

```env
OPENROUTER_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your own OpenRouter API key.

> Never commit your API key to GitHub.

---

## 4. Start 9Jarvis

Run:

```bash
node main.js
```

You should see:

```text
🤖 9Jarvis is ready!
Type 'exit' to quit.
```

---

# 💬 Usage

Once the application is running, type a message:

```text
You: Hello
```

9Jarvis will respond through the configured AI model:

```text
9Jarvis: Hello! How can I help?
```

---

## 🧠 Store a Memory

Use:

```text
remember <information>
```

Example:

```text
remember I am working on the 9Jarvis project
```

The information is stored locally in `memory.json`.

---

## 🚪 Exit

To close the application:

```text
exit
```

---

# 🤖 OpenCode Development

OpenCode is part of the development workflow for working on the project.

From the project directory:

```powershell
cd "G:\File and video\9jarvis"
opencode.cmd
```

> The path above is specific to the original development environment. Use the path where you cloned the repository on your own machine.

---

# 🔐 Security

The following files contain local or sensitive information and should not be committed:

```text
.env
memory.json
node_modules/
```

The repository currently excludes them through `.gitignore`:

```gitignore
node_modules/
.env
memory.json
```

Before committing changes, verify the working tree:

```bash
git status
```

Never commit:

* API keys
* Passwords
* Access tokens
* Private credentials
* Personal memory data
* Other sensitive configuration

---

# 🧪 Validation

The current implementation has been tested for:

```text
OpenRouter Connection       ✅
AI Response                 ✅
Chat Loop                   ✅
Conversation Context        ✅
System Prompt               ✅
Memory Write                ✅
Memory Read                 ✅
Persistent Memory           ✅
Restart Persistence         ✅
Git Repository              ✅
GitHub Push                 ✅
```

---

# 🗺️ Roadmap

## Phase 01 — Environment

Prepare the development environment, project structure, dependencies, Git, GitHub, and development tooling.

**Status: ✅ Complete**

---

## Phase 02 — AI Core

Connect 9Jarvis to an AI model and establish the core conversation system.

**Status: ✅ Complete**

---

## Phase 03 — Assistant

Build the assistant layer including identity, behavior, context, persistent memory, and intelligent memory management.

**Status: 🟡 In Progress**

### Current milestone

**Smart Memory**

---

## Phase 04 — Agent

Introduce tools and multi-step task execution.

**Status: ⚪ Planned**

---

## Phase 05 — Computer Control

Allow 9Jarvis to interact with the local computer, files, applications, and operating system.

**Status: ⚪ Planned**

---

## Phase 06 — Automation

Introduce scheduled tasks, workflows, triggers, and automated actions.

**Status: ⚪ Planned**

---

## Phase 07 — Voice

Add speech recognition, text-to-speech, voice conversations, and eventually wake-word functionality.

**Status: ⚪ Planned**

---

## Phase 08 — Interface

Build a dedicated graphical interface with conversation history, settings, status information, and assistant controls.

**Status: ⚪ Planned**

---

# 🔄 Development Workflow

The project follows a simple development cycle:

```text
Build
  ↓
Test
  ↓
Verify
  ↓
Document
  ↓
Commit
  ↓
Push
```

Example:

```bash
git status
git add .
git commit -m "Add smart memory"
git push
```

Each major feature should have a clear Git commit so the development history remains understandable and recoverable.

---

# 📜 Development Principles

9Jarvis is developed with the following principles:

* Build incrementally.
* Keep the architecture understandable.
* Prefer simple solutions before complex ones.
* Test features before building on top of them.
* Keep documentation synchronized with the actual implementation.
* Never claim an action was completed when it was not.
* Keep sensitive information outside version control.
* Make major changes traceable through Git commits.
* Add complexity only when it provides a real benefit.

---

# 📝 Documentation

Detailed development notes, Phase documentation, experiments, and development logs are maintained separately in the project's documentation workspace.

The current development path is:

```text
Environment
     ↓
AI Core
     ↓
Assistant
     ↓
Persistent Memory
     ↓
Smart Memory ← Current
     ↓
Agent
     ↓
Computer Control
     ↓
Automation
     ↓
Voice
     ↓
Interface
```

---

# 📌 Current Mission

The immediate objective is to complete **Smart Memory** and finish Phase 03.

After Phase 03 is complete, development will move toward the Agent layer and tool-based task execution.

The project is intentionally built one reliable capability at a time.
