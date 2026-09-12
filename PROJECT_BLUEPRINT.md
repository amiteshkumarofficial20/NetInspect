# NetInspect — Architecture Specification

This file defines the expected target architecture of the NetInspect project.

Use this document as the reference blueprint when creating, moving, or implementing project files.

The goal is to keep the project separated into clear layers:

    Frontend
        ↓ HTTP / JSON
    Backend
        ↓ Process / Files
    C++17 DPI Engine
        ↓
    PCAP / JSON Results / Reports

The C++ engine remains the core network-analysis component.
The backend controls and exposes the engine.
The frontend visualizes and interacts with the analysis results.

---

# 1. Root Project Structure

```text
NetInspect/
│
├── PROJECT_BLUEPRINT.md
│   └── Complete project architecture and design reference.
│
├── README.md
│   └── Public project documentation and quick-start guide.
│
├── LICENSE
│   └── Project license.
│
├── .gitignore
│   └── Git ignore rules for builds, dependencies, runtime files,
│       databases, environment files, and generated data.
│
├── CMakeLists.txt
│   └── Root CMake configuration for the C++17 engine.
│
│
├── engine/                         # C++17 DPI CORE
│   ├── CMakeLists.txt
│   ├── include/                    # C++ headers
│   ├── src/                        # C++ implementations
│   ├── tests/                      # Engine tests
│   └── build/                      # Local build output
│
│
├── backend/                        # API + ENGINE CONTROL
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── middleware/
│       ├── models/
│       ├── types/
│       └── utils/
│
│
├── frontend/                       # WEB INTERFACE
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── pages/
│       ├── components/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── utils/
│
│
├── storage/                        # RUNTIME DATA
│   ├── uploads/
│   ├── outputs/
│   ├── results/
│   └── reports/
│
│
├── database/                       # PERSISTENT METADATA
│   ├── schema.sql
│   └── netinspect.db
│
│
├── samples/                        # TEST PCAPS
│   ├── test_dpi.pcap
│   ├── blocked.pcap
│   └── unblocked.pcap
│
│
├── scripts/                        # DEVELOPMENT UTILITIES
│   ├── generate_test_pcap.py
│   ├── build_engine.ps1
│   └── run_demo.ps1
│
│
├── docs/                           # DOCUMENTATION
│   ├── architecture/
│   ├── api/
│   └── development/
│
│
└── .vscode/
    ├── c_cpp_properties.json
    ├── settings.json
    └── tasks.json
```

---

# 2. Root Files

## PROJECT_BLUEPRINT.md

This document.

Purpose:

- Complete architecture reference.
- File responsibilities.
- Data flow.
- Component relationships.
- Development structure.
- Integration boundaries.

---

## README.md

The public-facing project documentation.

It should explain:

- What NetInspect is.
- Main features.
- Technology stack.
- How to build the engine.
- How to run a sample PCAP.
- How blocking rules work.
- How the web application is structured.
- Project limitations.
- Future roadmap.

README should remain concise compared with this architecture document.

---

## LICENSE

Contains the project's selected open-source license.

---

## .gitignore

Recommended:

```gitignore
node_modules/
frontend/dist/
backend/dist/
engine/build/

storage/uploads/*
storage/outputs/*
storage/results/*
storage/reports/*

database/*.db

.env
```

Keep `.gitkeep` files inside empty runtime directories when those directories need to exist in Git.

---

## CMakeLists.txt

Root CMake configuration.

Responsibilities:

- Define the project.
- Configure C++17.
- Include/build the engine.
- Define engine targets.
- Configure testing when enabled.

---

# 3. Engine — C++17 DPI Core

```text
engine/
├── CMakeLists.txt
├── include/
├── src/
├── tests/
└── build/
```

The engine is the most important technical layer.

It performs the actual network traffic analysis.

The frontend must not become the DPI implementation.

The backend must not reimplement packet parsing.

---

# 4. Engine Header Files

```text
engine/include/
│
├── connection_tracker.h
├── dpi_engine.h
├── fast_path.h
├── load_balancer.h
├── packet_parser.h
├── pcap_reader.h
├── platform.h
├── rule_manager.h
├── sni_extractor.h
├── thread_safe_queue.h
└── types.h
```

