# Changelog

All notable changes to 9Jarvis are documented here.

The project is currently under active development.

---

## [0.1.0] — 2026-09-25

### Added

- Initial 9Jarvis project structure
- Node.js application
- OpenRouter API integration
- OpenAI SDK integration
- Environment-based configuration using `dotenv`
- Persian language support
- Terminal-based conversation
- Custom system prompt
- 9Jarvis identity and behavior
- Basic error handling
- Git version control
- GitHub repository

### Security

- Moved API credentials to `.env`
- Added `.env` to `.gitignore`
- Added `.env.example` for safe configuration sharing

### Documentation

- Added project README
- Added initial architecture documentation
- Added development roadmap
- Added changelog

---

## [0.2.0] — 2026-09-27

### Smart Memory

- Added persistent local memory
- Added JSON-based memory storage
- Added automatic memory detection
- Added memory categorization
- Added memory key/value storage
- Added support for multiple memory values
- Added memory query detection
- Added memory retrieval
- Added relevant memory selection
- Added memory context generation
- Added project information storage
- Added user preference storage

### Memory Testing

- Tested user name storage and retrieval
- Tested programming language preferences
- Tested project information
- Tested multiple memory values
- Tested memory queries
- Tested non-memory questions
- Fixed memory pollution issues
- Improved memory update handling

### Security

- Kept personal memory data outside version control

---

## [0.3.0] — 2026-09-28

### Tools

- Added tool detection layer
- Added tool validation layer
- Added initial tool execution architecture
- Added calculator tool
- Added time tool
- Added date tool
- Added random tool
- Added web search tool
- Added geocoding tool
- Added weather tool
- Added currency exchange tool

### Computer Interaction Tools

- Added application opening
- Added URL opening
- Added application closing
- Added application focus
- Added default browser opening
- Added keyboard input
- Added hotkey support
- Added text typing
- Added mouse click
- Added mouse movement
- Added mouse double-click
- Added scrolling
- Added screenshot capture

### Tool Safety

- Added tool validation
- Added unknown-tool rejection
- Added input validation
- Added basic tool error handling
- Added screen coordinate validation

### Testing

- Tested calculator execution
- Tested time and date tools
- Tested random number generation
- Tested tool detection
- Tested tool validation
- Tested application and browser controls

---

## [0.4.0] — 2026-09-28

### Agent

- Added Agent architecture
- Added Agent system prompt
- Added tool selection through the Agent
- Added multi-step tool execution
- Added Agent history
- Added tool execution results to Agent context
- Added Agent completion handling
- Added retry handling
- Added maximum step protection
- Added request timeout handling
- Added integration between Agent and existing tools

### Agent Improvements

- Fixed invalid Agent actions
- Fixed empty Agent responses
- Fixed unnecessary repeated tool execution
- Added protection against endless execution loops
- Improved Agent decision-making
- Improved handling of previous tool results

### Testing

- Tested multi-step Agent tasks
- Tested calculator through Agent
- Tested time through Agent
- Tested random tool through Agent
- Tested Agent completion
- Tested error and retry handling

---

## [0.5.0] — 2026-09-30

### Smart Memory Stabilization

- Fixed memory processing issues
- Fixed `processMemory is not a function`
- Improved memory retrieval
- Improved memory context generation
- Improved memory query handling
- Improved multiple-value memory handling
- Improved memory relevance
- Reduced accidental memory storage
- Verified memory isolation from normal questions

### Agent Stabilization

- Fixed Agent execution issues
- Improved Agent history handling
- Improved tool-result processing
- Improved Agent reliability
- Verified Agent and Memory integration

### Testing

- Verified user identity retrieval
- Verified programming-language memory
- Verified project memory
- Verified preference memory
- Verified normal questions without memory retrieval
- Verified tools and Agent together

### Documentation

- Updated project status
- Updated development roadmap
- Updated Phase 03 documentation
- Updated project architecture notes

---

## [0.6.0] — 2026-10-02

### Computer Control

- Started Phase 06 — Computer Control
- Added primary-monitor detection
- Added primary-monitor screenshot capture
- Added screenshot dimensions to tool results
- Added screen coordinate validation
- Integrated computer-control tools with the Agent

### Vision

- Added Vision model integration
- Added `deepseek/deepseek-v4.1-flash`
- Added screenshot analysis
- Added structured Vision JSON output
- Added visible UI element detection
- Added Vision Elements
- Added element bounding-box detection
- Added bounding-box coordinate validation
- Added screenshot dimensions to Vision context
- Added Vision error handling
- Added Vision results to Agent history

### Vision Improvements

- Added structured element coordinates:
  - `x1`
  - `y1`
  - `x2`
  - `y2`
- Added calculated element center coordinates
- Added protection against invalid coordinates
- Improved Vision response handling
- Disabled unnecessary Vision reasoning to prevent incomplete responses

### Agent + Vision

- Connected screenshot capture to Agent
- Connected Vision analysis to Agent
- Added Vision Elements to Agent history
- Added Vision-assisted mouse interaction
- Added bounding-box-based click targeting

### Current Limitation

Vision-based UI interaction is functional but exact click accuracy is not yet reliable enough for all interfaces.

The current architecture is:

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
Click Coordinates
     ↓
Mouse Action
     ↓
Agent
```

### Next Improvement

Investigate Windows UI Automation as the primary method for exact UI interaction, while keeping Vision as a fallback for interfaces that cannot be accessed through UI Automation.

---

# Current Focus

## Phase 06 — Computer Control

Current work includes:

- Improve UI interaction reliability
- Investigate Windows UI Automation
- Detect real UI elements through Windows accessibility/UI APIs
- Use exact UI elements when available
- Use Vision as a fallback
- Improve application interaction
- Test multiple applications
- Validate computer-control workflows

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

---

# Completed Phases

- Phase 01 — Environment
- Phase 02 — AI Core
- Phase 03 — Smart Memory
- Phase 04 — Tools
- Phase 05 — Agent

---

# Roadmap

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

- Multi-step task automation
- Task planning
- Reliable action sequences
- Conditional execution
- Error recovery
- Task state management
- Scheduled tasks

## Phase 08 — Voice

- Speech-to-Text
- Text-to-Speech
- Voice commands
- Voice responses
- Voice-based Agent interaction

## Phase 09 — GUI

- Graphical interface
- Visual conversation
- Agent status
- Memory management
- Tool activity
- Computer-control visualization
- Voice controls

---

# Development Principle

9Jarvis is developed incrementally:

> One Change → Test → Inspect Output → Next Change

The project should reuse existing mature technologies and libraries where appropriate instead of unnecessarily rebuilding functionality from scratch.

Core architecture and important logic should remain under the project's control, while established libraries and services can be used for mature capabilities such as APIs, browser automation, speech processing, and operating-system interfaces.

---

# Current Architecture

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
```

---

# Current Mission

Build 9Jarvis into a modular personal AI assistant capable of understanding the user, remembering relevant information, selecting and executing tools, reasoning across multiple steps, interacting with the computer, automating tasks, communicating through voice, and eventually operating through a graphical interface.
