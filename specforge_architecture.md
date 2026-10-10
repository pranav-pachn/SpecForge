# SpecForge Architecture

The following diagram outlines the high-level architecture of the SpecForge system, including the core Next.js application, workflow engine, runtime orchestration, and platform services.

```mermaid
flowchart TD
    %% Define Styles
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef server fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    classDef workflow fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff
    classDef platform fill:#8b5cf6,stroke:#5b21b6,stroke-width:2px,color:#fff
    classDef database fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff
    
    %% Client Tier
    subgraph UI["User Interface (Next.js Client)"]
        Components["Shared Components (UI)"]
        Features["Feature Modules (Specs, Workflows)"]
        Auth["Authentication (NextAuth)"]
    end
    class UI,Components,Features,Auth client

    %% API Tier
    subgraph API["API Layer (Next.js Server)"]
        AppRouter["App Router (api/*)"]
        ServerActions["Server Actions"]
        SSE["Streaming Responses (SSE)"]
    end
    class API,AppRouter,ServerActions,SSE server

    %% Workflow Engine
    subgraph Engine["Workflow Engine (src/workflow)"]
        Pipeline["Pipelines (Standard, Generation)"]
        EventBus["Event Bus"]
        Agents["Workflow Agents"]
        ArtifactManager["Artifact Persistence"]
    end
    class Engine,Pipeline,EventBus,Agents,ArtifactManager workflow

    %% Runtime & Orchestration
    subgraph Runtime["Runtime Orchestration (src/runtime)"]
        Coordinator["Coordinator"]
        Executor["Task Executor"]
        Scheduler["Scheduler"]
        StateManager["State & Checkpoint"]
    end
    class Runtime,Coordinator,Executor,Scheduler,StateManager workflow

    %% Platform Services
    subgraph Platform["Platform Services (src/platform)"]
        Storage["Storage / DB Adapter"]
        MCP["Model Context Protocol (MCP) Connectors"]
        Memory["Memory / Knowledge Graph"]
        Integrations["Integrations (Slack, Teams, Email)"]
        Events["Platform Event Dispatcher"]
        Learning["Learning & Synthesis"]
    end
    class Platform,Storage,MCP,Memory,Integrations,Events,Learning platform

    %% Data Tier
    subgraph DB["Data Layer"]
        Postgres[(PostgreSQL via Prisma)]
        Redis[(Redis for BullMQ / Queue)]
    end
    class DB,Postgres,Redis database

    %% Relationships
    Features -->|User Actions| AppRouter
    Features -->|Mutations| ServerActions
    Auth -->|Credentials/OAuth| AppRouter
    
    AppRouter -->|Initialize| Pipeline
    ServerActions --> Storage
    
    Pipeline --> EventBus
    Pipeline --> Agents
    Agents --> ArtifactManager
    
    Pipeline <--> Coordinator
    Coordinator --> Scheduler
    Scheduler --> Executor
    Executor <--> StateManager
    
    Executor --> MCP
    Executor --> Memory
    Executor --> Learning
    
    EventBus --> Events
    Events --> Integrations
    
    Storage --> Postgres
    ArtifactManager --> Postgres
    StateManager --> Redis
```

## Module Responsibilities

- **User Interface (`src/features`, `src/shared`)**: Houses React components, providing the dashboard, AI interaction panels, and artifact viewers.
- **API Layer (`src/app/api`, `src/server`)**: Contains Next.js routes handling intake forms, artifact generation, and returning Server-Sent Events (SSE) for streaming updates.
- **Workflow Engine (`src/workflow`)**: Defines how different generative agents are combined sequentially or parallelly into pipelines. Exposes an event bus for granular step updates.
- **Runtime Orchestration (`src/runtime`)**: Handles actual execution context, scheduling background tasks (potentially via BullMQ), and maintaining checkpoint state for resume capabilities.
- **Platform Services (`src/platform`)**: Provides foundational capabilities such as storage adapters, MCP integrations (file system, GitHub, database integrations), conversational memory graph, and learning synthesizers.
- **Data Layer**: Stores persistent workflow data, user profiles, and generated artifacts via Prisma and PostgreSQL.
