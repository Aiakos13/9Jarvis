# 🤖 9Jarvis

**Languages:** English · [فارسی](README.fa.md) · [Türkçe](README.tr.md)

> A modular personal AI assistant built incrementally, from conversational AI to an autonomous computer-interacting agent.

**9Jarvis** is an open-source personal AI assistant project focused on exploring and building the architecture behind modern AI agents.

It is designed to evolve from a simple conversational interface into a modular system capable of understanding natural language, maintaining persistent memory, retrieving relevant context, using external tools, executing multi-step tasks, interacting with the operating system, and eventually supporting automation, voice interaction, and a graphical interface.

The project emphasizes modular architecture, practical implementation, incremental development, and testing each component before moving to the next stage.

> **One Change → Test → Inspect Output → Next Change**

---

# ✨ Vision

The long-term goal is to build a personal AI assistant that can:

- Understand natural language and user intent.
- Maintain persistent memory across sessions.
- Retrieve relevant information and context.
- Decide when external tools are necessary.
- Select tools using native function calling.
- Execute actions and interpret their results.
- Handle multi-step tasks through an Agent loop.
- Observe and interact with the computer.
- Automate recurring and event-driven workflows.
- Support speech recognition and voice responses.
- Provide a graphical desktop interface.
- Keep its components modular and replaceable.

## Development Architecture

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

# 🚀 Project Status

| Phase | Component                   | Status         |
| ----- | --------------------------- | -------------- |
| 01    | Environment & Project Setup | ✅ Complete    |
| 02    | AI Core                     | ✅ Complete    |
| 03    | Smart Memory & Context      | ✅ Complete    |
| 04    | Tool System                 | ✅ Complete    |
| 05    | Agent Architecture          | ✅ Implemented |
| 06    | Computer Control            | 🟡 In Progress |
| 07    | Automation                  | ⚪ Planned     |
| 08    | Voice Interaction           | ⚪ Planned     |
| 09    | Graphical Interface         | ⚪ Planned     |

## Current Focus

**Phase 06 — Computer Control**

The core Agent and Tool architecture are implemented.

The current development focus is improving the reliability of computer interaction, especially UI element identification and accurate actions.

Current work includes:

- Screenshot capture.
- Vision-based screen analysis.
- UI element detection.
- Bounding-box extraction.
- Mouse and keyboard interaction.
- Screen-coordinate validation.
- PowerShell-based computer interaction.
- Investigation of Windows UI Automation.

The next milestone is to use native Windows UI controls whenever possible, with Vision-based detection as a fallback.

---

# 🧩 Current Features

## 1. AI Core

The AI Core provides the conversational foundation of 9Jarvis.

Features:

- OpenRouter integration.
- OpenAI SDK integration.
- Configurable language models.
- Custom system prompt.
- Dedicated 9Jarvis identity.
- Persian-language responses.
- Terminal-based interface.
- Environment-based configuration.
- Basic error handling.

### Current Models

| Component                 | Model                          |
| ------------------------- | ------------------------------ |
| Main conversational model | `openai/gpt-oss-20b`           |
| Vision model              | `deepseek/deepseek-v4.1-flash` |

Models are accessed through OpenRouter, allowing the underlying model provider to be changed without redesigning the entire application.

## 2. Smart Memory

9Jarvis includes a persistent, local JSON-based memory system.

Features:

- Persistent memory between sessions.
- User information storage.
- Preference management.
- Project-related memory.
- Memory detection.
- Memory querying.
- Multiple values per memory category.
- Relevant context retrieval.
- Generated memory context.
- Duplicate memory prevention.
- Protection against unnecessary memory retrieval and modification.

## 3. Tool System

The Tool System provides the Agent with access to external services, system operations, and computational capabilities.

Current tool registry:

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

The tools are implemented independently of the Agent's decision-making logic.

## 4. Agent

The Agent is responsible for deciding which actions should be executed and when a task is complete.

Current capabilities:

- Native Function Calling.
- Tool selection.
- Tool argument handling.
- Tool validation.
- Tool execution.
- Tool result processing.
- Multi-step execution.
- Execution history.
- Finish action.
- Retry handling.
- Invalid response handling.
- Maximum step protection.
- Prevention of unnecessary repeated execution.
- Computer-control integration.
- Screenshot and Vision-based action flow.

## 5. Computer Control

The Computer Control layer allows 9Jarvis to observe and interact with the user's desktop.

