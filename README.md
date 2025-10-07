# Clarion 🚀

> Your customizable, AI-powered co-development platform, empowering developers to build, customize, and deploy specialized AI agents tailored to any coding workflow.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Go Version](https://img.shields.io/badge/go-1.22+-blue.svg)
![Node Version](https://img.shields.io/badge/node-18.x+-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

## The Clarion Philosophy

Clarion aims to transform LLMs from powerful but unreliable text generators into predictable, configurable, and code-aware workflow automation tools for developers.

Many AI development tools are like buying a high-performance, pre-built race car. They are incredibly fast and ready to go right out of the box for specific, common tasks.

**Clarion**, however, is like being given a professional garage with an engine, chassis, and a massive toolkit. It empowers you to build a race car, a dragster, or an off-road vehicle tailored perfectly to your exact specifications, giving you complete control over your AI-powered development workflow.

## Table of Contents

- [Key Features](#-key-features)
- [How it Works](#-how-it-works)
  - [Frontend](#frontend-tauri-react-typescript-tailwindcss)
  - [Backend](#backend-go)
- [Getting Started](#️-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Contributing](#-contributing)
- [License](#-license)

## Screenshots

![output2](https://github.com/user-attachments/assets/86df0625-ce8e-49a1-b960-04d33db03cec)



## ✨ Key Features

-   **Customizable AI Agents:** Create, manage, and customize specialized AI Agents with unique system prompts, context settings, and structured output schemas.
-   **Flexible LLM Integration:** Connect to popular LLM providers (OpenAI, Anthropic, Google Gemini) using your own API keys, with full control over model selection and generation settings.
-   **Granular Codebase Context:** Precisely control which files and directories are included in the AI's context using powerful glob patterns, with a real-time preview of included files.
-   **Predictable Structured Output:** Design custom JSON schemas for AI responses, ensuring reliable and parseable output for integrating AI into your development workflows. Includes both visual and code-based schema editors.
-   **Interactive File System & Diffing:** Browse your local project, select files for AI context, and review AI-generated changes with an integrated side-by-side diff viewer before applying them.
-   **Integrated Terminal:** Execute shell commands and manage your project directly within the application.
-   **Agent Prompt Simulator:** Inspect the exact prompt sent to the LLM and simulate responses to quickly test and debug agent behavior without incurring API costs.
-   **Extensible & Local-First:** Built with Go (backend) and TypeScript/React (Tauri frontend) for a performant desktop experience, designed for easy extension and community contributions.

## 🏗️ How it Works

Clarion is designed with a robust, local-first architecture, separating the user interface from the core logic to ensure performance, security, and extensibility. It comprises two main components: a desktop frontend application and a powerful Go backend server.

### Frontend (Tauri, React, TypeScript, TailwindCSS)

The frontend is a modern web application built with React and TypeScript, styled using TailwindCSS for a sleek and responsive user experience. It runs as a lightweight, performant desktop application thanks to Tauri.

-   **Role:** Provides the interactive graphical user interface (GUI) for users to manage projects, configure AI agents, interact with LLMs, and view results.
-   **Key Technologies:**
    -   **Tauri:** Wraps the web frontend into a native desktop application, offering a small footprint, enhanced security, and direct access to native system functionalities.
    -   **React & TypeScript:** For building dynamic and type-safe UI components.
    -   **TailwindCSS:** For utility-first styling, enabling rapid and consistent UI development.
    -   **Zustand:** A fast and scalable state management solution for the application.
    -   **CodeMirror:** Powers the advanced code editing and viewing experiences, including syntax highlighting.
    -   **React Resizable Panels:** For flexible and customizable layout management.
-   **Responsibilities:**
    -   Displaying the project file tree and file contents.
    -   Providing interfaces for agent persona and LLM configuration.
    -   Rendering conversation history and AI responses, including code diffs.
    -   Offering an interactive terminal for shell commands.
    -   Communicating with the local Go backend via HTTP REST APIs and WebSockets.

### Backend (Go)

The backend is a standalone, locally running server developed in Go. It handles all heavy lifting, including file system interactions, AI logic orchestration, and communication with external LLM providers.

-   **Role:** Serves as the core intelligence layer, processing user requests, managing project context, interacting with external AI services, and performing local file system operations.
-   **Key Technologies:**
    -   **Go:** Chosen for its performance, concurrency, and robust standard library, ideal for a local server.
    -   **Chi Router:** A lightweight, idiomatic HTTP router for building the REST API.
    -   **Gorilla WebSocket:** Used for real-time communication with the frontend for streaming terminal output.
    -   **YAML:** For persistent storage of agent personas and LLM configurations in a human-readable format.
-   **Responsibilities:**
    -   REST API & WebSocket Server: Exposes endpoints for the frontend to interact with.
    -   File System Management: Loads directory structures, reads file contents, applies AI-generated file changes (create, modify, delete).
    -   Codebase Filtering Engine: Processes glob patterns to determine which files are included or excluded from the AI's context.
    -   Agent & LLM Configuration Storage: Persists agent personas and LLM API keys securely on the local filesystem.
    -   AI Orchestration Layer: Constructs detailed prompts based on agent configurations, injects codebase context, and interfaces with various Large Language Model APIs (e.g., OpenAI, Anthropic, Google Gemini).
    -   Terminal Command Execution: Runs shell commands in the project root and streams output back to the frontend.

## ⚙️ Getting Started

Follow these steps to get Clarion up and running on your local machine.

### Prerequisites

Ensure you have the following installed on your system:

-   **Go:** Version 1.22.0 or higher
-   **Node.js:** LTS version 18.x or higher
-   **npm** (Node Package Manager) or **Yarn**: Usually comes with Node.js.
-   **Rust Toolchain:** Required by Tauri for building the desktop application. Install via `rustup`.
    ```bash
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    ```
    (Follow the on-screen instructions, selecting the default installation.)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ClarionDev/clarion.git
    cd clarion
    ```

2.  **Install Go dependencies (Backend):**
    ```bash
    go mod tidy
    ```

3.  **Install Frontend dependencies:**
    ```bash
    cd clarion-frontend
    npm install # or yarn install
    cd ..
    ```

4.  **Configure Environment:**
    Copy the example environment file to create your own local configuration.
    ```bash
    cp .env.example .env
    ```
    You can now edit the `.env` file to change the default ports for the backend and frontend if needed.

### Running the Application

To start both the backend server and the frontend development server:

```bash
make dev
```

This command will:

1.  Compile and run the Go backend server (listening on the port specified in `.env`, e.g., `http://localhost:2077`).
2.  Start the React development server in a Tauri window, providing the desktop application UI.

The application should automatically open in a new window.

## 🙌 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any features, bug fixes, or improvements.

## 📜 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
