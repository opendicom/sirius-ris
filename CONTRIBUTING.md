# Contributing to Sirius RIS


Thank you for your interest in contributing to **Sirius RIS**.

This project uses a simple Git workflow designed to keep the `master` branch stable while allowing collaborative development.

## Workflow

- `master` contains only stable releases.
- `develop` is the integration branch.
- Never work directly on `master` or `develop`.
- Create a new branch for every task using one of these prefixes:
  - `feature/*`          for new functionality.
  - `fix/*`                  for bug fixes.
  - `improvement/*`   for small enhancements.
  - `docs/*`                for documentation changes.
- All changes must be submitted through a Pull Request.

## Before you start

```bash
git fetch origin
git checkout develop
git pull origin develop
```

Create your working branch:

```bash
git checkout -b feature/your-feature-name
```

## Development

Commit as needed:

```bash
git add .
git commit -m "Describe your change"
```

Push your branch:

```bash
git push -u origin feature/your-feature-name
```

## Pull Request

Open a Pull Request with:

- **Base:** `develop`
- **Compare:** `feature/your-feature-name`

Address any requested changes by pushing additional commits to the same branch. Do **not** create a new Pull Request.

## Merge policy

Maintainers will review:

- Code quality
- Correctness
- Impact on the project

Approved Pull Requests are merged using **Squash and Merge**. Feature branches are deleted automatically after merging.

## Releases

Only maintainers merge `develop` into `master` and create version tags.

## Golden Rules

1. Never commit directly to `master`.
2. Never commit directly to `develop`.
3. One feature branch per task.
4. Every change goes through a Pull Request.
5. Stable releases are tagged.