Current capabilities include:

- Screenshot capture.
- Vision-based screen analysis.
- UI element detection.
- Bounding-box extraction.
- Mouse movement and clicking.
- Double clicking.
- Scrolling.
- Keyboard input.
- Application management.
- Screen-coordinate validation.
- PowerShell-based interaction.

Computer Control is functional but remains under development. Reliable interaction with different application interfaces is still being improved.

---

# 🧠 Memory Architecture

9Jarvis uses a local JSON file to persist selected information.

Memory storage:

```text
memory.json
```

Example:

```json
{
  "user": {
    "name": "Sina",
    "note": "Working on the 9Jarvis project",
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
    "description": "A modular personal AI assistant"
  }
}
```

## Memory Components

```text
memory.js
memoryDetector.js
memoryQueryDetector.js
memory.json
```

### Memory Workflow

```text
User Input
    ↓
Memory Detection
    ↓
Determine Memory Intent
    ↓
Save / Retrieve / Ignore
    ↓
Relevant Memory Context
    ↓
Agent / LLM
```

The memory system distinguishes between information that should be stored, information that should be retrieved, and ordinary requests that do not require memory operations.

---

# 🛠️ Tool Architecture

The Tool layer separates execution from decision-making.

General execution flow:

```text
User Request
     ↓
Agent Decision
     ↓
Native Function Calling
     ↓
Tool Validation
     ↓
Tool Execution
     ↓
Structured Tool Result
     ↓
Agent Decision
     ↓
Next Tool / Finish
```

## Native Function Calling

The Agent uses native function calling through the model API.

Instead of relying exclusively on manually parsing text responses, the model can return structured tool calls with defined arguments.

This architecture provides:

- Structured tool selection.
- Defined tool argument schemas.
- Better separation between reasoning and execution.
- More predictable tool integration.
- A consistent interface for adding new tools.

Tool calls are validated before execution.

## Available Tools

| Tool                   | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `calculator`           | Validates and evaluates mathematical expressions |
| `time`                 | Returns the current time                         |
| `date`                 | Returns the current date                         |
| `random`               | Generates random numbers                         |
| `web_search`           | Searches external information using Tavily       |
| `geocode`              | Converts place names into geographic coordinates |
| `weather`              | Retrieves weather information                    |
| `currency`             | Retrieves exchange rates                         |
| `open_app`             | Opens applications                               |
| `open_url`             | Opens URLs                                       |
| `close_app`            | Closes applications                              |
| `press_key`            | Sends keyboard key presses                       |
| `hotkey`               | Sends keyboard shortcuts                         |
| `focus_app`            | Focuses an application                           |
| `type_text`            | Types text into an application                   |
| `open_default_browser` | Opens the default browser                        |
| `mouse_click`          | Performs mouse clicks                            |
| `mouse_move`           | Moves the mouse pointer                          |
| `mouse_double_click`   | Performs double clicks                           |
| `scroll`               | Scrolls the active interface                     |
| `screenshot`           | Captures the primary monitor                     |

### Web Search

The Web Search tool uses the Tavily Search API.

It supports:

- General web searches.
- News-oriented searches.
- Structured search results.
- Search-depth configuration.
- Retrieval of additional page content for news searches.

News relevance and result quality are still being refined.

### Geocoding

The Geocoding tool converts a location name into coordinates.

```text
Location Name
     ↓
Geocoding API
     ↓
Latitude + Longitude
```

### Weather

The Weather tool uses Open-Meteo.

```text
City
  ↓
Geocoding
  ↓
Latitude + Longitude
  ↓
Open-Meteo API
  ↓
Weather Information
```

Available information can include:

- Temperature.
- Humidity.
- Weather conditions.
- Wind speed.
- Local time.

### Currency

The Currency tool uses Frankfurter to retrieve exchange-rate information.

Example input:

```json
{
  "from": "USD",
  "to": "EUR"
}
```

The result includes:

- Source currency.
- Target currency.
- Exchange rate.
- Rate date.

---

# 🤖 Agent Architecture

The Agent is the decision-making layer of 9Jarvis.

It determines whether a request requires a tool, selects the appropriate action, evaluates the returned result, and decides whether to continue or finish.

## Agent Execution Loop

```text
User Request
     ↓
Agent
     ↓
Decision
     ↓
Tool Call
     ↓
Validation
     ↓
Execution
     ↓
Tool Result
     ↓
Agent
     ↓
Continue / Finish
```

