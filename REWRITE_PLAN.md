# Backend Rewrite and Scaling Plan: Clarion v3

This document outlines a strategic plan for rewriting the Clarion Go backend. The primary goals are to establish a robust and scalable architecture, introduce a powerful workflow engine, and prepare the platform for future feature expansion.

## 1. Guiding Principles

- Modular Monolith First: Avoid the premature complexity of microservices. We will build a well-structured, modular monolith where domains are clearly separated, allowing for a potential future transition to microservices if necessary.
- Asynchronous by Default: Long-running tasks, especially those involving LLMs and complex logic, will be handled by a background job processing system to ensure the API remains responsive.
- Interface-Driven Design: Core components (storage, job queues, LLM providers) will be abstracted behind interfaces to allow for swappable implementations, facilitating testing and future scaling.
- Preserve Local-First Experience: The default setup should remain simple for users, relying on embedded solutions (like SQLite) before requiring external services.

## 2. Core Architectural Changes

The rewrite will be centered around three major architectural shifts:

### A. Decoupled Domain-Driven Structure

The current internal package will be reorganized into distinct, independent domains, each with its own models, services, and storage interfaces.

- internal/agent/: Manages Agent definitions, lifecycle, and storage.
- internal/workflow/: The new core. Defines workflow structures, steps, and the execution engine.
- internal/task/: Defines and executes atomic units of work (e.g., LLMCallTask, FileReadTask, ShellCommandTask). This makes the workflow engine extensible.
- internal/llm/: Abstracts all interactions with various LLM providers.
- internal/storage/: Contains interfaces for data persistence (AgentStore, WorkflowRunStore) and their concrete implementations.
- internal/server/: The transport layer (HTTP/WebSocket). It will be lean, containing only handlers that delegate business logic to the appropriate domain services.

### B. Robust Persistence Layer

The current YAML-based storage will be replaced to handle transactional state, concurrency, and querying required for workflows.

- Technology: SQLite will be the default database. It's embedded, requires no external setup for the user, and is fully capable of managing relational data and transactional state for workflow runs.
- Implementation:
 1. Define storage interfaces within each domain (e.g., workflow.RunStore).
 2. Create a concrete implementation of these interfaces using the standard library's database/sql package with an SQLite driver.
 3. Introduce a lightweight migration tool (e.g., golang-migrate/migrate) to manage database schema evolution.

### C. Asynchronous Workflow & Task Engine

A background job processing system is essential for executing multi-step, long-running workflows without blocking the API.

- Phase 1 (In-Process):
 - Implement a classic Go-native dispatcher-worker pattern.
 - A central Dispatcher will manage a buffered channel that acts as the job queue.
 - A pool of Worker goroutines will pull jobs from this queue and execute them.
 - This is simple, efficient, and leverages Go's core strengths without external dependencies.
- Phase 2 (Scalable):
 - Abstract the job queue behind an interface (task.Queue).
 - Create a new implementation backed by a persistent queue like Redis or a message broker like NATS. This will enable persistence across restarts and allow workers to run as separate, scalable processes.

## 3. Workflow Engine Design

The centerpiece of the rewrite is the workflow engine. It will be designed around these core concepts:

- Workflow: A user-defined template describing a series of steps. It will be configured in YAML or JSON and stored in the database. A workflow can define sequential, parallel, or conditional execution paths.
- Step: A single node in the workflow graph. A step references a specific Task to execute and provides its configuration (e.g., use Agent X with Prompt Y).
- WorkflowRun: A stateful instance of a Workflow execution. This is the primary record in the database, tracking which steps have completed, their outputs, and the overall status (running, completed, failed).
- Task: A Go interface representing a concrete, executable action. This allows the system to be highly extensible. Initial tasks will include:
 - LLMCallTask: Executes a call to an LLM provider using a specific agent's configuration.
 - FileReadTask: Reads content from the file system.
 - FileWriteTask: Applies changes to the file system.
 - ShellCommandTask: Executes a shell command.

## 4. Evolved API Strategy

The API will shift to support asynchronous processes and provide richer interaction.

- Asynchronous Endpoints:
 - POST /api/v3/workflows/{workflow_id}/run: Starts a workflow. Returns 202 Accepted immediately with a unique run_id.
 - GET /api/v3/runs/{run_id}: Polls for the status and results of a specific run.
 - GET /api/v3/runs: Lists historical and active runs.

- Real-time Updates:
 - A dedicated WebSocket endpoint (/ws/runs/{run_id}/subscribe) will be introduced.
 - The frontend will subscribe to this endpoint to receive real-time events (step_started, step_completed, workflow_failed, workflow_succeeded), eliminating the need for polling and creating a dynamic user experience.

- Configuration Management API:
 - Full CRUD (Create, Read, Update, Delete) endpoints will be provided for managing Agents and the new Workflows as distinct resources.

## 5. Phased Implementation Plan

1. Phase 1: Foundation (Internal Rewrite)
 - Reorganize the project structure into the new domain packages.
 - Implement the SQLite-backed storage layer and define storage interfaces.
 - Build the initial in-process, channel-based job queue.
2. Phase 2: Workflow Core
 - Define and implement the core Workflow, Step, WorkflowRun, and Task models and logic.
 - Build the WorkflowExecutor service that orchestrates runs.
3. Phase 3: API & Integration
 - Implement the new asynchronous v3 API endpoints.
 - Implement the WebSocket endpoint for real-time run updates.
 - Work with the frontend team to integrate these new capabilities.
4. Phase 4: Scaling & Hardening
 - Implement the scalable, persistent job queue (e.g., Redis-backed).
 - Enhance observability with structured logging (slog), metrics (Prometheus), and tracing (OpenTelemetry).
 - Refine the Task system to allow for third-party plugins or tools.