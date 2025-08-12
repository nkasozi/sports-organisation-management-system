#!/usr/bin/env python3
"""
Test runner script for the Sports Organisation Management System.

This script provides various testing options including unit tests,
integration tests, and coverage reporting.
"""

import sys
import subprocess
import argparse
from pathlib import Path


def run_command(command: list, description: str) -> bool:
    """
    Run a command and return success status.

    Args:
        command: List of command arguments
        description: Description of what the command does

    Returns:
        bool: True if command succeeded, False otherwise
    """
    print(f"\n🔄 {description}...")
    print(f"Running: {' '.join(command)}")

    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed")
        if e.stdout:
            print("STDOUT:", e.stdout)
        if e.stderr:
            print("STDERR:", e.stderr)
        return False


def install_test_dependencies() -> bool:
    """Install test dependencies using uv."""
    print("📦 Installing dependencies with uv...")

    # Install main dependencies
    if not run_command(
        ["uv", "pip", "install", "-e", ".[test,dev]"],
        "Installing project with test and dev dependencies"
    ):
        return False

    return True


def install_main_dependencies() -> bool:
    """Install main project dependencies using uv."""
    return run_command(
        ["uv", "pip", "install", "-e", "."],
        "Installing main project dependencies"
    )


def run_unit_tests(verbose: bool = False) -> bool:
    """Run unit tests only."""
    command = ["uv", "run", "pytest", "tests/", "-m", "unit"]
    if verbose:
        command.append("-v")

    return run_command(command, "Running unit tests")


def run_integration_tests(verbose: bool = False) -> bool:
    """Run integration tests only."""
    command = ["uv", "run", "pytest", "tests/", "-m", "integration"]
    if verbose:
        command.append("-v")

    return run_command(command, "Running integration tests")


def run_all_tests(verbose: bool = False, coverage: bool = True) -> bool:
    """Run all tests with optional coverage."""
    command = ["uv", "run", "pytest", "tests/"]

    if verbose:
        command.append("-v")

    if coverage:
        command.extend(["--cov=api", "--cov-report=term-missing", "--cov-report=html"])

    return run_command(command, "Running all tests")


def run_specific_test(test_path: str, verbose: bool = False) -> bool:
    """Run a specific test file or test function."""
    command = ["uv", "run", "pytest", test_path]
    if verbose:
        command.append("-v")

    return run_command(command, f"Running specific test: {test_path}")
def check_code_quality() -> bool:
    """Run code quality checks."""
    success = True

    # Type checking with mypy
    if not run_command(["uv", "run", "mypy", "api/"], "Type checking with mypy"):
        success = False

    # Code formatting check
    if not run_command(["uv", "run", "black", "--check", "api/"], "Code formatting check"):
        print("💡 Run 'uv run black api/' to fix formatting issues")
        success = False

    # Import sorting check
    if not run_command(["uv", "run", "isort", "--check-only", "api/"], "Import sorting check"):
        print("💡 Run 'uv run isort api/' to fix import sorting")
        success = False

    # Linting check
    if not run_command(["uv", "run", "flake8", "api/"], "Linting check with flake8"):
        print("💡 Fix linting issues reported above")
        success = False

    return success
def main():
    """Main entry point for the test runner."""
    parser = argparse.ArgumentParser(description="Test runner for Sports Organisation Management System")
    parser.add_argument("--install-deps", action="store_true", help="Install test dependencies with uv")
    parser.add_argument("--install-main", action="store_true", help="Install main dependencies with uv")
    parser.add_argument("--unit", action="store_true", help="Run unit tests only")
    parser.add_argument("--integration", action="store_true", help="Run integration tests only")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--test", type=str, help="Run specific test file or function")
    parser.add_argument("--quality", action="store_true", help="Run code quality checks")
    parser.add_argument("--no-coverage", action="store_true", help="Disable coverage reporting")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()

    # If no arguments provided, show help
    if not any(vars(args).values()):
        parser.print_help()
        return

    success = True

    if args.install_deps:
        success &= install_test_dependencies()

    if args.install_main:
        success &= install_main_dependencies()

    if args.unit:
        success &= run_unit_tests(args.verbose)

    if args.integration:
        success &= run_integration_tests(args.verbose)

    if args.all:
        success &= run_all_tests(args.verbose, not args.no_coverage)

    if args.test:
        success &= run_specific_test(args.test, args.verbose)

    if args.quality:
        success &= check_code_quality()

    if success:
        print("\n🎉 All operations completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some operations failed!")
        sys.exit(1)
if __name__ == "__main__":
    main()
