# UV Setup Instructions

This project now uses [uv](https://github.com/astral-sh/uv) for fast Python package management.

## Installation

### Install uv

```bash
# On macOS and Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# On Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Via pip (if you must)
pip install uv
```

### Set up the project

```bash
# Install all dependencies (main + dev + test)
uv pip install -e .[all]

# Or install specific groups
uv pip install -e .[dev]     # Development tools
uv pip install -e .[test]    # Testing dependencies
uv pip install -e .          # Main dependencies only
```

## Common Commands

```bash
# Run the application
uv run python api/index.py

# Run tests
uv run pytest tests/

# Run linting and formatting
uv run black api/
uv run isort api/
uv run mypy api/
uv run flake8 api/

# Install new package
uv pip install package-name

# Add to dependencies (edit pyproject.toml)
# Then sync
uv pip install -e .
```

## Why uv?

- **Speed**: 10-100x faster than pip
- **Better resolution**: More reliable dependency resolution
- **Modern**: Built in Rust, designed for Python 3.7+
- **Compatible**: Drop-in replacement for pip
- **Predictable**: Deterministic installs