## connection_tracker.h

Defines flow/connection tracking structures and operations.

Primary concept:

```text
FiveTuple → Flow State
```

Five-tuple:

```text
Source IP
Destination IP
Source Port
Destination Port
Protocol
```

Purpose:

- Identify a network flow.
- Store state for a flow.
- Associate packets with the same connection.
- Maintain application/SNI/blocking state where implemented.

---

## dpi_engine.h

Defines the high-level DPI engine interface.

Responsibilities:

- Represent/coordinate the DPI processing engine.
- Connect major analysis components where applicable.
- Provide the high-level engine abstraction.

---

## fast_path.h

Defines the fast-path worker.

Responsibilities:

- Receive packets from its queue.
- Process packets.
- Access flow state.
- Perform classification.
- Apply rules.
- Send allowed packets to the output path.

---

## load_balancer.h

Defines the load-balancer worker.

Responsibilities:

- Receive packets from an input queue.
- Hash packet flow information.
- Select a fast-path worker.
- Dispatch packets to the selected fast-path queue.

The important design rule is:

```text
Same FiveTuple
      ↓
Same Hash
      ↓
Same Fast Path
```

This preserves flow affinity.

---

## packet_parser.h

Defines packet parsing.

Responsibilities:

- Ethernet parsing.
- IPv4 parsing.
- TCP parsing.
- UDP parsing.
- Source/destination address extraction.
- Source/destination port extraction.
- Protocol identification.
- Payload location/length information.

Expected conceptual packet layout:

```text
Ethernet
    ↓
IPv4
    ↓
TCP / UDP
    ↓
Payload
```

---

## pcap_reader.h

Defines PCAP reading.

Responsibilities:

- Open PCAP.
- Validate PCAP header.
- Read packet headers.
- Read packet bytes.
- Provide packets to the processing pipeline.
- Close the file.

PCAP structure:

```text
Global Header
    ↓
Packet Header + Packet Data
    ↓
Packet Header + Packet Data
    ↓
...
```

The current project is PCAP-based.

Do not describe the current implementation as live packet capture unless that capability is actually implemented later.

---

## platform.h

Contains platform-specific definitions and helpers.

Purpose:

- Keep operating-system/compiler-specific details isolated.
- Support platform-specific behavior without spreading it throughout the engine.

---

## rule_manager.h

Defines the traffic filtering/rule system.

Current rule categories include:

```text
Source IP
Application
Domain
```

Conceptual decision:

```text
Packet / Flow
      ↓
Rule Manager
      ↓
ALLOW / BLOCK
```

---

## sni_extractor.h

Defines TLS hostname/SNI extraction.

Primary use:

```text
TLS Client Hello
       ↓
SNI Extension
       ↓
Hostname
```

Example:

```text
www.youtube.com
```

The extracted SNI can be used for:

- Domain information.
- Application classification.
- Rule matching.

---

## thread_safe_queue.h

Defines the thread-safe producer-consumer queue.

Important synchronization concepts:

```text
std::mutex
std::condition_variable
```

Conceptual flow:

```text
Producer
   ↓
Thread-Safe Queue
   ↓
Consumer
```

The queue allows worker threads to communicate safely.

---

## types.h

Contains shared types and data structures.

Important concepts include:

```text
FiveTuple
Flow
AppType
Packet-related structures
Shared statistics/types
```

Application classification can map observed information such as SNI to an application type.

---

# 5. Engine Source Files

```text
engine/src/
│
├── connection_tracker.cpp
├── dpi_engine.cpp
├── dpi_mt.cpp
├── fast_path.cpp
├── load_balancer.cpp
├── main.cpp
├── main_dpi.cpp
├── main_simple.cpp
├── main_working.cpp
├── packet_parser.cpp
├── pcap_reader.cpp
├── rule_manager.cpp
├── sni_extractor.cpp
└── types.cpp
```

## connection_tracker.cpp

Implementation of flow tracking.

Conceptual structure:

```text
FiveTuple
    ↓
Flow Table
    ↓
Flow State
```

---

## dpi_engine.cpp

Implementation of the high-level DPI engine.

This file contains engine-level coordination that belongs to the `dpi_engine` abstraction.

---

## dpi_mt.cpp