## Supported Actions

### Tool Execution

A tool action contains the selected tool and its arguments.

Conceptual example:

```json
{
  "action": "tool",
  "tool": "calculator",
  "input": "25 * 4"
}
```

### Finish

When the Agent determines that the task is complete, it returns a finish action.

```json
{
  "action": "finish"
}
```

## Execution Protection

Current configuration:

```js
MAX_STEPS = 5;
MAX_RETRIES = 2;
```

These limits help prevent:

- Infinite execution loops.
- Unnecessary repeated tool calls.
- Excessive retries.
- Uncontrolled multi-step execution.
- Invalid action processing.

## Agent History

The Agent maintains execution history containing information such as:

```text
Step
Tool
Input
Success
Result
```

For computer interaction, the history can also include screenshot and Vision-related information.

---

# 🖥️ Computer Control

Computer Control is the current major development area.

The objective is to let 9Jarvis observe the desktop, identify interface elements, and perform actions through the operating system.

## Screenshot Capture

The current implementation captures the primary monitor.

Example:

```text
Screenshot
Width: 1920
Height: 1080
```

The captured image can be passed to the Vision model for analysis.

## Vision Analysis

Current Vision model:

```text
deepseek/deepseek-v4.1-flash
```

The model analyzes screenshots and identifies visible interface elements.

Example response:

```json
{
  "description": "A YouTube page",
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

The system uses bounding boxes to represent detected elements.

A click position can then be calculated from the detected element's coordinates.

## Mouse and Keyboard Interaction

Mouse tools:

```text
mouse_click
mouse_move
mouse_double_click
scroll
```

Keyboard tools:

```text
press_key
hotkey
type_text
```

Coordinates are validated against the primary screen dimensions before mouse actions are executed.

## Application Interaction

Application-related tools:

```text
open_app
close_app
focus_app
open_url
open_default_browser
```

PowerShell scripts are also used for testing and supporting certain Windows interaction capabilities.

---

# 🔬 Computer Control Pipeline

Current Vision-based interaction:

```text
User Request
     ↓
Agent
     ↓
Screenshot
     ↓
Vision Analysis
     ↓
UI Element Detection
     ↓
Bounding Box
     ↓
Click Position
     ↓
Mouse Action
     ↓
Tool Result
     ↓
Agent
     ↓
Finish
```

Example:

```text
User:
"روی Kaydet کلیک کن"

Agent:
Requests a screenshot

Vision:
Analyzes the screenshot

Detection:
Finds the Kaydet element

Agent:
Selects the required mouse action

Tool:
Executes the click
```

The complete interaction flow has been tested. However, detection accuracy and reliable interaction across different applications still require improvement.

---

# 🎯 Next Milestone: Windows UI Automation

Vision-based detection is useful, but it relies on image analysis and estimated screen coordinates.

The next improvement is investigating **Windows UI Automation (UIA)**.

UI Automation can expose native interface information, including:

- Element names.
- Control types.
- Bounding rectangles.
- Available control patterns.
- Element properties.

## Target Architecture

```text
User Request
     ↓
Agent
     ↓
Windows UI Automation
     ↓
Element Found?
    /       \
  Yes        No
   ↓          ↓
Native UI   Screenshot
Element        ↓
   ↓         Vision
Direct Action  ↓
            Bounding Box
                ↓
             Mouse Action
```

The intended approach is:

1. Prefer Windows UI Automation for native controls.
2. Retrieve the exact element and its properties.
3. Use native control patterns when available.
4. Use Vision when UI Automation cannot identify the required element.
5. Validate the result after executing an action.

This hybrid architecture should reduce unnecessary dependence on estimated coordinates.

---

# 🏗️ System Architecture

The main application coordinates the different layers.

```text
┌──────────────────────┐
│         User         │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│       main.js        │
│  Application Core    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│        Memory        │
│  Store / Retrieve    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│        Agent         │
│  Decision Making     │
│  Native Function Call│
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│     Tool Validator   │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│        Tools         │
│   Execute Actions    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│     Tool Results     │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│     Agent / LLM      │
│  Continue or Finish  │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│    Final Response    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│         User         │
└──────────────────────┘
```

## Component Responsibilities

| Component                | Responsibility                                 |
| ------------------------ | ---------------------------------------------- |
| `main.js`                | Coordinates the application                    |
| `config.js`              | Loads and manages configuration                |
| `memory.js`              | Stores and retrieves persistent memory         |
| `memoryDetector.js`      | Detects information that may need to be stored |
| `memoryQueryDetector.js` | Detects memory-related queries                 |
| `agent.js`               | Makes decisions and manages execution          |
| `toolValidator.js`       | Validates tool calls and arguments             |
| `tools.js`               | Implements tool operations                     |

The main architectural principle is separation of responsibilities.

```text
Memory
  → Stores and retrieves information

