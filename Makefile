.PHONY: help install install-dev dev build clean clean-dist test migrate check fix

venv:
	ifeq ("$(wildcard '/venv')", "")
		python -m venv venv
	endif
	source venv/bin/activate

help:
	@echo "Available commands:"
	@echo "  Development:"
	@echo "    install       - Install Python dependencies"
	@echo "    dev           - Run development server"
	@echo "    build         - Build frontend assets for Pyramid"
	@echo ""
	@echo "  Testing:"
	@echo "    test         - Run backend tests"
	@echo ""
	@echo "  Database:"
	@echo "    migrate       - Drop and recreate database"
	@echo ""
	@echo "  Code Quality:"
	@echo "    check         - Check code quality (formatting, linting, type checking)"
	@echo "    fix           - Format code and run all quality checks"
	@echo ""
	@echo "  Utilities:"
	@echo "    clean         - Clean cache and build files"

install:
	@echo "Installing Python dependencies..."
	@poetry install

dev: build
	@echo "Starting development server..."
	@python run.py

build: clean-dist
	@echo "Building frontend assets..."
	@cd frontend && yarn run build
	@echo "Built frontend assets"
	@echo "Moving built assets into backend package..."
	@mv ./frontend/dist ./flashly/
	@echo "Moved frontend assets into backend package"

test:
	@echo "Running backend tests..."
	@pytest --cov -v

migrate:
	@echo "Dropping and recreating database..."
	@python ./migrations/scripts/dropdb.py && python ./migrations/scripts/createdb.py

lint:
	@echo "Running code quality checks..."
	@echo "Checking code formatting with Black..."
	@poetry run black --check flashly/ tests/ migrations/
	@echo "Linting code with Flake8..."
	@poetry run flake8 flashly/ tests/ migrations/
	@echo "Type checking with MyPy..."
	@poetry run mypy flashly/
	@echo "All code quality checks passed!"

format:
	@echo "Formatting code with Black..."
	@poetry run black flashly/ tests/ migrations/
	@echo "Running code quality checks..."
	@echo "Formatting with Black..."
	@poetry run black flashly/ tests/ migrations/
	@echo "Linting code with Flake8..."
	@poetry run flake8 flashly/ tests/ migrations/
	@echo "Type checking with MyPy..."
	@poetry run mypy flashly/
	@echo "Code formatted and all checks passed!"

clean:
	@echo "Cleaning cache and build files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@rm -rf .pytest_cache .coverage
	@$(MAKE) clean-dist

clean-dist:
	@echo "Cleaning built frontend assets..."
	@rm -rf ./flashly/dist