Multi-threaded processing implementation/entry point.

Current architecture:

```text
Reader
   ↓
Load Balancers
   ↓
Fast Paths
   ↓
Output Queue
   ↓
Output Writer
```

---

## fast_path.cpp

Implementation of fast-path worker processing.

Conceptual operation:

```text
Receive Packet
      ↓
Find Flow
      ↓
Classify
      ↓
Apply Rules
      ↓
ALLOW / BLOCK
```

---

## load_balancer.cpp

Implementation of load-balancer workers.

Conceptual operation:

```text
Input Queue
     ↓
Hash FiveTuple
     ↓
Select Fast Path
     ↓
Fast Path Queue
```

---

## main.cpp

Existing general application entry point.

Keep only if it remains useful after the project is reorganized.

---

## main_dpi.cpp

Existing DPI-oriented entry point.

Keep if it is still used by a build target or educational/test workflow.

---

## main_simple.cpp

Simple/alternative engine entry point.

Useful for demonstrating or testing a simpler processing flow.

---

## main_working.cpp

Existing working single-threaded implementation.

This version is useful for understanding the fundamental pipeline before the multi-threaded architecture.

Conceptual flow:

```text
PCAP
 ↓
Parser
 ↓
Flow Tracking
 ↓
SNI
 ↓
Classification
 ↓
Rules
 ↓
Forward / Drop
```

---

## packet_parser.cpp

Implementation of Ethernet/IP/TCP/UDP parsing.

Network byte-order conversion is part of this layer where required.

Concept:

```text
Network Byte Order
       ↓
Host Representation
```

---

## pcap_reader.cpp

Implementation of PCAP file reading.

---

## rule_manager.cpp

Implementation of:

- Rule registration.
- IP blocking.
- Application blocking.
- Domain matching.
- Block decision logic.

---

## sni_extractor.cpp

Implementation of TLS SNI extraction.

Simplified flow:

```text
TLS Record
    ↓
Client Hello
    ↓
Extensions
    ↓
SNI Extension (0x0000)
    ↓
Hostname
```

---

## types.cpp

Implementation of shared helpers and classification logic.

Example conceptual classification:

```text
SNI contains "youtube"
        ↓
YouTube application
```

Only classifications actually implemented in the source should be documented as supported.

---

# 6. Engine Tests

```text
engine/tests/
├── packet_parser_tests.cpp
├── sni_extractor_tests.cpp
├── rule_manager_tests.cpp
├── connection_tracker_tests.cpp
└── integration_tests.cpp
```

These are planned test locations.

Tests should cover:

### Packet Parser

- Ethernet parsing.
- IPv4 parsing.
- TCP parsing.
- UDP parsing.
- Invalid/truncated packets.

### SNI Extractor

- Valid TLS Client Hello.
- SNI present.
- SNI absent.
- Invalid TLS data.
- Truncated data.

### Rule Manager

- IP rule.
- Application rule.
- Domain rule.
- No-match behavior.

### Connection Tracker

- New flow.
- Existing flow.
- Five-tuple equality.
- Flow state updates.

### Integration

```text
PCAP
 ↓
Engine
 ↓
Analysis
 ↓
Rules
 ↓
Output
```

---

# 7. Multi-Threaded Engine Architecture

The current multi-threaded design is:

```text
                         Reader Thread
                               |
                               v
                       +---------------+
                       | Load Balancer |
                       +-------+-------+
                               |
                 +-------------+-------------+
                 |                           |
                 v                           v
             LB Worker                   LB Worker
                 |                           |
                 +-------------+-------------+
                               |
                               v
                       Fast Path Workers
                               |
                 +-------------+-------------+
                 |             |             |
                 v             v             v
               FP0           FP1           FP...
                 |             |             |
                 +-------------+-------------+
                               |
                               v
                         Output Queue
                               |
                               v
                        Output Writer
                               |
                               v
                           Output PCAP
```

The number of workers can be configured.

Example concept:

```text
4 LB threads
×
4 FP threads
```

The exact runtime configuration is determined by the engine invocation.

---

# 8. Packet Processing Pipeline