Agent
  → Decides what action should happen

Tool Validator
  → Validates requested operations

Tools
  → Perform computational and external actions

Tool Results
  → Provide actual execution data

LLM
  → Understands language and generates responses

main.js
  → Coordinates the application
```

---

# 📁 Project Structure

The main project structure:

```text
9jarvis/
│
├── .env
├── .env.example
├── .gitignore
│
├── README.md
├── CHANGELOG.md
│
├── package.json
├── package-lock.json
│
├── config.js
├── main.js
├── agent.js
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
├── test-agent.js
│
└── PowerShell test scripts
```

The structure may evolve as new modules and tests are introduced.

---

# ⚙️ Installation

## Requirements

- Windows.
- Node.js.
- npm.
- Git.
- OpenRouter API key.
- Tavily API key for Web Search.

Additional external services may be introduced as the project evolves.

## 1. Clone the Repository

```bash
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a local environment file:

```powershell
Copy-Item .env.example .env
```

Configure the required API keys:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavily_api_key
```

Never commit `.env` or expose API keys.

---

# 💬 Usage

Start the application:

```bash
node main.js
```

Expected startup message:

```text
🤖 9Jarvis is ready...
💬 Type...
```

## Example Interactions

### Conversation

```text
You: سلام
9Jarvis: سلام! چطور می‌تونم کمک کنم؟
```

### Calculator

```text
You: 23 * 17
9Jarvis: 391
```

### Memory

```text
You: اسم من چیه؟
9Jarvis: اسم شما سینا است.
```

### Time

```text
You: ساعت چنده؟
9Jarvis: ...
```

### Weather

```text
You: هوای Berlin چطوره؟
9Jarvis: ...
```

### Computer Control

```text
You: روی Kaydet کلیک کن
```

The Agent can inspect the screen, identify the requested element, and select an appropriate computer interaction tool.

Exit:

```text
You: exit
```

---

# 🧪 Testing & Validation

9Jarvis is developed incrementally. Components are tested independently before deeper integration.

## Agent Tests

The dedicated Agent test suite has passed:

```text
Parser Tests:  8/8
Native Tests: 11/11
-------------------
Total:       19/19
```

These tests cover the tested parsing and native tool-calling behavior.

Run the Agent test suite:

```bash
node test-agent.js
```

## Code Validation

JavaScript syntax checks can be performed with:

```bash
node --check main.js
node --check agent.js
node --check tools.js
node --check toolValidator.js
node --check memory.js
```

## Validation Overview

| Component               | Current Validation                              |
| ----------------------- | ----------------------------------------------- |
| AI Core                 | ✅ Implemented and tested                       |
| Memory                  | ✅ Core operations tested                       |
| Native Function Calling | ✅ Tested                                       |
| Tool Validation         | ✅ Implemented and tested                       |
| Calculator              | ✅ Tested                                       |
| Time & Date             | ✅ Tested                                       |
| Web Search              | 🟡 Functional; relevance improvements ongoing   |
| Geocoding               | ✅ Tested                                       |
| Weather                 | ✅ Tested                                       |
| Currency                | ✅ Tested                                       |
| Application Control     | ✅ Tested                                       |
| Keyboard Control        | ✅ Tested                                       |
| Mouse Control           | ✅ Tested                                       |
| Screenshot              | ✅ Tested                                       |
| Vision Analysis         | ✅ Tested                                       |
| Computer Control        | 🟡 Functional; reliability improvements ongoing |
| Windows UI Automation   | 🟡 Under investigation                          |

A component being implemented does not necessarily mean that every possible application, input, or operating-system scenario has been validated.

---

# 🗺️ Roadmap

## Phase 01 — Environment

- [x] Node.js setup
- [x] npm setup
- [x] Project structure
- [x] Git initialization
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
- [x] Multiple memory values
- [x] Duplicate prevention
- [x] User memory
- [x] Project memory
- [x] Memory context generation
- [x] Relevant memory retrieval
- [x] Memory pollution prevention

## Phase 04 — Tools

- [x] Modular Tool architecture
- [x] Tool validation
- [x] Tool execution
- [x] Calculator
- [x] Time
- [x] Date
- [x] Random number
- [x] Web Search
- [x] Geocoding
- [x] Weather
- [x] Currency
- [x] Application control
- [x] URL control
- [x] Keyboard control
- [x] Mouse control
- [x] Screenshot capture

## Phase 05 — Agent

- [x] Agent execution loop
- [x] Native Function Calling
- [x] Tool selection
- [x] Tool argument handling
- [x] Tool validation
- [x] Tool execution
- [x] Tool history
- [x] Finish action
- [x] Retry handling
- [x] Maximum step protection
- [x] Invalid response handling
- [x] Repeated execution prevention
- [x] Tool result processing
- [x] Multi-step execution
- [x] Computer-control integration

## Phase 06 — Computer Control

- [x] Screenshot capture
- [x] Primary-monitor capture
- [x] Screen-coordinate validation
- [x] Mouse click
- [x] Mouse movement
- [x] Double click
- [x] Scrolling
- [x] Keyboard actions
- [x] Application actions
- [x] Vision screenshot analysis
- [x] Vision element detection
- [x] Bounding-box extraction
- [x] Agent integration
- [ ] Improve click accuracy
- [ ] Investigate Windows UI Automation
- [ ] Use UI Automation as the primary method where possible
- [ ] Keep Vision as a fallback
- [ ] Validate actions through post-action inspection
- [ ] Test different applications and UI types
- [ ] Complete Computer Control validation

## Phase 07 — Automation

- [ ] Scheduled tasks
- [ ] Triggers
- [ ] Recurring actions
- [ ] Background workflows
- [ ] Event-based automation
- [ ] Automation management
- [ ] Task execution monitoring

## Phase 08 — Voice

- [ ] Speech-to-text
- [ ] Text-to-speech
- [ ] Voice commands
- [ ] Continuous voice interaction
- [ ] Voice activity detection

## Phase 09 — GUI

- [ ] Graphical interface
- [ ] Desktop application
- [ ] Conversation interface
- [ ] Visual assistant
- [ ] Animated Jarvis interface
- [ ] Tool and task monitoring
- [ ] Hardware and device integration

---

# 🔄 Development Workflow

The project follows an incremental development cycle:

```text
Understand
    ↓
