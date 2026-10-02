# 🤖 9Jarvis

> A modular personal AI assistant built incrementally from the ground up.

9Jarvis is a personal AI assistant designed to grow from a simple conversational AI into a modular agent capable of memory, context retrieval, tool usage, multi-step reasoning, computer interaction, automation, voice interaction, and eventually a graphical interface.

The project is built incrementally:

> One Change → Test → Inspect Output → Next Change

Each layer is tested before moving deeper into the architecture.

---

# ✨ Vision

The long-term goal of 9Jarvis is to become a personal AI system that can:

- Understand natural language
- Remember useful information about the user
- Retrieve relevant memory and context
- Decide when tools are required
- Select and execute tools
- Use real tool results
- Perform multi-step tasks
- Interact with the computer
- Automate recurring actions
- Support voice interaction
- Provide a graphical interface
- Act as a reliable personal AI assistant

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
GUI
 ↓
Personal AI Assistant
```

---

# 🚀 Current Status

| Phase | Component        | Status         |
| ----- | ---------------- | -------------- |
| 01    | Environment      | ✅ Complete    |
| 02    | AI Core          | ✅ Complete    |
| 03    | Smart Memory     | ✅ Complete    |
| 04    | Tools            | ✅ Complete    |
| 05    | Agent            | ✅ Complete    |
| 06    | Computer Control | 🟡 In Progress |
| 07    | Automation       | ⚪ Planned     |
| 08    | Voice            | ⚪ Planned     |
| 09    | GUI              | ⚪ Planned     |

## Current Focus

**Phase 06 — Computer Control**

The Agent and Tool architecture are functional.

The current focus is making 9Jarvis capable of interacting with the user's computer reliably.

The current Computer Control layer includes:

- Screenshot capture
- Screen analysis with Vision
- UI element detection
- Bounding-box based element detection
- Mouse click
- Mouse movement
- Double click
- Scrolling
- Screen-coordinate validation

The next improvement is to investigate **Windows UI Automation** so that 9Jarvis can interact with real UI controls more reliably instead of depending entirely on Vision-estimated coordinates.

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
- Relevant context retrieval

## Tools

Current Tool system includes:

- Calculator
- Time
- Date
- Random number
- Web Search
- Geocoding
- Weather
- Currency
- Application control
- URL control
- Mouse control
- Keyboard control
- Screenshot capture

## Agent

The Agent currently supports:

- Agent decision loop
- Tool selection
- Tool execution
- Tool result history
- Finish action
- Maximum step protection
- Retry handling
- Invalid response handling
- Prevention of unnecessary repeated execution
- Tool result awareness
- Multi-step tool execution
- Computer-control tool integration
- Screenshot → Vision → Action flow

---

# 🧠 Memory System

9Jarvis uses a local JSON-based memory system.

Memory is stored in:

```text
memory.json
```

Example structure:

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

## Memory Components

```text
memory.js
memoryDetector.js
memoryQueryDetector.js
memory.json
```

The system supports:

- Single-value memories
- Multiple values
- User information
- Preferences
- Project information
- Memory querying
- Relevant memory retrieval
- Generated memory context
- Duplicate prevention

The memory system is designed so unrelated requests do not unnecessarily retrieve or modify memory.

---

# 🛠️ Tool System

9Jarvis uses a modular Tool architecture.

The Tool layer separates actions from the Agent's decision-making logic.

Current tools include:

```text
calculator
time
date
random
web_search
geocode
weather
currency
open_app
open_url
close_app
press_key
hotkey
focus_app
type_text
open_default_browser
mouse_click
mouse_move
mouse_double_click
scroll
screenshot
```

General execution flow:

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
9Jarvis: ...
```

## Date

The date tool provides the current date using the configured date formats.

## Random

Example:

```text
User: یک عدد تصادفی بده
9Jarvis: ...
```

## Web Search

9Jarvis can perform external web searches when the requested information requires current or external information.

The Web Search tool returns structured search results to the Agent.

## Geocoding

The Geocoding tool converts a city name into geographic coordinates.

```text
City
 ↓
Latitude + Longitude
```

It is also used internally by the Weather tool.

## Weather

The Weather tool can receive a city name directly.

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

Current weather information can include:

- Temperature
- Humidity
- Weather code
- Wind speed
- Local time

## Currency

The Currency tool retrieves exchange rates between supported currencies.

Input:

```json
{
  "from": "USD",
  "to": "EUR"
}
```

The tool returns structured information containing:

```text
Source currency
Target currency
Exchange rate
Date
```

---

# 🖥️ Computer Control

Computer Control is the current development phase.

