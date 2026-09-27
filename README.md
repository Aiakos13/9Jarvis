# 🤖 9Jarvis

> A modular personal AI assistant built from the ground up.

9Jarvis is a personal AI assistant project designed to grow from a simple conversational AI into a modular agent capable of memory, tool usage, multi-step reasoning, automation, and eventually computer interaction.

The project is being built incrementally, with each stage tested before moving to the next one.

---

## ✨ Vision

The long-term goal of 9Jarvis is to become a personal AI system that can:

- Understand natural language
- Remember useful information about the user
- Decide when tools are needed
- Execute tools and use their results
- Perform multi-step tasks
- Automate recurring actions
- Interact with the computer
- Support voice and graphical interfaces

The development path is:

```text
Chat
  ↓
AI Assistant
  ↓
Memory + Context
  ↓
Tools
  ↓
Agent
  ↓
Automation
  ↓
Computer Control
  ↓
Voice / Interface
  ↓
Personal AI Assistant
```

---

# 🚀 Current Status

| Phase | Component        | Status         |
| ----- | ---------------- | -------------- |
| 01    | Environment      | ✅ Complete    |
| 02    | AI Core          | ✅ Complete    |
| 03    | Memory + Context | ✅ Complete    |
| 04    | Tools            | ✅ Complete    |
| 05    | Agent Loop       | 🟡 In Progress |
| 06    | Computer Control | ⚪ Planned     |
| 07    | Automation       | ⚪ Planned     |
| 08    | Voice            | ⚪ Planned     |
| 09    | Interface        | ⚪ Planned     |

### Current Focus

**Phase 05 — Agent**

The current goal is to make the Agent capable of reliable multi-step task execution while keeping Memory, Tools, and final response generation stable.

---

# 🧩 Current Features

### AI Core

- AI-powered conversations
- OpenRouter integration
- Custom system prompt
- 9Jarvis identity and behavior
- Persian language responses
- Basic error handling
- Terminal interface

### Memory

- Persistent local memory
- Memory detection
- Memory querying
- Multiple memory values
- User memory
- Project memory
- Memory context generation

### Tools

- Tool detection
- Tool validation
- Calculator tool
- Time tool
- Date tool
- Random number tool
- Tool execution
- Tool result handling

### Agent

- Agent decision loop
- Tool selection
- Tool execution
- Tool result history
- Finish action
- Maximum step protection
- Retry handling for invalid/empty model responses
- Prevention of unnecessary repeated tool execution

---

# 🧠 Memory System

9Jarvis uses a local JSON-based memory system.

Memory is stored in:

```text
memory.json
```

The system currently supports persistent information such as:

```json
{
  "user": {
    "name": "Sina",
    "note": "من دارم روی پروژه 9Jarvis کار می‌کنم",
    "preference": {
      "programming_languages": [
        "C++",
        "Rust",
        "Go",
        "JavaScript",
        "Python",
        "TypeScript",
        "PHP"
      ]
    }
  },
  "project": {
    "name": "9Jarvis",
    "description": "Personal AI assistant"
  }
}
```

The memory layer is responsible for storing and retrieving information that should persist between sessions.

### Memory Components

```text
memory.js
memoryDetector.js
memoryQueryDetector.js
memory.json
```

The current memory system supports both single values and multiple values for the same category.

---

# 🛠️ Tool System

9Jarvis uses a modular Tool architecture.

Current tools:

```text
calculator
time
date
random
```

The general flow is:

```text
User Request
     ↓
Tool Detection
     ↓
Tool Validation
     ↓
Tool Execution
     ↓
Tool Result
```

### Calculator

Example:

```text
User: 23 * 17
9Jarvis: 391
```

### Time

Example:

```text
User: ساعت چنده؟
9Jarvis: ساعت ۱:۵۵:۱۳ است.
```

### Date

Example:

```text
User: امروز چندمه؟
9Jarvis: ۱۴۰۵/۷/۶
```

### Random

Example:

```text
User: یک عدد تصادفی بده
9Jarvis: عدد تصادفی شما: 48!
```

---

# 🤖 Agent System

The Agent is responsible for deciding what action 9Jarvis should take.

Unlike a simple Tool Detector, the Agent can repeatedly evaluate the current state of a request.

Basic flow:

```text
User
 ↓
Agent Decision
 ↓
Tool
 ↓
Tool Result
 ↓
Agent Decision
 ↓
Finish
```

The Agent currently supports two actions:

### Execute Tool

```json
{
  "action": "tool",
  "tool": "calculator",
  "input": "25 * 4"
}
```

### Finish

```json
{
  "action": "finish"
}
```

The Agent is protected by:

```text
MAX_STEPS = 5
MAX_RETRIES = 2
```

This prevents infinite loops and allows recovery from occasional empty or invalid model responses.

---

# 🏗️ Architecture

The current architecture is:

```text
┌──────────────────┐
│      User        │
└────────┬─────────┘
         ↓
┌──────────────────┐
│     main.js      │
│  Application Core│
└────────┬─────────┘
         ↓
┌──────────────────┐
│      Memory      │
│ Store / Retrieve │
└────────┬─────────┘
         ↓
┌──────────────────┐
│      Agent       │
│ Decision Making  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│      Tools       │
│ Execute Actions  │
└────────┬─────────┘
         ↓
┌──────────────────┐
│   Tool Results   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│    Final LLM     │
│ Response Builder │
└────────┬─────────┘
         ↓
┌──────────────────┐
│      User        │
└──────────────────┘
```