```text
Input PCAP
    ↓
PCAP Reader
    ↓
Raw Packet
    ↓
Packet Parser
    ↓
Ethernet
    ↓
IPv4
    ↓
TCP / UDP
    ↓
Five-Tuple
    ↓
Flow Tracking
    ↓
TLS/SNI Extraction
    ↓
Application Detection
    ↓
Rule Manager
    ↓
+-----------+
|           |
ALLOW      BLOCK
|           |
↓           ↓
Output     Drop
PCAP
```

---

# 9. Detailed TLS/SNI Processing

For supported TLS Client Hello traffic:

```text
TLS Packet
    ↓
Check Content Type
    ↓
Check Client Hello
    ↓
Read Client Hello structure
    ↓
Skip Session ID
    ↓
Skip Cipher Suites
    ↓
Skip Compression Methods
    ↓
Read Extensions
    ↓
Find extension type 0x0000
    ↓
Read SNI hostname
    ↓
Store SNI in flow
    ↓
Classify application
```

Important limitation:

The implementation should only claim the TLS/SNI behavior actually supported by the code. Modern encrypted-client-hello and protocols not implemented by the engine should not be represented as supported simply because they are part of TLS/networking in general.

---

# 10. Rule and Blocking Pipeline

```text
Packet / Flow
      |
      v
Source IP rule?
      |
      +---- YES ----> BLOCK
      |
      NO
      |
      v
Application rule?
      |
      +---- YES ----> BLOCK
      |
      NO
      |
      v
Domain/SNI rule?
      |
      +---- YES ----> BLOCK
      |
      NO
      |
      v
    ALLOW
```

Flow-based behavior:

```text
Connection begins
      ↓
SNI may not yet be known
      ↓
Client Hello arrives
      ↓
SNI extracted
      ↓
Application identified
      ↓
Rule evaluated
      ↓
Flow may become blocked
      ↓
Subsequent packets follow flow state
```

---

# 11. Backend Architecture

```text
backend/
├── package.json
├── tsconfig.json
└── src/
    ├── server.ts
    ├── routes/
    ├── controllers/
    ├── services/
    ├── middleware/
    ├── models/
    ├── types/
    └── utils/
```

The backend is the bridge between the web application and the C++ engine.

It should:

- Accept PCAP uploads.
- Validate input.
- Manage analysis jobs.
- Configure rules.
- Start the C++ engine.
- Read engine results.
- Store output files.
- Return JSON to the frontend.
- Handle errors.

The frontend should not directly execute `dpi_engine.exe`.

---

# 12. Backend Files

## server.ts

Main backend server.

Responsibilities:

- Create HTTP server.
- Register middleware.
- Register routes.
- Configure error handling.
- Start listening.

---

# 13. Backend Routes

```text
backend/src/routes/
│
├── analysis.routes.ts
├── traffic.routes.ts
├── flow.routes.ts
├── application.routes.ts
├── domain.routes.ts
├── rule.routes.ts
├── report.routes.ts
└── output.routes.ts
```

Suggested API:

```text
POST   /api/analyze

GET    /api/analysis/:id

GET    /api/traffic/:analysisId

GET    /api/applications/:analysisId

GET    /api/domains/:analysisId

GET    /api/flows/:analysisId

GET    /api/rules

POST   /api/rules

PUT    /api/rules/:id

DELETE /api/rules/:id

GET    /api/report/:analysisId

GET    /api/output/:analysisId
```

---

# 14. Backend Controllers

```text
backend/src/controllers/
│
├── analysis.controller.ts
├── traffic.controller.ts
├── flow.controller.ts
├── application.controller.ts
├── domain.controller.ts
├── rule.controller.ts
├── report.controller.ts
└── output.controller.ts
```

Controllers should handle HTTP-level concerns.

Conceptually:

```text
HTTP Request
     ↓
Controller
     ↓
Service
     ↓
Result
     ↓
HTTP Response
```

Controllers should not contain the actual C++ DPI logic.

---

# 15. Backend Services

```text
backend/src/services/
│
├── engine.service.ts
├── analysis.service.ts
├── pcap.service.ts
├── result.service.ts
├── rule.service.ts
├── report.service.ts
└── storage.service.ts
```

## engine.service.ts

Responsible for controlling the C++ executable.

Concept:

```text
Backend
   ↓
engine.service
   ↓
dpi_engine.exe
   ↓
output.pcap + results.json
```

