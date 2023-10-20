# Contributing to its-i18n

## Code of conduct

 This project has adopted the Contributor Covenant as its Code of Conduct, and we expect project
participants to adhere to it. Please read the full text so that you can understand what actions
will and will not be tolerated.

## Open Development

 All work on its-i18n happens directly on GitHub. Both team members and contributors send pull
requests which go through the same review process

## Versioning Policy

 its-i18n follows semantic versioning. We release patch versions for critical bugfixes, minor
versions for new features or non-essential changes, and major versions for any breaking changes.
 When we make breaking changes, we also introduce deprecation warnings in a minor version so that
our users learn about the upcoming changes and migrate their code in advance.

Every significant change is documented in the CHANGELOG.md file.

## Branch Organization

 Submit all changes directly to the main branch. We don’t use separate branches for development or
for upcoming releases. We do our best to keep main in good shape, with all tests passing.

 Code that lands in main must be compatible with the latest stable release. It may contain additional
features, but no breaking changes. We should be able to release a new minor version from the tip of
main at any time

## Bugs

### Where to Find Known Issues

 We are using GitHub Issues for our public bugs. We keep a close eye on this and try to make it
clear when we have an internal fix in progress. Before filing a new task, try to make sure your
problem doesn’t already exist.


## Contribution Prerequisites

- You have Node installed at latest stable.
- You are familiar with Git.

## Development Workflow

After cloning its-i18n, you can run several commands, the first time you run any of the following commands, it will automatically install the dependencies.

- `npm run lint` checks the code style.
- `npm run linc` is like `npm run lint` but faster because it only checks files that differ in your branch.
- `npm test` runs all unit tests.
- `npm run build` creates a build folder with dist and documentation.
- `npm run dev-server` launch a server for development
- `npm run dev` setups the whole development environment.
  - builds the project
  - runs tests
  - launch the development server
  - opens documentation in a web browser
  - watch for file changes so that it build, test, check code styles and refresh documentation in the browser
- `npm run help` shows the list of supported tasks with their description
- `npm run build:github-action` is like `npm run build` but checks the style code before building, used for github actions