The important separation is:

```text
Agent = decides what to do

Tool = performs the action

Final LLM = turns the result into a natural response
```

---

# 📁 Project Structure

```text
9jarvis/
│
├── .env.example
├── .gitignore
├── README.md
├── CHANGELOG.md
├── package.json
├── package-lock.json
│
├── config.js
├── main.js
│
├── memory.js
├── memoryDetector.js
├── memoryQueryDetector.js
├── memory.json
│
├── toolDetector.js
├── toolValidator.js
├── tools.js
├── agent.js
│
├── main.backup.js
├── memory.backup.json
│
└── opencode.cmd
```

Temporary test files such as `testAgent.js` are not part of the production architecture.

---

# ⚙️ Setup

## Requirements

- Windows
- Node.js
- npm
- OpenRouter API key
- Git

## Install

Clone the repository:

```bash
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
copy .env.example .env
```

Add your OpenRouter API key to `.env`:

```env
OPENROUTER_API_KEY=your_api_key_here
```

---

# 💬 Usage

Start 9Jarvis:

```bash
node main.js
```

You should see:

```text
🤖 9Jarvis is ready.
💬 Type your message. Type 'exit' to quit.
```

Example:

```text
You: ساعت چنده؟
9Jarvis: ساعت ۱:۵۵:۱۳ است.
```

```text
You: 23 * 17
9Jarvis: 391
```

```text
You: اسم من چیه؟
9Jarvis: اسم شما سینا است.
```

Exit:

```text
You: exit

👋 خداحافظ سینا!
```

---

# 🧪 Validation

Each major component is tested independently before integration.

### Memory

Tested capabilities:

```text
Memory saving
Memory retrieval
Memory queries
Multiple memory values
```

### Tools

Tested:

```text
calculator ✅
time ✅
date ✅
random ✅
```

### Agent

Tested:

```text
Tool selection ✅
Tool execution ✅
History tracking ✅
Finish detection ✅
Retry handling ✅
Maximum step protection ✅
```

### Integrated System

The final integrated CLI has been tested with:

```text
ساعت چنده؟
23 * 17
اسم من چیه؟
یک عدد تصادفی بده
```

All four paths currently work correctly.

---

# 🗺️ Roadmap

## Phase 01 — Environment

- [x] Node.js
- [x] npm
- [x] Project structure
- [x] Git
- [x] GitHub repository
- [x] Environment configuration

## Phase 02 — AI Core

- [x] OpenRouter integration
- [x] OpenAI SDK
- [x] System prompt
- [x] 9Jarvis identity
- [x] Persian responses
- [x] CLI interface

## Phase 03 — Memory + Context

- [x] Persistent memory
- [x] Memory detection
- [x] Memory querying
- [x] Multiple values
- [x] User memory
- [x] Project memory
- [x] Memory context

## Phase 04 — Tools

- [x] Tool detection
- [x] Tool validation
- [x] Tool execution
- [x] Calculator
- [x] Time
- [x] Date
- [x] Random

## Phase 05 — Agent

- [x] Agent Loop
- [x] Tool selection
- [x] Tool execution
- [x] Tool history
- [x] Finish action
- [x] Retry handling
- [x] Loop protection
- [ ] Reliable multi-step tasks
- [ ] Better planning
- [ ] Better context handling
- [ ] More advanced tool orchestration

## Phase 06 — Computer Control

Planned:

- File operations
- Application control
- System commands
- OS interaction
- Computer-level actions

## Phase 07 — Automation

Planned:

- Scheduled tasks
- Triggers
- Recurring actions
- Background workflows
- Event-based automation

## Phase 08 — Voice

Planned:

- Speech-to-text
- Text-to-speech
- Voice commands
- Continuous interaction

## Phase 09 — Interface

Planned:

- Graphical interface
- Visual assistant
- Animated Jarvis face
- Desktop interface
- Hardware/device integration

---

# 🔄 Development Workflow

Development follows an incremental cycle:

```text
Build
 ↓
Test
 ↓
Verify
 ↓
Commit
 ↓
Push
```

A new capability should not be added until the current layer is stable enough to support it.

Each major feature should remain modular so it can later be replaced or upgraded without rebuilding the entire project.

---

# 📜 Development Principles

### Modular

Each system should have a clear responsibility.

```text
Memory → stores information
Tools → perform actions
Agent → makes decisions
LLM → generates language
main.js → coordinates the system
```

### Incremental

9Jarvis is built layer by layer instead of trying to create the final assistant immediately.

### Test First

New functionality should be tested independently before being integrated into the main application.

### Local and Portable

Where practical, user memory and application data remain under the user's control.

### Simple Before Advanced

The project prioritizes a working simple implementation before adding complexity.

### Replaceable Components

Models, tools, and subsystems should be replaceable whenever possible.

---

# 📌 Current Mission

**Build a reliable Agent that can perform multi-step tasks using Memory, Context, and Tools.**

The immediate next milestone is:

```text
Single-step Agent
      ↓
Multi-step Agent
      ↓
Context-aware Agent
      ↓
Reliable Personal Agent
```

The long-term mission is to turn 9Jarvis into a modular personal AI assistant capable of understanding the user, remembering useful information, choosing the right tools, executing actions, and eventually interacting with the user's computer and environment.

---

# 📄 License

This project is currently developed as a personal project.

License information may be added as the project evolves.

```

```