---

## analysis.service.ts

Coordinates an analysis request.

Responsibilities:

- Create analysis record.
- Prepare input/output locations.
- Start engine.
- Track completion/error.
- Return analysis information.

---

## pcap.service.ts

Handles PCAP-related file operations.

---

## result.service.ts

Reads/parses machine-readable engine results.

---

## rule.service.ts

Manages application/domain/IP rule data.

---

## report.service.ts

Generates or prepares analysis reports.

---

## storage.service.ts

Centralizes runtime file locations and storage operations.

---

# 16. Backend Middleware

```text
backend/src/middleware/
├── error.middleware.ts
├── upload.middleware.ts
└── validation.middleware.ts
```

Responsibilities:

- Error handling.
- File upload handling.
- Request validation.

---

# 17. Backend Models

```text
backend/src/models/
├── analysis.model.ts
├── rule.model.ts
└── report.model.ts
```

Models represent backend/database-level entities.

---

# 18. Backend Types

```text
backend/src/types/
├── analysis.types.ts
├── traffic.types.ts
├── flow.types.ts
└── rule.types.ts
```

Types should represent the API/data contracts shared within the backend.

---

# 19. Backend Utilities

```text
backend/src/utils/
├── logger.ts
├── file.utils.ts
└── process.utils.ts
```

Utilities should contain reusable infrastructure helpers.

---

# 20. Frontend Architecture

```text
frontend/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── pages/
    ├── components/
    ├── layouts/
    ├── hooks/
    ├── services/
    ├── types/
    └── utils/
```

Frontend responsibilities:

- User interaction.
- PCAP upload UI.
- Analysis controls.
- Packet visualization.
- Flow visualization.
- Application/domain analytics.
- Rule management UI.
- Reports.
- Status/error presentation.

Frontend should consume backend APIs rather than implementing the DPI engine.

---

# 21. Frontend Pages

```text
frontend/src/pages/
│
├── Dashboard.tsx
├── AnalyzePcap.tsx
├── ProcessingPipeline.tsx
├── PacketAnalyzer.tsx
├── Flows.tsx
├── Applications.tsx
├── Domains.tsx
├── Rules.tsx
├── Reports.tsx
└── Architecture.tsx
```

## Dashboard.tsx

Shows dynamic analysis statistics:

```text
Total Packets
TCP
UDP
Forwarded
Dropped
Flows
Applications
Domains
```

Possible visualizations:

```text
Protocol Distribution
Forwarded vs Dropped
Application Distribution
Domain Distribution
Pipeline Status
```

Values should come from actual analysis results, not hard-coded demo numbers.

---

## AnalyzePcap.tsx

Workflow:

```text
Select PCAP
    ↓
Upload
    ↓
Analyze
    ↓
Processing
    ↓
Results
```

---

## ProcessingPipeline.tsx

Visualizes:

```text
PCAP Input
    ↓
PCAP Reader
    ↓
Packet Parser
    ↓
TCP / UDP Analysis
    ↓
Flow Tracking
    ↓
TLS / SNI Extraction
    ↓
Application Detection
    ↓
Domain Detection
    ↓
Rule Engine
    ↓
Forward / Drop
    ↓
Output
```

---

## PacketAnalyzer.tsx

Main packet-analysis interface.

Suggested columns:

```text
Packet #
Timestamp
Protocol
Source IP
Source Port
Destination IP
Destination Port
Domain / SNI
Application
Packet Size
Decision
Reason
```

Filters:

```text
All
TCP
UDP
TLS
Allowed
Blocked
```

Packet details:

```text
Frame
 └── Ethernet
      └── IPv4
           ├── TCP / UDP
           └── Payload
                └── TLS / SNI
                     └── NetInspect Classification
                          └── Decision
```

---

## Flows.tsx

Displays:

```text
Flow ID
Protocol
Source
Destination
Source Port
Destination Port
Packets
Bytes
Application
SNI
State
```

---

## Applications.tsx

Displays application classification and statistics.

---

## Domains.tsx

Displays observed domains/SNI and related statistics.

---

## Rules.tsx

Allows users to:

