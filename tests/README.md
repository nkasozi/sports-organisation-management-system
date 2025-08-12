# Testing Guide

This document explains how to run tests for the Sports Organisation Management System using uv for fast package management.

## Prerequisites

Make sure you have Python 3.8+ and uv installed:

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install project with test dependencies
uv pip install -e .[test,dev]
```

## Test Structure

The test suite is organized into the following structure:

````
tests/
├── conftest.py                 # Test configuration and fixtures
├── test_organization_service.py # Unit tests for organization service
├── test_competition_service.py  # Unit tests for competition service
├── test_game_service.py         # Unit tests for game service
├── test_api_routes.py          # Integration tests for API routes
├── test_dependency_injection.py # Tests for DI container
└── requirements-test.txt       # Legacy test dependencies (use pyproject.toml)
```## Running Tests

### Quick Start

Use the test runner script for common testing tasks:

```bash
# Install test dependencies
python run_tests.py --install-deps

# Run all tests with coverage
python run_tests.py --all

# Run only unit tests
python run_tests.py --unit

# Run only integration tests
python run_tests.py --integration

# Run a specific test file
python run_tests.py --test tests/test_organization_service.py

# Run code quality checks
python run_tests.py --quality
````

### Manual Testing with uv

You can also run tests manually using uv and pytest:

```bash
# Run all tests
uv run pytest tests/

# Run with coverage
uv run pytest tests/ --cov=api --cov-report=html

# Run specific test file
uv run pytest tests/test_organization_service.py

# Run specific test function
uv run pytest tests/test_organization_service.py::TestOrganizationManagementService::test_create_organization_successfully_returns_organization

# Run tests with verbose output
uv run pytest tests/ -v

# Run tests matching a pattern
uv run pytest tests/ -k "test_create"

# Traditional approach (if uv not available)
pytest tests/
pytest tests/ --cov=api --cov-report=html
```

## Test Categories

Tests are marked with categories for selective running:

- `@pytest.mark.unit` - Unit tests for individual components
- `@pytest.mark.integration` - Integration tests for API endpoints
- `@pytest.mark.slow` - Tests that take longer to run

Run specific categories:

```bash
# Run only unit tests
uv run pytest tests/ -m unit

# Run only integration tests
uv run pytest tests/ -m integration

# Exclude slow tests
uv run pytest tests/ -m "not slow"
```

## Test Features

### Dependency Injection Testing

All tests use a test-specific dependency injection container with mock repositories:

```python
def test_create_organization(test_container, mock_organization_repository):
    # The test container automatically provides mocked dependencies
    service = test_container.resolve(OrganizationManagementService)

    # Service uses the mock repository through dependency injection
    result = service.create_organization("Test Org", "Description")

    # Verify the mock was called
    assert mock_organization_repository.get_call_count('create_organization') == 1
```

### Mock Repositories

Mock repositories track method calls and provide test data:

```python
# Add test data
mock_repository.add_test_organization(test_org)

# Check method calls
assert mock_repository.get_call_count('get_organization_by_id') == 1

# Reset counters
mock_repository.reset_call_counts()
```

### Test Data Factory

Use the `TestDataFactory` for consistent test data:

```python
# Create test entities
org = TestDataFactory.create_organization()
competition = TestDataFactory.create_competition(organization_id=org.organization_id)
game = TestDataFactory.create_game(competition_id=competition.competition_id)
```

## Coverage

The test suite aims for 80%+ code coverage. View coverage reports:

```bash
# Generate HTML coverage report
pytest tests/ --cov=api --cov-report=html

# Open coverage report
open htmlcov/index.html
```

## Continuous Integration

Tests are configured to run in CI with:

- Code coverage enforcement (80% minimum)
- Type checking with mypy
- Code formatting verification with black
- Import sorting with isort

## Writing New Tests

### Unit Tests

Follow the AAA pattern (Arrange, Act, Assert):

```python
def test_service_method_with_valid_input_returns_success(self, test_container):
    # Arrange
    service = test_container.resolve(SomeService)
    valid_input = "test_data"

    # Act
    result = service.some_method(valid_input)

    # Assert
    assert result.is_success is True
    assert result.data is not None
```

### Integration Tests

Test the full request/response cycle:

```python
def test_api_endpoint_with_valid_data_returns_success(self, client):
    # Arrange
    request_data = {"name": "Test"}

    # Act
    response = client.post('/api/endpoint',
                          data=json.dumps(request_data),
                          content_type='application/json')

    # Assert
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['success'] is True
```

### Test Naming Convention

Use descriptive test names that follow the pattern:
`test_[method_under_test]_[scenario]_[expected_outcome]`

Examples:

- `test_create_organization_with_valid_data_returns_success`
- `test_get_organization_when_not_exists_returns_failure`
- `test_update_game_score_with_negative_score_returns_validation_error`

## Debugging Tests

### Verbose Output

```bash
pytest tests/ -v -s
```

### Debugging Specific Test

```bash
pytest tests/test_organization_service.py::TestOrganizationManagementService::test_create_organization_successfully_returns_organization -v -s
```

### Print Statements

Add print statements or use `pytest.set_trace()` for debugging:

```python
def test_something(self):
    import pytest
    result = some_function()
    pytest.set_trace()  # Debugger breakpoint
    assert result.is_success
```

## Common Issues

### Import Errors

If you see import errors, ensure the Python path includes the project root:

```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest tests/
```

### Fixture Scope

Fixtures are function-scoped by default. For expensive setup, use session or module scope:

```python
@pytest.fixture(scope="module")
def expensive_fixture():
    # Setup that takes time
    yield result
    # Cleanup
```

### Mock Isolation

Ensure mocks are reset between tests by using fresh fixtures or reset methods.

## Performance

For faster test runs:

```bash
# Run tests in parallel (requires pytest-xdist)
pip install pytest-xdist
pytest tests/ -n auto

# Skip slow tests during development
pytest tests/ -m "not slow"
```