The goal is to allow 9Jarvis to interact with the operating system and visible applications.

## Current Capabilities

### Screenshot

9Jarvis can capture the primary monitor.

Current implementation captures the primary screen rather than the secondary monitor.

Example result:

```text
Screenshot
Width: 1920
Height: 1080
```

The screenshot is passed to the Vision model for analysis.

### Vision Analysis

Current Vision model:

```text
deepseek/deepseek-v4.1-flash
```

Vision receives the screenshot and returns structured information about visible interactive elements.

Example:

```json
{
  "description": "A YouTube page...",
  "elements": [
    {
      "name": "Kaydet button (Save)",
      "x1": 1388,
      "y1": 925,
      "x2": 1436,
      "y2": 948
    }
  ]
}
```

The current system uses bounding boxes instead of relying on a single Vision-generated coordinate.

### Mouse Control

Available mouse actions:

```text
mouse_click
mouse_move
mouse_double_click
scroll
```

Mouse coordinates are validated against the primary screen bounds before execution.

### Keyboard Control

Available keyboard actions include:

```text
press_key
hotkey
type_text
```

### Application Control

9Jarvis can interact with applications through tools such as:

```text
open_app
close_app
focus_app
open_url
open_default_browser
```

---

# 🔬 Computer Control Architecture

The current Computer Control pipeline is:

```text
User Request
     ↓
Agent
     ↓
Screenshot
     ↓
Vision Analysis
     ↓
Vision Elements
     ↓
Bounding Box
     ↓
Calculated Click Point
     ↓
Mouse Action
     ↓
Agent
     ↓
Finish
```

A tested example is:

```text
User
 ↓
"روی Kaydet کلیک کن"
 ↓
Agent requests screenshot
 ↓
Vision analyzes screen
 ↓
Kaydet is detected
 ↓
Bounding box is returned
 ↓
Agent selects mouse_click
```

The complete chain is functional, but click accuracy still requires improvement.

---

# 🎯 Next Computer Control Milestone

The current limitation is that Vision-based UI detection does not always provide sufficiently accurate click locations.

The next architecture to investigate is **Windows UI Automation**.

Target architecture:

```text
User Request
     ↓
Agent
     ↓
UI Automation
     ↓
Element Found?
   /       \
 Yes        No
  ↓          ↓
Exact UI    Screenshot
Element       ↓
  ↓         Vision
Click         ↓
           Bounding Box
              ↓
            Click
```

This allows:

- Native Windows UI controls to be identified directly
- Element names to be queried
- Control types to be detected
- Bounding rectangles to be retrieved
- More reliable interaction with applications

Vision will remain useful as a fallback for interfaces where UI Automation cannot expose the required element.

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

## Agent Actions

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

These protections help prevent:

- Infinite loops
- Repeated tool execution
- Invalid action responses
- Empty model responses
- Uncontrolled execution

## Agent History

Each executed tool is recorded in Agent history.

```text
Step
Tool
Input
Success
Result
```

For Computer Control, history can also contain:

```text
Screenshot
Vision Analysis
Vision Elements
Screenshot Size
Vision Error
```

This allows the Agent to reason over the current computer state.

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

Current core structure:

```text
9jarvis/
│
├── .env
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
│
├── agent.js
└── testAgent.js
```

`.env` contains local secrets and must never be committed.

---

# ⚙️ Setup

## Requirements

- Windows
- Node.js
- npm
- Git
- OpenRouter API key

Some external tools may require additional API keys.

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

Add your API key to `.env`:

```env
OPENROUTER_API_KEY=your_api_key_here
```

Additional API keys should also be stored in `.env` when required.

Never commit `.env` to GitHub.

---

# 💬 Usage

Start 9Jarvis:

```bash
node main.js
```

Startup:

```text
🤖 9Jarvis is ready...
💬 Type...
```

Example:

```text
You: ساعت چنده؟
9Jarvis: ...
```

```text
You: 23 * 17
9Jarvis: 391
```

```text
You: اسم من چیه؟
9Jarvis: اسم شما سینا است.
```

Computer Control example:

```text
You: روی Kaydet کلیک کن
```

The Agent can then inspect the screen and determine the required computer action.

Exit:

```text
You: exit

👋 خداحافظ سینا!
```

---

# 🧪 Validation

Each major component is tested independently before deeper integration.

## Memory

```text
Memory saving              ✅
Memory retrieval           ✅
Memory queries             ✅
Multiple memory values     ✅
Duplicate prevention       ✅
User memory                ✅
Project memory             ✅
Relevant context retrieval ✅
Memory pollution fixes     ✅
```

## Tools