- View rules.
- Add rules.
- Edit rules.
- Delete rules.
- Enable/disable rules.
- Manage IP rules.
- Manage application rules.
- Manage domain rules.

---

## Reports.tsx

Displays:

- Analysis summary.
- Packet statistics.
- Protocol distribution.
- Application distribution.
- Domain distribution.
- Forwarded packets.
- Dropped packets.
- Applied rules.
- Output PCAP information.

---

## Architecture.tsx

Can show the technical project architecture:

```text
Frontend
    ↓
Backend
    ↓
C++17 DPI Engine
    ↓
PCAP / JSON Results
```

---

# 22. Frontend Components

```text
frontend/src/components/
│
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── PageContainer.tsx
│
├── dashboard/
│   ├── StatCard.tsx
│   ├── ProtocolChart.tsx
│   ├── DecisionChart.tsx
│   └── TrafficChart.tsx
│
├── packet/
│   ├── PacketTable.tsx
│   ├── PacketFilters.tsx
│   ├── PacketDetails.tsx
│   └── ProtocolTree.tsx
│
├── flow/
│   ├── FlowTable.tsx
│   └── FlowDetails.tsx
│
├── rules/
│   ├── RuleTable.tsx
│   ├── RuleForm.tsx
│   └── RuleDialog.tsx
│
└── common/
    ├── StatusBadge.tsx
    ├── LoadingState.tsx
    ├── EmptyState.tsx
    └── ErrorState.tsx
```

Components should remain reusable and presentation-focused.

---

# 23. Frontend Services

```text
frontend/src/services/
├── api.ts
├── analysis.api.ts
├── traffic.api.ts
├── flow.api.ts
├── rule.api.ts
└── report.api.ts
```

The frontend service layer communicates with the backend.

Concept:

```text
React Component
      ↓
Frontend API Service
      ↓
HTTP
      ↓
Backend API
```

---

# 24. Frontend Hooks

```text
frontend/src/hooks/
├── useAnalysis.ts
├── useTraffic.ts
├── useFlows.ts
└── useRules.ts
```

Hooks manage reusable UI/data-fetching behavior.

---

# 25. Frontend Types

```text
frontend/src/types/
├── analysis.ts
├── packet.ts
├── flow.ts
├── application.ts
├── domain.ts
└── rule.ts
```

These types should match the backend API contract.

---

# 26. Storage Architecture

```text
storage/
│
├── uploads/
│   └── User-uploaded PCAP files.
│
├── outputs/
│   └── Filtered/output PCAP files.
│
├── results/
│   └── JSON analysis results.
│
└── reports/
    └── Generated reports.
```

Runtime flow:

```text
User Upload
    ↓
storage/uploads/
    ↓
C++ Engine
    ↓
storage/outputs/
storage/results/
    ↓
Backend
    ↓
Frontend
```

Generated runtime files should normally not be committed.

---

# 27. Database Architecture

```text
database/
├── schema.sql
└── netinspect.db
```

SQLite can store persistent metadata such as:

```text
Analysis metadata
Analysis status
Rule definitions
Report metadata
File references
```

The database should not replace PCAP storage.

PCAP files remain file-based data.

---

# 28. Sample Data

```text
samples/
├── test_dpi.pcap
├── blocked.pcap
└── unblocked.pcap
```

Purpose:

- Engine testing.
- Blocking-rule testing.
- Regression testing.
- Demo analysis.

Generated runtime output should go to `storage/outputs/`, not the sample directory.

---

# 29. Scripts

```text
scripts/
├── generate_test_pcap.py
├── build_engine.ps1
└── run_demo.ps1
```

## generate_test_pcap.py

Utility for generating test PCAP data.

This is a development/test utility.

The core DPI engine remains C++17.

---

## build_engine.ps1

Optional Windows helper for building the C++ engine.

---

## run_demo.ps1

Optional helper for running a complete demo workflow.

---

# 30. Documentation

```text
docs/
│
├── architecture/
│   ├── system.md
│   ├── engine.md
│   ├── backend.md
│   └── frontend.md
│
├── api/
│   └── api.md
│
└── development/
    ├── setup.md
    ├── testing.md
    └── contributing.md
```

Documentation should explain implementation details without putting those details into source code.

---

# 31. VS Code Configuration

