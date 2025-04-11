# Dependency Management Guidelines

## Key Rules

### Never Mock Dependencies

- **IMPORTANT: Never mock dependencies** - Always install actual dependencies via npm. Creating mock implementations of packages is strictly prohibited.

  ```bash
  # Correct way to add a dependency
  npm install package-name

  # For dev dependencies
  npm install -D package-name
  ```

- **Always add dependencies to the appropriate `package.json` file:**

  - Add application-specific dependencies to the respective app's `package.json`
  - Add shared dependencies to the respective package's `package.json`
  - Add development tools used across the monorepo to the root `package.json`

- **Why this matters:**
  - Mocking dependencies creates inconsistencies between development and production
  - Makes it difficult to track what's actually being used in the project
  - Causes maintenance issues when upgrading or auditing dependencies
  - Can lead to unexpected behavior and hard-to-debug issues

### Checking for Mock Dependencies

Before submitting a PR, ensure:

- All required packages are properly installed
- No mock implementations of npm packages exist in your code
- All dependencies are correctly documented in the appropriate `package.json` files