```text
calculator        ✅
time              ✅
date              ✅
random            ✅
web_search        ✅
geocode           ✅
weather           ✅
currency          ✅
application tools ✅
keyboard tools    ✅
mouse tools       ✅
screenshot        ✅
```

## Agent

```text
Tool selection                 ✅
Tool execution                 ✅
History tracking               ✅
Finish detection               ✅
Retry handling                 ✅
Maximum step protection        ✅
Repeated execution prevention ✅
Tool result handling           ✅
Computer Control integration  ✅
Screenshot analysis            ✅
Vision element extraction      ✅
```

## Current Limitation

Computer Control is functional but not yet considered complete.

The current area requiring improvement is:

```text
Reliable UI element interaction
```

especially when exact click positioning matters.

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

## Phase 03 — Smart Memory

- [x] Persistent memory
- [x] Memory detection
- [x] Memory querying
- [x] Multiple values
- [x] Duplicate prevention
- [x] User memory
- [x] Project memory
- [x] Memory context
- [x] Relevant memory retrieval
- [x] Memory pollution prevention

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
- [x] Application control
- [x] URL control
- [x] Keyboard control
- [x] Mouse control
- [x] Screenshot

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
- [x] Screenshot integration
- [x] Vision integration
- [x] Computer-control tool integration

## Phase 06 — Computer Control

- [x] Screenshot capture
- [x] Primary-monitor capture
- [x] Screen coordinate validation
- [x] Mouse click
- [x] Mouse movement
- [x] Double click
- [x] Scrolling
- [x] Keyboard actions
- [x] Application actions
- [x] Vision screenshot analysis
- [x] Vision element detection
- [x] Bounding-box detection
- [x] Agent integration
- [ ] Improve click accuracy
- [ ] Investigate Windows UI Automation
- [ ] Use UI Automation as primary interaction method where possible
- [ ] Keep Vision as fallback
- [ ] Test multiple applications and UI types
- [ ] Complete Computer Control validation

## Phase 07 — Automation

Planned:

- [ ] Scheduled tasks
- [ ] Triggers
- [ ] Recurring actions
- [ ] Background workflows
- [ ] Event-based automation
- [ ] Automation management

## Phase 08 — Voice

Planned:

- [ ] Speech-to-text
- [ ] Text-to-speech
- [ ] Voice commands
- [ ] Continuous interaction

## Phase 09 — GUI

Planned:

- [ ] Graphical interface
- [ ] Visual assistant
- [ ] Animated Jarvis interface
- [ ] Desktop interface
- [ ] Hardware/device integration

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

The core development rule is:

> One Change → Test → Inspect Output → Next Change

A new capability should not be added until the current layer is stable enough to support it.

Each major feature should remain modular so it can later be replaced or upgraded without rebuilding the entire project.

---

# 📜 Development Principles

## Modular

Each system should have a clear responsibility.

```text
Memory → stores information
Tools → perform actions
Agent → makes decisions
LLM → handles language and reasoning
main.js → coordinates the application
```

## Incremental

9Jarvis is built layer by layer instead of attempting to create the final assistant immediately.

## Test First

New functionality should be tested independently before being integrated into the main application.

## Local and Portable

Where practical, user memory and application data remain under the user's control.

## Simple Before Advanced

The project prioritizes a working simple implementation before adding unnecessary complexity.

## Replaceable Components

Models, tools, routing logic, and subsystems should be replaceable whenever possible.

## Reuse Existing Technology

9Jarvis should implement its own architecture and important logic while using mature libraries, APIs, and system capabilities where reinventing them would provide little value.

---

# 📌 Current Mission

The current mission is to build a reliable personal Agent capable of understanding tasks, retrieving relevant context, selecting tools, executing actions, and interacting with the computer.

Current architecture:

```text
Memory + Context
       ↓
     Tools
       ↓
     Agent
       ↓
Computer Control
       ↓
Tool / Action Results
       ↓
Final Response
```

The immediate milestone is:

```text
Computer Control
      ↓
Reliable UI Interaction
      ↓
Windows UI Automation
      ↓
Vision Fallback
      ↓
Reliable Computer Agent
```

After Computer Control becomes sufficiently reliable, development can move toward:

```text
Computer Control
      ↓
Automation
      ↓
Voice
      ↓
GUI
      ↓
Personal AI Assistant
```

The long-term mission is to turn 9Jarvis into a modular personal AI assistant capable of understanding the user, remembering useful information, choosing the right tools, executing actions, handling multi-step tasks, interacting with the computer, and eventually automating parts of the user's digital environment.

---

# 📄 License

This project is currently developed as a personal project.

License information may be added as the project evolves.
