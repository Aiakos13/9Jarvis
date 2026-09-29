# 🤖 9Jarvis

> A modular personal AI assistant built from the ground up.

9Jarvis is a personal AI assistant project designed to grow from a simple conversational AI into a modular agent capable of memory, tool usage, multi-step reasoning, automation, computer interaction, and eventually voice and graphical interfaces.

The project is being built incrementally, with each stage tested before moving to the next one.

---

# ✨ Vision

The long-term goal of 9Jarvis is to become a personal AI system that can:

- Understand natural language
- Remember useful information about the user
- Retrieve relevant memory and context
- Decide when tools are needed
- Select and execute tools
- Use real tool results
- Perform multi-step tasks
- Automate recurring actions
- Interact with the computer
- Support voice interaction
- Provide a graphical interface

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
Computer Control
  ↓
Automation
  ↓
Voice
  ↓
Interface
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
| 05    | Agent            | 🟡 In Progress |
| 06    | Computer Control | ⚪ Planned     |
| 07    | Automation       | ⚪ Planned     |
| 08    | Voice            | ⚪ Planned     |
| 09    | Interface        | ⚪ Planned     |

### Current Focus

**Phase 05 — Agent**

Phase 04 established a modular Tool system.

The current focus is improving the Agent so it can reliably:

- Understand the user's task
- Decide which tool is required
- Execute the correct tool
- Track previous tool executions
- Avoid unnecessary repeated execution
- Use successful tool results
- Perform reliable multi-step tasks
- Maintain useful context during execution

The current Agent architecture is functional, but multi-step planning and orchestration are still being improved.

---

# 🧩 Current Features

## AI Core

- AI-powered conversations
- OpenRouter integration
- OpenAI SDK
- Custom system prompt
- 9Jarvis identity
- Persian language responses
- Terminal interface
- Basic error handling

## Memory

- Persistent local memory
- Memory detection
- Memory querying
- Multiple memory values
- User memory
- Project memory
- Memory context generation
- Duplicate memory prevention
- Targeted memory retrieval

## Tools

- Modular Tool architecture
- Tool validation
- Tool execution
- Calculator
- Time
- Date
- Random number
- Web Search
- Geocoding
- Weather
- Currency exchange rates

## Agent

- Agent decision loop
- Tool selection
- Tool execution
- Tool result history
- Finish action
- Maximum step protection
- Retry handling
- Invalid response handling
- Prevention of unnecessary repeated tool execution
- Tool result awareness
- Integration with final response generation

---

# 🧠 Memory System

9Jarvis uses a local JSON-based memory system.

Memory is stored in:

```text
memory.json
```

The current memory system can store information such as:

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
      ],
      "technologies": ["React"],
      "favorite_games": ["GTA"],
      "favorite_music": ["Turkish music", "rock", "Jazz", "classical"]
    },
    "identity": {
      "profession": "programmer",
      "age": "23"
    }
  },
  "project": {
    "name": "9Jarvis",
    "description": "Personal AI assistant"
  }
}
```

The memory layer is responsible for storing and retrieving information that should persist between sessions.

## Memory Components

```text
memory.js
memoryDetector.js
memoryQueryDetector.js
memory.json
```

The memory system supports:

- Single-value memories
- Multiple values
- User information
- Preferences
- Project information
- Memory querying
- Relevant memory retrieval
- Generated memory context

The system is designed so that unrelated requests do not unnecessarily retrieve memory.

---

# 🛠️ Tool System

9Jarvis uses a modular Tool architecture.

Current tools:

```text
calculator
time
date
random
web_search
geocode
weather
currency
```

The general execution flow is:

```text
User Request
     ↓
Agent Decision
     ↓
Tool Validation
     ↓
Tool Execution
     ↓
Tool Result
     ↓
Agent / Final Response
```

## Calculator

Example:

```text
User: 23 * 17
9Jarvis: 391
```

The calculator validates mathematical expressions before execution.

## Time

Example:

```text
User: ساعت چنده؟
9Jarvis: ساعت ۱۶:۱۷:۵۷ است.
```

## Date

Example:

```text
User: امروز چندمه؟
9Jarvis: ۱۴۰۵/۷/۶
```

## Random

Example:

```text
User: یک عدد تصادفی بده
9Jarvis: 48
```

## Web Search

9Jarvis can perform external web searches when the requested information requires current or external information.

Example:

```text
User: OpenAI رو تعریف کن
9Jarvis: ...
```

The Web Search tool uses an external search API and returns structured search results to the Agent.

## Geocoding

The Geocoding tool converts a city name into geographic coordinates.

Example:

```text
City
 ↓
Latitude + Longitude
```

It is also used internally by the Weather tool when a city name is provided.

## Weather

The Weather tool can receive a city name directly.

Example:

```text
User: آب و هوای تبریز چطوره؟
9Jarvis: ...
```

The tool:

```text
City
 ↓
Geocoding
 ↓
Latitude + Longitude
 ↓
Weather API
 ↓
Current Weather
```

Current weather data includes:

- Temperature
- Humidity
- Weather code
- Wind speed
- Local time

## Currency

The Currency tool retrieves current exchange rates between supported currencies.

Example:

```text
User: دلار به یورو چنده؟
9Jarvis: هر ۱ دلار آمریکا حدود ۰.۸۸ یورو است.
```

Input format:

```json
{
  "from": "USD",
  "to": "EUR"
}
```

The tool returns structured data containing:

```text
Source currency
Target currency
Exchange rate
Date
```

---

# 🤖 Agent System

The Agent is responsible for deciding what action 9Jarvis should take.

Unlike a simple Tool Detector, the Agent can evaluate the current state of a request and decide whether another tool execution is required.

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
Tool / Finish
```

