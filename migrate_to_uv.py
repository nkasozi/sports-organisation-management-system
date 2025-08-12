#!/usr/bin/env python3
"""
Migration script to help transition from pip to uv.

This script helps migrate an existing pip-based setup to use uv
for faster package management.
"""

import os
import subprocess
import sys
from pathlib import Path


def run_command(command: list, description: str) -> bool:
    """Run a command and return success status."""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stderr:
            print(f"Error: {e.stderr}")
        return False


def check_uv_installed() -> bool:
    """Check if uv is installed."""
    try:
        subprocess.run(["uv", "--version"], check=True, capture_output=True)
        print("✅ uv is already installed")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def install_uv() -> bool:
    """Install uv."""
    print("📦 Installing uv...")

    if sys.platform.startswith('win'):
        # Windows installation
        command = [
            "powershell", "-c",
            "irm https://astral.sh/uv/install.ps1 | iex"
        ]
    else:
        # Unix-like systems
        command = [
            "curl", "-LsSf", "https://astral.sh/uv/install.sh"
        ]

    if sys.platform.startswith('win'):
        return run_command(command, "Installing uv on Windows")
    else:
        # For Unix-like systems, we need to pipe to sh
        try:
            curl_process = subprocess.Popen(
                ["curl", "-LsSf", "https://astral.sh/uv/install.sh"],
                stdout=subprocess.PIPE
            )
            sh_process = subprocess.Popen(
                ["sh"],
                stdin=curl_process.stdout,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            curl_process.stdout.close()
            _, stderr = sh_process.communicate()

            if sh_process.returncode == 0:
                print("✅ uv installed successfully")
                return True
            else:
                print(f"❌ uv installation failed: {stderr.decode()}")
                return False
        except Exception as e:
            print(f"❌ uv installation failed: {e}")
            return False


def migrate_to_uv() -> bool:
    """Migrate from pip to uv."""
    success = True

    # Check if pyproject.toml exists
    if not Path("pyproject.toml").exists():
        print("❌ pyproject.toml not found. Please ensure you're in the project root.")
        return False

    # Install project with uv
    if not run_command(
        ["uv", "pip", "install", "-e", ".[all]"],
        "Installing project dependencies with uv"
    ):
        success = False

    return success


def verify_migration() -> bool:
    """Verify the migration was successful."""
    print("\n🔍 Verifying migration...")

    # Test importing main modules
    try:
        subprocess.run(
            ["uv", "run", "python", "-c", "import api.core.domain.entities; print('✅ API modules importable')"],
            check=True,
            capture_output=True
        )
    except subprocess.CalledProcessError:
        print("❌ Failed to import API modules")
        return False

    # Test running pytest
    try:
        subprocess.run(
            ["uv", "run", "pytest", "--version"],
            check=True,
            capture_output=True
        )
        print("✅ pytest available via uv")
    except subprocess.CalledProcessError:
        print("❌ pytest not available via uv")
        return False

    return True


def main():
    """Main migration function."""
    print("🚀 Migrating from pip to uv...")
    print("=" * 50)

    # Check if we're in the right directory
    if not Path("pyproject.toml").exists():
        print("❌ This doesn't appear to be the project root directory.")
        print("Please run this script from the SportsOrganisationManagementSystem directory.")
        sys.exit(1)

    # Step 1: Check if uv is installed
    if not check_uv_installed():
        print("📦 uv is not installed. Installing...")
        if not install_uv():
            print("❌ Failed to install uv. Please install it manually:")
            print("https://github.com/astral-sh/uv#installation")
            sys.exit(1)

    # Step 2: Migrate to uv
    if not migrate_to_uv():
        print("❌ Migration failed!")
        sys.exit(1)

    # Step 3: Verify migration
    if not verify_migration():
        print("❌ Migration verification failed!")
        sys.exit(1)

    print("\n🎉 Migration completed successfully!")
    print("\nNext steps:")
    print("1. You can now use 'uv run' to execute Python commands")
    print("2. Use 'python run_tests.py --install-deps' to install test dependencies")
    print("3. Use 'python run_tests.py --all' to run tests")
    print("4. See UV_SETUP.md for more uv usage information")

    # Optional: suggest removing old venv
    if Path("venv").exists() or Path(".venv").exists():
        print("\n💡 Optional: You can now remove your old virtual environment:")
        print("rm -rf venv")  # or .venv


if __name__ == "__main__":
    main()
