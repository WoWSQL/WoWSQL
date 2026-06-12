# Contributing to WoWSQL

First off, thank you for considering contributing to WoWSQL! Every contribution helps make this project better for everyone.

## How to Contribute

### Reporting Bugs

Found a bug? Please open a [GitHub Issue](https://github.com/WoWSQL/wowsql/issues/new) with:

- A clear title describing the problem
- Steps to reproduce the issue
- What you expected to happen
- What actually happened
- Your environment (OS, Docker version, WoWSQL version)

### Suggesting Features

Have an idea? Open a [GitHub Issue](https://github.com/WoWSQL/wowsql/issues/new) with the label `enhancement` and describe:

- What problem does this solve?
- How would it work?
- Any alternatives you've considered?

### Pull Requests

1. Fork the repository
2. Create a branch from `main` (`git checkout -b fix/my-fix`)
3. Make your changes
4. Test locally with `docker compose up -d`
5. Commit with a clear message
6. Push to your fork and open a Pull Request

### Code Style

- SQL files: Use uppercase for keywords (`CREATE TABLE`, `SELECT`)
- YAML files: 2-space indentation
- Keep things simple and well-commented

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/wowsql
cd wowsql/docker

# Set up environment
cp .env.example .env

# Start the stack
docker compose up -d

# View logs
docker compose logs -f

# Run a fresh reset
./reset.sh
```

## Code of Conduct

Be kind, respectful, and constructive. We're all here to build something great together.

## Questions?

Join our [Discord](https://discord.gg/wowsql) — we're happy to help!