The Agent currently supports two actions.

## Execute Tool

```json
{
  "action": "tool",
  "tool": "calculator",
  "input": "25 * 4"
}
```

## Finish

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

These protections help prevent:

- Infinite loops
- Repeated tool execution
- Invalid action responses
- Empty model responses
- Uncontrolled execution

### Agent History

Each executed tool is recorded in the Agent history:

```text
Step
Tool
Input
Success
Result
```

This allows the Agent and final response generator to know what has already happened.

A successful tool result should be treated as authoritative.

For example:

```text
User
 ↓
Agent
 ↓
Currency Tool
 ↓
USD → EUR
 ↓
Rate: 0.88067
 ↓
Final Response
```

The final response layer receives the actual tool result and converts it into a natural user-facing response.

---

# 🏗️ Architecture

The current architecture is:

```text
┌──────────────────┐
│       User       │
└────────┬─────────┘
         ↓
┌──────────────────┐
│     main.js      │
│ Application Core │
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
│       User       │
└──────────────────┘
```

The important separation is:

```text
Memory
→ stores and retrieves information

Agent
→ decides what action should happen

Tools
→ perform external or computational actions

Tool Results
→ provide real execution data

Final LLM
→ turns results into natural language

main.js
→ coordinates the application
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

Temporary test files are not part of the production architecture.

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

If using external tools that require API keys, configure them in `.env` as documented by the project.

Never commit `.env` to GitHub.

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

Examples:

```text
You: ساعت چنده؟
9Jarvis: ساعت ۱۶:۱۷:۵۷ است.
```

```text
You: 23 * 17
9Jarvis: 391
```

```text
You: اسم من چیه؟
9Jarvis: اسم شما سینا است.
```

```text
You: دلار به یورو چنده؟
9Jarvis: هر ۱ دلار آمریکا حدود ۰.۸۸ یورو است.
```

Exit:

```text
You: exit

👋 خداحافظ سینا!
```

---

# 🧪 Validation

Each major component is tested independently before integration.

## Memory

Tested capabilities:

```text
Memory saving              ✅
Memory retrieval           ✅
Memory queries             ✅
Multiple memory values     ✅
Duplicate prevention       ✅
User memory                ✅
Project memory             ✅
Relevant context retrieval ✅
```

## Tools

Tested:

```text
calculator   ✅
time         ✅
date         ✅
random       ✅
web_search   ✅
geocode      ✅
weather      ✅
currency     ✅
```

## Agent

Tested:

```text
Tool selection                  ✅
Tool execution                  ✅
History tracking                ✅
Finish detection                ✅
Retry handling                  ✅
Maximum step protection         ✅
Repeated execution prevention   ✅
Tool result handling            ✅
```

## Integrated System

The integrated CLI has been tested with:

```text
ساعت چنده؟
23 * 17
اسم من چیه؟
یک عدد تصادفی بده
آب و هوای تبریز چطوره؟
دلار به یورو چنده؟
```

The current Tool and Agent pipeline is operational.

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
- [x] Duplicate prevention
- [x] User memory
- [x] Project memory
- [x] Memory context
- [x] Relevant memory retrieval

## Phase 04 — Tools

- [x] Tool architecture
- [x] Tool validation
- [x] Tool execution
- [x] Calculator
- [x] Time
- [x] Date
- [x] Random
- [x] Web Search
- [x] Geocoding
- [x] Weather
- [x] Currency

## Phase 05 — Agent

- [x] Agent loop
- [x] Tool selection
- [x] Tool execution
- [x] Tool history
- [x] Finish action
- [x] Retry handling
- [x] Loop protection
- [x] Successful tool result handling
- [x] Repeated execution prevention
- [ ] Reliable multi-step tasks
- [ ] Better planning
- [ ] Better context handling
- [ ] More advanced tool orchestration
- [ ] Improved deterministic routing

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
Inspect Output
 ↓
Verify
 ↓
Commit
 ↓
Push
 ↓
Update Documentation
```

The project follows a strict incremental approach:

> One Change → Test → Inspect Output → Next Change

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

The project prioritizes a working simple implementation before adding unnecessary complexity.

### Replaceable Components

Models, tools, routing logic, and subsystems should be replaceable whenever possible.

---

# 📌 Current Mission

**Build a reliable Agent that can perform multi-step tasks using Memory, Context, and Tools.**

The current architecture has reached:

```text
Memory
   +
Tools
   ↓
Agent
   ↓
Tool Execution
   ↓
Tool Results
   ↓
Final Response
```

The immediate next milestone is:

```text
Single-step Agent
      ↓
Reliable Multi-step Agent
      ↓
Context-aware Agent
      ↓
Reliable Personal Agent
```

The long-term mission is to turn 9Jarvis into a modular personal AI assistant capable of understanding the user, remembering useful information, choosing the right tools, executing actions, handling multi-step tasks, and eventually interacting with the user's computer and environment.

---

# 📄 License

This project is currently developed as a personal project.

License information may be added as the project evolves.
