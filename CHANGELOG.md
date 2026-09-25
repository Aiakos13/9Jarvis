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
- Persistent local memory
- Memory detection
- Memory querying
- Multiple memory values
- Tool detection
- Tool validation
- Time tool
- Basic error handling
- Git version control
- GitHub repository

### Memory

- Added persistent JSON-based memory
- Added automatic memory detection
- Added memory query detection
- Added support for multiple values
- Tested memory persistence and retrieval

### Tools

- Added tool detection layer
- Added tool validation layer
- Added initial tool execution architecture
- Added time tool
- Added validation for unknown tools

### Security

- Moved API credentials to `.env`
- Added `.env` to `.gitignore`
- Added `.env.example` for safe configuration sharing
- Kept personal memory data outside version control

### Documentation

- Added project README
- Added architecture documentation
- Added development roadmap
- Added changelog

---

## Current Focus

### Phase 03 — Assistant

**Smart Memory**

Current work includes:

- Improving automatic memory detection
- Improving memory categorization
- Handling multiple memory values
- Improving memory queries
- Connecting memory more deeply with the assistant context

---

## Next

- Improve Smart Memory
- Improve context management
- Expand the tool system
- Connect tools with assistant decision-making
- Begin Agent architecture
