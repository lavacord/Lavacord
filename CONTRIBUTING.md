# Contributing to Lavacord

Thank you for your interest in contributing to **Lavacord**! 🚀  
We welcome all help, whether it's bug reports, feature requests, code contributions, or documentation improvements.

---

## Table of Contents

- [Workflow](#workflow)
- [How to Contribute](#how-to-contribute)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Community Standards](#community-standards)
- [License](#license)

---

## Workflow

1. Fork and clone this repository.
2. Create a new branch in your fork based off the **master** branch.
3. Make your changes.
4. Commit your changes, and push them.
5. Submit a Pull Request!

## How to Contribute

1. **Fork the Repository**  
   Click the "Fork" button on [GitHub](https://github.com/lavacord/Lavacord).

2. **Clone Your Fork**
   ```sh
   git clone https://github.com/<your-username>/Lavacord.git
   cd Lavacord
   ```

3. **Create a New Branch**  
   Branches should be descriptive and relate to your change:
   ```sh
   git checkout -b fix/your-branch-name
   ```

4. **Install Dependencies**
   ```sh
   npm install
   # or
   yarn install
   ```

5. **Make Your Changes**  
   Write code, tests, and/or documentation as needed.

6. **Test Your Changes**  
   Ensure the code passes all tests and builds:
   ```sh
   npm test
   # or
   yarn test
   ```

7. **Commit and Push**
   ```sh
   git add .
   git commit -m "feat: Add amazing feature"
   git push origin fix/your-branch-name
   ```

8. **Submit a Pull Request**
   - Go to your fork on GitHub and click "Compare & pull request".
   - Fill out the PR template and describe your changes.

---

## Code Style

- Use [Prettier](https://prettier.io/) for code formatting.
- Write clear, concise, and descriptive code.
- Prefer TypeScript, but ensure JavaScript compatibility.
- Include [TSDoc](https://tsdoc.org/) comments for public APIs.

---

## Commit Messages

- Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `fix:`, `feat:`, `chore:`).
- Example: `fix(manager): handle reconnect on node failure`

---

## Pull Requests

- Keep PRs focused and minimal.
- Reference related issues with `Fixes #issue_number`.
- Ensure all CI checks pass.
- Be ready to respond to review feedback.

---

## Community Standards

- Be respectful and inclusive.
- No harassment, discrimination, or toxic behavior.
- For help or general discussion, join our [Discord server](https://discord.gg/wXrjZmV).

---

## License

By contributing, you agree your contributions will be licensed under the [Apache License 2.0](./LICENSE).

---

Happy coding! 💙