```text
.vscode/
├── c_cpp_properties.json
├── settings.json
└── tasks.json
```

## c_cpp_properties.json

C/C++ IntelliSense configuration.

## settings.json

Project-specific VS Code settings.

## tasks.json

Build/run tasks for development.

---

# 32. Machine-Readable Engine Output

The web application needs structured results.

The preferred integration is:

```text
dpi_engine input.pcap output.pcap --json results.json
```

Conceptually:

```text
Input PCAP
    ↓
C++ Engine
    ├── Output PCAP
    └── JSON Results
```

The JSON schema must be based on the actual C++ engine data structures.

Do not invent frontend-only statistics that the engine never produces.

Possible result categories include:

```text
Packet statistics
Protocol statistics
Flow information
Application information
Domain/SNI information
Forwarded packets
Dropped packets
Rule decisions
```

---

# 33. Complete End-to-End Data Flow

```text
                              USER
                                |
                                v
                    +-----------------------+
                    |       FRONTEND        |
                    |   React / TypeScript  |
                    +-----------+-----------+
                                |
                           HTTP / JSON
                                |
                                v
                    +-----------------------+
                    |        BACKEND        |
                    | Node.js / TypeScript  |
                    +-----------+-----------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
       File Management                       Rule Management
             |                                     |
             +------------------+------------------+
                                |
                                v
                    +-----------------------+
                    |     C++17 ENGINE      |
                    |       NetInspect      |
                    +-----------+-----------+
                                |
                                v
                         +-------------+
                         | PCAP Reader |
                         +------+------+ 
                                |
                                v
                         +-------------+
                         | Packet      |
                         | Parser      |
                         +------+------+
                                |
                                v
                         +-------------+
                         | Flow /      |
                         | Five-Tuple  |
                         +------+------+
                                |
                                v
                         +-------------+
                         | TLS / SNI   |
                         | Extraction  |
                         +------+------+
                                |
                                v
                         +-------------+
                         | Application |
                         | Detection   |
                         +------+------+
                                |
                                v
                         +-------------+
                         | Rule Engine |
                         +------+------+
                                |
                     +----------+----------+
                     |                     |
                   ALLOW                 BLOCK
                     |                     |
                     v                     v
               Output PCAP                DROP
                     |
                     v
                JSON Results
                     |
                     v
                  BACKEND
                     |
                     v
                 FRONTEND
                     |
                     v
                  USER
```

---

# 34. Responsibility Boundaries

## Frontend

Owns:

```text
UI
Visualization
Charts
Tables
Filters
User actions
Analysis presentation
```

Does not own:

```text
DPI parsing
C++ process internals
Network protocol implementation
Flow-state implementation
```

---

## Backend

Owns:

```text
HTTP API
PCAP upload
File management
Engine execution
Result loading
Rule persistence
Database interaction
Error handling
```

Does not own:

```text
Core packet parsing
TLS byte-level parsing
C++ flow tracking
C++ DPI classification
```

---

## C++ Engine

Owns:

```text
PCAP reading
Packet parsing
Flow tracking
TLS/SNI extraction
Application classification
Rule evaluation
Multi-threaded processing
Forward/drop decision
Output PCAP
Machine-readable analysis results
```

---

# 35. Current Repository → Target Repository

Current structure:

```text
NetInspect/
├── include/
├── src/
├── test_dpi.pcap
├── blocked.pcap
├── unblocked.pcap
├── output.pcap
├── generate_test_pcap.py
├── CMakeLists.txt
├── README.md
├── WINDOWS_SETUP.md
└── .vscode/
```

Target:

```text
NetInspect/
├── engine/
├── backend/
├── frontend/
├── storage/
├── database/
├── samples/
├── scripts/
├── docs/
└── .vscode/
```

Mapping:

```text
include/*                         → engine/include/*
src/*                             → engine/src/*
test_dpi.pcap                     → samples/test_dpi.pcap
blocked.pcap                      → samples/blocked.pcap
unblocked.pcap                    → samples/unblocked.pcap
output.pcap                       → storage/outputs/
generate_test_pcap.py             → scripts/generate_test_pcap.py
WINDOWS_SETUP.md                  → docs/development/setup.md
structure.txt                     → replace with this architecture document
```

