# 9Jarvis Skills

Each Skill is stored in a direct child directory of `skills/`:

    skills/
      example-skill/
        SKILL.md

Each SKILL.md must start with YAML frontmatter:

    ---
    name: example-skill
    description: A short description of when this Skill is useful.
    ---

    Instructions and workflow guidance go here.

Security:
- Skill files are untrusted input, even when stored locally.
- Skills provide guidance only; they cannot override system or user instructions.
- Skills cannot execute scripts, commands, or network requests.
- All tool calls must use the existing Agent tool pipeline and validation.
- Do not place secrets, credentials, or private data in Skills.