Implement
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

The core development rule:

> One Change → Test → Inspect Output → Next Change

Each new capability should be tested before additional complexity is introduced.

This approach helps identify problems early and keeps the architecture easier to understand, debug, and maintain.

---

# 📜 Development Principles

## 1. Modular Architecture

Every component should have a clear responsibility and a well-defined interface.

## 2. Incremental Development

Build the system layer by layer instead of attempting to implement the final assistant at once.

## 3. Test Before Expanding

Test new functionality independently before integrating it into the larger system.

## 4. Reusable Components

Models, tools, APIs, and subsystems should be replaceable without requiring a complete architectural rewrite.

## 5. Local Data Control

Where practical, user memory and application data should remain locally accessible and under the user's control.

## 6. Simple Before Advanced

Prefer a working and understandable implementation over unnecessary complexity.

## 7. Reuse Existing Technology

Build the core architecture and important logic while using mature libraries, APIs, and operating-system capabilities where appropriate.

## 8. Controlled Execution

Tool execution should be validated, bounded, and observable.

## 9. Evidence-Based Development

A feature should be considered complete only when its behavior has been tested and its results inspected.

---

# 📌 Current Mission

The immediate mission is to improve Computer Control reliability.

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

The next milestone:

```text
Computer Control
       ↓
Windows UI Automation
       ↓
Native UI Element Detection
       ↓
Reliable UI Actions
       ↓
Vision Fallback
       ↓
Post-Action Verification
```

Once Computer Control reaches a reliable level, development can move toward Automation, Voice, and GUI.

The long-term objective is to create a modular personal AI assistant that can understand the user, remember useful information, reason about tasks, select tools, execute actions, interact with the computer, and gradually automate parts of the user's digital environment.

---

# 📄 License

9Jarvis is currently developed as a personal open-source project.

A formal license will be added as the project evolves.