The compiled files:

```text
dpi_engine
dpi_engine.exe
```

are build artifacts, not source files.

They should be generated from the engine build process rather than treated as architectural source files.

---

# 36. Development Order

The project should be built in this order:

```text
Phase 1
C++17 DPI Core
    ↓
Phase 2
Machine-readable JSON output
    ↓
Phase 3
Backend API
    ↓
Phase 4
Frontend
    ↓
Phase 5
Database / persistent rules
    ↓
Phase 6
Full integration
    ↓
Phase 7
Deployment
```

Do not build the frontend first and then recreate the DPI logic in JavaScript.

The existing C++ engine is the foundation.

---

# 37. Final Expected Architecture

```text
NetInspect/
│
├── PROJECT_BLUEPRINT.md       # Complete architecture/design reference
├── README.md                  # Public project documentation
├── LICENSE
├── .gitignore
├── CMakeLists.txt
│
├── engine/                    # C++17 DPI CORE
│   ├── CMakeLists.txt
│   ├── include/
│   │   ├── connection_tracker.h
│   │   ├── dpi_engine.h
│   │   ├── fast_path.h
│   │   ├── load_balancer.h
│   │   ├── packet_parser.h
│   │   ├── pcap_reader.h
│   │   ├── platform.h
│   │   ├── rule_manager.h
│   │   ├── sni_extractor.h
│   │   ├── thread_safe_queue.h
│   │   └── types.h
│   │
│   ├── src/
│   │   ├── connection_tracker.cpp
│   │   ├── dpi_engine.cpp
│   │   ├── dpi_mt.cpp
│   │   ├── fast_path.cpp
│   │   ├── load_balancer.cpp
│   │   ├── main.cpp
│   │   ├── main_dpi.cpp
│   │   ├── main_simple.cpp
│   │   ├── main_working.cpp
│   │   ├── packet_parser.cpp
│   │   ├── pcap_reader.cpp
│   │   ├── rule_manager.cpp
│   │   ├── sni_extractor.cpp
│   │   └── types.cpp
│   │
│   ├── tests/
│   └── build/
│
├── backend/                   # API + ENGINE CONTROL
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts
│       ├── routes/
│       │   ├── analysis.routes.ts
│       │   ├── traffic.routes.ts
│       │   ├── flow.routes.ts
│       │   ├── application.routes.ts
│       │   ├── domain.routes.ts
│       │   ├── rule.routes.ts
│       │   ├── report.routes.ts
│       │   └── output.routes.ts
│       │
│       ├── controllers/
│       ├── services/
│       ├── middleware/
│       ├── models/
│       ├── types/
│       └── utils/
│
├── frontend/                  # WEB INTERFACE
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── pages/
│       ├── components/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── utils/
│
├── storage/                   # RUNTIME DATA
│   ├── uploads/
│   ├── outputs/
│   ├── results/
│   └── reports/
│
├── database/                  # DATABASE
│   ├── schema.sql
│   └── netinspect.db
│
├── samples/                   # TEST DATA
│   ├── test_dpi.pcap
│   ├── blocked.pcap
│   └── unblocked.pcap
│
├── scripts/                   # DEVELOPMENT TOOLS
│   ├── generate_test_pcap.py
│   ├── build_engine.ps1
│   └── run_demo.ps1
│
├── docs/                      # DOCUMENTATION
│   ├── architecture/
│   ├── api/
│   └── development/
│
└── .vscode/
    ├── c_cpp_properties.json
    ├── settings.json
    └── tasks.json
```

---

# 38. One-Sentence Architecture Rule

> C++17 performs the network analysis, the backend controls and exposes the engine, storage keeps PCAP/results/reports, the database keeps persistent metadata, and the frontend visualizes the analysis.

---

# 39. Project Positioning

NetInspect should primarily be presented as:

> A C++17 multi-threaded Deep Packet Inspection engine for PCAP-based network traffic analysis.

Primary focus:

```text
Computer Networks
        +
C++17 Systems Programming
        +
Deep Packet Inspection
        +
Network Traffic Analysis
```

Secondary focus:

```text
Network Security
```

Current architecture should not claim unsupported features such as live packet capture, ML classification, threat-intelligence feeds, or production firewall functionality.

