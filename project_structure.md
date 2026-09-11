NetInspect — Project Structure

1. Project Overview

NetInspect is a C++17 multi-threaded Deep Packet Inspection (DPI) engine for PCAP-based network traffic analysis.

The current core engine:

Reads packets from PCAP files.

Parses Ethernet, IPv4, TCP, and UDP headers.

Tracks network flows using a five-tuple.

Extracts TLS SNI from TLS Client Hello packets.

Identifies applications/domains from observed traffic.

Applies configurable blocking rules.

Forwards allowed packets to an output PCAP.

Drops packets that match blocking rules.

Supports multi-threaded packet processing.

The project is primarily a Computer Networks + C++17 systems programming project, with network security as a secondary use case.

2.  High-Level Architecture

                         NETINSPECT
                    Web-Based Application
                             |
             +---------------+---------------+
             |                               |
          Frontend                        Backend

    React / TypeScript Node.js / TypeScript
    | |
    | REST / JSON API
    | |
    +---------------+---------------+
    |
    C++17 DPI Engine
    |
    +--------------+--------------+
    | |
    PCAP Input Analysis
    | |
    v v
    PCAP Reader Packet Processing
    |
    +-------------------------+-------------------------+
    | | | | |
    Packet Parser Flow Tracker TLS/SNI App Detection Rule Engine
    |
    v
    Forward / Drop
    |
    +-------------------------+
    | |
    Output PCAP JSON Results
    | |
    +------------+------------+
    |
    v
    Backend API
    |
    v
    Web Frontend

3.  Current Repository Structure

The current working repository contains the C++ engine and supporting files.

NetInspect/
├── .gitignore
├── CMakeLists.txt
├── LICENSE
├── README.md
├── WINDOWS_SETUP.md
├── structure.txt
│
├── dpi_engine
├── dpi_engine.exe
│
├── blocked.pcap
├── unblocked.pcap
├── test_dpi.pcap
├── output.pcap
├── generate_test_pcap.py
│
├── .vscode/
│ └── c_cpp_properties.json
│
├── include/
│ ├── connection_tracker.h
│ ├── dpi_engine.h
│ ├── fast_path.h
│ ├── load_balancer.h
│ ├── packet_parser.h
│ ├── pcap_reader.h
│ ├── platform.h
│ ├── rule_manager.h
│ ├── sni_extractor.h
│ ├── thread_safe_queue.h
│ └── types.h
│
└── src/
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

4. Target Full-Stack Project Structure

As the web interface and backend are integrated, the repository can be organized as a monorepo:

NetInspect/
├── README.md
├── LICENSE
├── .gitignore
├── CMakeLists.txt
├── PROJECT_STRUCTURE.md
│
├── engine/
│ ├── CMakeLists.txt
│ │
│ ├── include/
│ │ ├── connection_tracker.h
│ │ ├── dpi_engine.h
│ │ ├── fast_path.h
│ │ ├── load_balancer.h
│ │ ├── packet_parser.h
│ │ ├── pcap_reader.h
│ │ ├── platform.h
│ │ ├── rule_manager.h
│ │ ├── sni_extractor.h
│ │ ├── thread_safe_queue.h
│ │ └── types.h
│ │
│ ├── src/
│ │ ├── connection_tracker.cpp
│ │ ├── dpi_engine.cpp
│ │ ├── dpi_mt.cpp
│ │ ├── fast_path.cpp
│ │ ├── load_balancer.cpp
│ │ ├── main.cpp
│ │ ├── main_dpi.cpp
│ │ ├── main_simple.cpp
│ │ ├── main_working.cpp
│ │ ├── packet_parser.cpp
│ │ ├── pcap_reader.cpp
│ │ ├── rule_manager.cpp
│ │ ├── sni_extractor.cpp
│ │ └── types.cpp
│ │
│ ├── tests/
│ └── build/
│
├── backend/
│ ├── package.json
│ ├── tsconfig.json
│ ├── src/
│ │ ├── server.ts
│ │ ├── routes/
│ │ ├── controllers/
│ │ ├── services/
│ │ ├── middleware/
│ │ └── utils/
│ └── dist/
│
├── frontend/
│ ├── package.json
│ ├── tsconfig.json
│ ├── vite.config.ts
│ └── src/
│ ├── components/
│ ├── pages/
│ ├── layouts/
│ ├── hooks/
│ ├── services/
│ ├── types/
│ ├── utils/
│ └── App.tsx
│
├── storage/
│ ├── uploads/
│ ├── outputs/
│ ├── results/
│ └── reports/
│
├── database/
│ └── schema.sql
│
├── samples/
│ ├── test_dpi.pcap
│ ├── blocked.pcap
│ └── unblocked.pcap
│
├── scripts/
│ ├── build_engine.\*
│ └── generate_test_pcap.py
│
├── docs/
│ ├── architecture/
│ ├── api/
│ └── development/
│
└── .vscode/
├── settings.json
└── tasks.json

5. Engine Components

5.1 PCAP Reader

Files:

include/pcap_reader.h
src/pcap_reader.cpp

Responsibilities:

Open the input PCAP file.

Read packet headers.

Read packet bytes.

Provide packets to the processing pipeline.

The current engine is PCAP-based. It does not currently perform live network capture.

5.2 Packet Parser

Files:

include/packet_parser.h
src/packet_parser.cpp

Responsibilities:

Parse Ethernet headers.

Parse IPv4 headers.

Detect TCP and UDP.

Extract source and destination addresses.

Extract source and destination ports.

Identify protocol information.

Provide parsed packet information to later processing stages.

5.3 Network Types

Files:

include/types.h
src/types.cpp

Contains common data structures and application/domain classification information used by the engine.

5.4 Connection Tracker

Files:

include/connection_tracker.h
src/connection_tracker.cpp

The engine tracks flows using a five-tuple:

Source IP
Destination IP
Source Port
Destination Port
Protocol

Conceptually:

Flow Key
|
+-- Source IP
+-- Destination IP
+-- Source Port
+-- Destination Port
+-- Protocol

This allows packets belonging to the same network flow to share state.

5.5 TLS / SNI Extractor

Files:

include/sni_extractor.h
src/sni_extractor.cpp

The engine checks TLS Client Hello packets and searches for the Server Name Indication (SNI).

Conceptual processing:

TLS Packet
|
v
TLS Record
|
v
Client Hello
|
v
Extensions
|
v
SNI Extension
|
v
Hostname

Example:

www.youtube.com

The observed SNI can then be used for application/domain classification and rule matching.

5.6 Rule Manager

Files:

include/rule_manager.h
src/rule_manager.cpp

The rule manager supports blocking based on configured criteria such as:

Source IP.

Application.

Domain substring.

Conceptually:

Packet / Flow
|
v
Rule Manager
|
+---- IP rule?
|
+---- Application rule?
|
+---- Domain rule?
|
v
ALLOW / BLOCK

If a flow is marked blocked, subsequent packets belonging to that flow can be dropped according to the current engine behavior.

5.7 Load Balancer

Files:

include/load_balancer.h
src/load_balancer.cpp

The multi-threaded architecture distributes packet processing across load-balancer workers.

The flow hash is used so packets belonging to the same five-tuple can remain associated with the same processing path.

5.8 Fast Path

Files:

include/fast_path.h
src/fast_path.cpp

Fast-path workers perform the main packet processing work after load balancing.

The design allows multiple workers to process different flows concurrently.

5.9 Thread-Safe Queue

File:

include/thread_safe_queue.h

The project uses a thread-safe queue based on synchronization primitives such as:

std::mutex

std::condition_variable

The queue supports producer-consumer communication between processing stages.

5.10 DPI Engine

Files:

include/dpi_engine.h
src/dpi_engine.cpp

This component represents the higher-level engine behavior and coordinates DPI-related processing.

6. Single-Threaded Processing Flow

The simpler implementation is useful for understanding the core concepts before working with the multi-threaded version.

Input PCAP
|
v
PCAP Reader
|
v
Packet Parser
|
v
Flow Tracking
|
v
TLS / SNI Extraction
|
v
Application Detection
|
v
Rule Checking
|
+---- BLOCK ----> Drop
|
+---- ALLOW ----> Output PCAP

7. Multi-Threaded Processing Flow

The multi-threaded implementation adds parallel processing.

                    +----------------+
                    | Reader Thread  |
                    |  reads PCAP    |
                    +-------+--------+
                            |
                            v
                    +----------------+
                    | Load Balancer  |
                    +-------+--------+
                            |
              +-------------+-------------+
              |                           |
              v                           v
       +-------------+             +-------------+
       | LB Worker 0 |     ...     | LB Worker N |
       +------+------+             +------+------+
              |                           |
              +-------------+-------------+
                            |
                            v
                    +----------------+
                    |  Fast Path     |
                    |    Workers     |
                    +-------+--------+
                            |
                            v
                    +----------------+
                    | Output Queue   |
                    +-------+--------+
                            |
                            v
                    +----------------+
                    | Output Writer  |
                    +----------------+
                            |
                            v
                       Output PCAP

The main concurrency goal is to process independent flows in parallel while preserving flow affinity.

8. End-to-End Packet Journey

A packet moves through the system conceptually as follows:

1. PCAP Input
   |
   v
2. PCAP Reader
   |
   v
3. Ethernet Parsing
   |
   v
4. IPv4 Parsing
   |
   v
5. TCP / UDP Detection
   |
   v
6. Five-Tuple Flow Identification
   |
   v
7. Flow State Lookup / Update
   |
   v
8. TLS Client Hello Detection
   |
   v
9. SNI Extraction
   |
   v
10. Application / Domain Classification
    |
    v
11. Rule Evaluation
    |
    +------ BLOCK ------> Dropped
    |
    +------ ALLOW ------> Forwarded
    |
    v
    Output PCAP

12. Application and Domain Detection

The engine can map observed SNI information to application types.

Conceptually:

SNI
|
+-- contains "youtube" --> YouTube
|
+-- other known patterns --> Corresponding App
|
+-- unknown --> Unknown / Other

Domain information can also be retained as part of traffic analysis.

The exact application mapping is determined by the current C++ implementation and should not be assumed to include applications that are not implemented in the engine.

10. Blocking Flow

Blocking is rule-driven.

                Packet / Flow
                     |
                     v
                Rule Manager
                     |
          +----------+----------+
          |          |          |
          v          v          v
        IP Rule   App Rule   Domain Rule
          |          |          |
          +----------+----------+
                     |
               Match Found?
                 /       \
               YES        NO
                |          |
                v          v
              BLOCK      ALLOW
                |          |
                v          v
              DROP       WRITE
                         TO PCAP

Example rule categories:

--block-app YouTube
--block-ip <address>
--block-domain <domain>

11. Output and Analysis Results

The current engine produces an output PCAP containing packets that were forwarded.

The future full-stack integration should additionally produce machine-readable analysis results, preferably JSON.

Conceptual command:

dpi_engine input.pcap output.pcap --json results.json

The JSON schema should be based on the actual engine data structures rather than inventing fields that the C++ engine does not provide.

Possible result categories include:

Packet statistics
Protocol statistics
Flow information
Application information
Domain information
Forwarded / dropped decisions
Rule decisions

12. Backend Architecture

The backend acts as the bridge between the web frontend and the C++ engine.

Frontend
|
| HTTP / JSON
v
Backend API
|
+---- Upload PCAP
|
+---- Configure Rules
|
+---- Start Analysis
|
v
C++ DPI Engine
|
+---- Output PCAP
|
+---- JSON Results
|
v
Backend
|
v
Frontend

The frontend should not directly execute the C++ executable.

The backend should own engine execution, file handling, and API communication.

13. Suggested Backend API

POST /api/analyze

GET /api/analysis/:id

GET /api/traffic/:analysisId

GET /api/applications/:analysisId

GET /api/domains/:analysisId

GET /api/flows/:analysisId

GET /api/rules

POST /api/rules

PUT /api/rules/:id

DELETE /api/rules/:id

GET /api/report/:analysisId

GET /api/output/:analysisId

The exact API can evolve as the backend implementation is developed.

14. Frontend Structure

The web frontend should focus on visualization and interaction.

Suggested pages:

Dashboard

Displays dynamic analysis statistics such as:

Total packets.

TCP packets.

UDP packets.

Forwarded packets.

Dropped packets.

Number of flows.

Applications.

Domains.

Suggested visualizations:

Protocol distribution.

Forwarded vs dropped.

Application distribution.

Domain distribution.

Processing pipeline status.

Analyze PCAP

Main workflow:

Select / Drag PCAP
|
v
Selected File
|
v
Analyze
|
v
Processing
|
v
Results

Packet Analyzer

A custom packet-analysis interface can display:

Packet #
Timestamp
Protocol
Source IP / Port
Destination IP / Port
Domain / SNI
Application
Packet Size
Decision
Reason

Filters can include:

All
TCP
UDP
TLS
Allowed
Blocked

Selecting a packet can open detailed protocol information:

Frame
|
Ethernet
|
IPv4
|
TCP / UDP
|
TLS
|
SNI
|
NetInspect Application
|
Decision
|
Reason

This provides a Wireshark-like analysis experience focused specifically on the NetInspect engine.

Flows

A flow table can contain:

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

A selected flow can show its related packets.

Applications / Domains

This section can provide:

Application distribution.

Domain distribution.

Packet counts.

Flow counts.

Allowed / blocked information.

Rules

The rules interface can provide:

Add rule.

Edit rule.

Delete rule.

Enable / disable rule.

Application rules.

Domain rules.

IP rules.

Allow / block configuration.

Reports

The reports page can show:

Analysis summary.

Packet statistics.

Protocol distribution.

Application distribution.

Domain distribution.

Forwarded packets.

Dropped packets.

Applied rules.

Output PCAP.

15. Storage Structure

Runtime files should be separated from source code.

storage/
├── uploads/
├── outputs/
├── results/
└── reports/

Purpose:

Directory

Purpose

uploads/

User-uploaded PCAP files

outputs/

Filtered/output PCAP files

results/

Machine-readable analysis results

reports/

Generated reports

Generated runtime files should generally not be committed to Git.

16. Database

SQLite can be introduced for persistent metadata.

database/
└── schema.sql

Potential database responsibilities:

Analysis metadata.

Analysis status.

Stored rule definitions.

Report metadata.

File references.

The actual schema should be created when the backend/database layer is implemented.

17. Sample Data

Test PCAP files should be separated from runtime output.

samples/
├── test_dpi.pcap
├── blocked.pcap
└── unblocked.pcap

Generated output such as output.pcap should belong under runtime storage rather than the sample directory.

18. Build and Development

C++17

The engine is built using C++17.

Example:

g++ -std=c++17 -O2 -I include \
 -o dpi_engine \
 src/dpi_mt.cpp \
 src/pcap_reader.cpp \
 src/packet_parser.cpp \
 src/sni_extractor.cpp \
 src/types.cpp

Windows executable:

dpi_engine.exe

The project also contains CMake configuration.

19. Technology Stack

Layer

Technology

Core Engine

C++17

Build

CMake

Compiler

GCC / MinGW

Packet Input

PCAP

Protocols

Ethernet / IPv4 / TCP / UDP / TLS

Concurrency

std::thread

Synchronization

std::mutex / std::condition_variable

Backend

Node.js / TypeScript / Express

API

REST / JSON

Frontend

React / TypeScript / Vite

Database

SQLite

Runtime Storage

Local filesystem

Development

VS Code / Git / GitHub

20. Git Ignore Strategy

Generated and local runtime data should not normally be committed.

Suggested .gitignore entries:

node_modules/
frontend/dist/
backend/dist/
engine/build/

storage/uploads/_
storage/outputs/_
storage/results/_
storage/reports/_

database/\*.db

.env

If empty runtime directories need to remain in Git, add .gitkeep files.

21. Development Phases

Phase 1 — C++ DPI Core

[x] PCAP reading
[x] Ethernet / IP parsing
[x] TCP / UDP handling
[x] Flow tracking
[x] TLS / SNI extraction
[x] Application detection
[x] Rule-based blocking
[x] Multi-threaded processing

Phase 2 — Machine-Readable Output

[ ] Add JSON result output
[ ] Define stable result schema
[ ] Expose packet-level analysis data
[ ] Expose flow-level analysis data
[ ] Expose application/domain statistics

Phase 3 — Backend

[ ] Create Node.js / TypeScript backend
[ ] Add PCAP upload
[ ] Execute C++ engine from backend
[ ] Capture engine results
[ ] Store output PCAP
[ ] Store JSON results
[ ] Add REST API

Phase 4 — Frontend

[ ] Dashboard
[ ] PCAP analysis page
[ ] Processing pipeline
[ ] Packet analyzer
[ ] Flow viewer
[ ] Application/domain analytics
[ ] Rule management
[ ] Reports

Phase 5 — Full Integration

[ ] Connect frontend to backend
[ ] Connect backend to C++ engine
[ ] Validate end-to-end PCAP workflow
[ ] Add error handling
[ ] Add analysis status
[ ] Add persistent metadata

Phase 6 — Deployment

[ ] Production frontend build
[ ] Backend deployment
[ ] C++ engine deployment
[ ] Storage configuration
[ ] SQLite configuration
[ ] Environment configuration

22. Important Project Boundaries

The architecture should preserve a clear separation of responsibilities.

Frontend
|
| Visualization + User Interaction
v
Backend
|
| API + File Management + Engine Control
v
C++ Engine
|
| Packet Analysis + DPI + Rules
v
PCAP / JSON Results

Frontend should not:

Parse packets as the primary DPI implementation.

Reimplement the C++ rule engine.

Directly manage C++ worker threads.

Backend should:

Receive PCAP uploads.

Validate requests.

Start and manage engine execution.

Read machine-readable results.

Serve results to the frontend.

Manage runtime files.

C++ engine should:

Perform packet parsing.

Track flows.

Extract SNI.

Classify traffic.

Apply rules.

Produce output and analysis results.

23. Project Positioning

NetInspect should be presented primarily as:

A C++17 multi-threaded Deep Packet Inspection engine for PCAP-based network traffic analysis.

Primary areas:

Computer Networks +
C++17 Systems Programming +
Deep Packet Inspection +
Network Traffic Analysis

Secondary area:

Network Security

The project should not claim capabilities that are not currently implemented, such as live packet capture, ML-based classification, threat-intelligence feeds, or production firewall functionality.

24. One-Line Technical Description

NetInspect is a C++17 multi-threaded Deep Packet Inspection engine that analyzes PCAP-based network traffic, parses TCP/UDP packets, tracks flows, extracts TLS SNI, identifies applications/domains, and applies configurable traffic filtering rules.

25. Final Architecture Summary

                    +----------------------+
                    |      FRONTEND        |
                    | React / TypeScript   |
                    +----------+-----------+
                               |
                         HTTP / JSON
                               |
                    +----------v-----------+
                    |       BACKEND        |
                    | Node.js / TypeScript |
                    +----------+-----------+
                               |
                        Process Control
                               |
                    +----------v-----------+
                    |    C++17 ENGINE      |
                    |      NetInspect      |
                    +----------+-----------+
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
        PCAP Reader       DPI Analysis      Rule Engine
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
         Packet Parser   Flow Tracking   TLS / SNI
              |               |               |
              +---------------+---------------+
                              |
                              v
                    Application / Domain
                         Detection
                              |
                              v
                       Forward / Drop
                         /        \
                        v          v
                  Output PCAP   JSON Results
                                   |
                                   v
                              Backend API
                                   |
                                   v
                               Frontend

26. Guiding Principle

The central design principle of NetInspect is:

C++ performs the network analysis; the backend manages the engine; the frontend visualizes the results.

This keeps the networking and DPI logic in the C++17 core while allowing the project to evolve into a complete web-based network traffic analysis application.

27. Detailed Target Project Tree — File by File

The following is the complete planned NetInspect repository layout.
It is intentionally detailed so that the project can be reorganized without losing track of where each current file belongs and what each future layer is responsible for.

NetInspect/
│
├── PROJECT_BLUEPRINT.md
│ └── Complete project blueprint, architecture, development plan,
│ component responsibilities, data flow, and integration design.
│
├── README.md
│ └── Public GitHub project documentation and quick-start guide.
│
├── LICENSE
│ └── Project license.
│
├── .gitignore
│ └── Ignores build artifacts, runtime files, dependencies,
│ local databases, environment files, and generated outputs.
│
├── CMakeLists.txt
│ └── Root CMake configuration for the C++ engine.
│
│
├── engine/
│ │
│ ├── CMakeLists.txt
│ │ └── CMake configuration dedicated to the C++17 DPI engine.
│ │
│ ├── include/
│ │ │
│ │ ├── connection_tracker.h
│ │ │ └── Flow/connection state and five-tuple tracking declarations.
│ │ │
│ │ ├── dpi_engine.h
│ │ │ └── High-level DPI engine/orchestration declarations.
│ │ │
│ │ ├── fast_path.h
│ │ │ └── Fast-path worker declarations for packet processing.
│ │ │
│ │ ├── load_balancer.h
│ │ │ └── Load-balancer worker declarations.
│ │ │
│ │ ├── packet_parser.h
│ │ │ └── Ethernet, IPv4, TCP and UDP parsing declarations.
│ │ │
│ │ ├── pcap_reader.h
│ │ │ └── PCAP global/packet header and packet-reading declarations.
│ │ │
│ │ ├── platform.h
│ │ │ └── Platform-specific definitions/helpers.
│ │ │
│ │ ├── rule_manager.h
│ │ │ └── IP, application and domain blocking-rule declarations.
│ │ │
│ │ ├── sni_extractor.h
│ │ │ └── TLS SNI / hostname extraction declarations.
│ │ │
│ │ ├── thread_safe_queue.h
│ │ │ └── Thread-safe producer-consumer queue implementation.
│ │ │
│ │ └── types.h
│ │ └── FiveTuple, Flow, AppType and shared data structures.
│ │
│ ├── src/
│ │ │
│ │ ├── connection_tracker.cpp
│ │ │ └── Flow tracking implementation.
│ │ │
│ │ ├── dpi_engine.cpp
│ │ │ └── High-level DPI engine implementation.
│ │ │
│ │ ├── dpi_mt.cpp
│ │ │ └── Multi-threaded engine entry point / processing pipeline.
│ │ │
│ │ ├── fast_path.cpp
│ │ │ └── Fast-path worker implementation.
│ │ │
│ │ ├── load_balancer.cpp
│ │ │ └── Load-balancer worker implementation.
│ │ │
│ │ ├── main.cpp
│ │ │ └── Existing main entry point.
│ │ │
│ │ ├── main_dpi.cpp
│ │ │ └── Existing DPI-oriented entry point.
│ │ │
│ │ ├── main_simple.cpp
│ │ │ └── Existing simple/single-threaded entry point.
│ │ │
│ │ ├── main_working.cpp
│ │ │ └── Existing working single-threaded implementation used
│ │ │ for understanding and validating the basic pipeline.
│ │ │
│ │ ├── packet_parser.cpp
│ │ │ └── Network protocol parsing implementation.
│ │ │
│ │ ├── pcap_reader.cpp
│ │ │ └── PCAP reading implementation.
│ │ │
│ │ ├── rule_manager.cpp
│ │ │ └── Rule registration and blocking implementation.
│ │ │
│ │ ├── sni_extractor.cpp
│ │ │ └── TLS SNI extraction implementation.
│ │ │
│ │ └── types.cpp
│ │ └── Shared type helpers and application classification logic.
│ │
│ ├── tests/
│ │ ├── packet_parser_tests.cpp
│ │ ├── sni_extractor_tests.cpp
│ │ ├── rule_manager_tests.cpp
│ │ ├── connection_tracker_tests.cpp
│ │ └── integration_tests.cpp
│ │ └── Future unit/integration test locations.
│ │
│ └── build/
│ └── Local CMake build output; should not be committed.
│
│
├── backend/
│ │
│ ├── package.json
│ │ └── Node.js backend dependencies and scripts.
│ │
│ ├── tsconfig.json
│ │ └── TypeScript compiler configuration.
│ │
│ ├── src/
│ │ │
│ │ ├── server.ts
│ │ │ └── Backend application/server entry point.
│ │ │
│ │ ├── routes/
│ │ │ ├── analysis.routes.ts
│ │ │ ├── traffic.routes.ts
│ │ │ ├── flow.routes.ts
│ │ │ ├── application.routes.ts
│ │ │ ├── domain.routes.ts
│ │ │ ├── rule.routes.ts
│ │ │ ├── report.routes.ts
│ │ │ └── output.routes.ts
│ │ │ └── HTTP route definitions.
│ │ │
│ │ ├── controllers/
│ │ │ ├── analysis.controller.ts
│ │ │ ├── traffic.controller.ts
│ │ │ ├── flow.controller.ts
│ │ │ ├── application.controller.ts
│ │ │ ├── domain.controller.ts
│ │ │ ├── rule.controller.ts
│ │ │ ├── report.controller.ts
│ │ │ └── output.controller.ts
│ │ │ └── Request/response handling.
│ │ │
│ │ ├── services/
│ │ │ ├── engine.service.ts
│ │ │ ├── analysis.service.ts
│ │ │ ├── pcap.service.ts
│ │ │ ├── result.service.ts
│ │ │ ├── rule.service.ts
│ │ │ ├── report.service.ts
│ │ │ └── storage.service.ts
│ │ │ └── Business logic and C++ engine integration.
│ │ │
│ │ ├── middleware/
│ │ │ ├── error.middleware.ts
│ │ │ ├── upload.middleware.ts
│ │ │ └── validation.middleware.ts
│ │ │
│ │ ├── models/
│ │ │ ├── analysis.model.ts
│ │ │ ├── rule.model.ts
│ │ │ └── report.model.ts
│ │ │
│ │ ├── types/
│ │ │ ├── analysis.types.ts
│ │ │ ├── traffic.types.ts
│ │ │ ├── flow.types.ts
│ │ │ └── rule.types.ts
│ │ │
│ │ └── utils/
│ │ ├── logger.ts
│ │ ├── file.utils.ts
│ │ └── process.utils.ts
│ │
│ └── dist/
│ └── Compiled backend output; should not be committed.
│
│
├── frontend/
│ │
│ ├── package.json
│ │ └── Frontend dependencies and scripts.
│ │
│ ├── tsconfig.json
│ │ └── TypeScript configuration.
│ │
│ ├── vite.config.ts
│ │ └── Vite configuration.
│ │
│ └── src/
│ │
│ ├── App.tsx
│ │ └── Main React application.
│ │
│ ├── main.tsx
│ │ └── React application entry point.
│ │
│ ├── pages/
│ │ ├── Dashboard.tsx
│ │ ├── AnalyzePcap.tsx
│ │ ├── ProcessingPipeline.tsx
│ │ ├── PacketAnalyzer.tsx
│ │ ├── Flows.tsx
│ │ ├── Applications.tsx
│ │ ├── Domains.tsx
│ │ ├── Rules.tsx
│ │ ├── Reports.tsx
│ │ └── Architecture.tsx
│ │ └── Main application screens.
│ │
│ ├── components/
│ │ ├── layout/
│ │ │ ├── Sidebar.tsx
│ │ │ ├── Header.tsx
│ │ │ └── PageContainer.tsx
│ │ │
│ │ ├── dashboard/
│ │ │ ├── StatCard.tsx
│ │ │ ├── ProtocolChart.tsx
│ │ │ ├── DecisionChart.tsx
│ │ │ └── TrafficChart.tsx
│ │ │
│ │ ├── packet/
│ │ │ ├── PacketTable.tsx
│ │ │ ├── PacketFilters.tsx
│ │ │ ├── PacketDetails.tsx
│ │ │ └── ProtocolTree.tsx
│ │ │
│ │ ├── flow/
│ │ │ ├── FlowTable.tsx
│ │ │ └── FlowDetails.tsx
│ │ │
│ │ ├── rules/
│ │ │ ├── RuleTable.tsx
│ │ │ ├── RuleForm.tsx
│ │ │ └── RuleDialog.tsx
│ │ │
│ │ └── common/
│ │ ├── StatusBadge.tsx
│ │ ├── LoadingState.tsx
│ │ ├── EmptyState.tsx
│ │ └── ErrorState.tsx
│ │
│ ├── layouts/
│ │ └── DashboardLayout.tsx
│ │
│ ├── hooks/
│ │ ├── useAnalysis.ts
│ │ ├── useTraffic.ts
│ │ ├── useFlows.ts
│ │ └── useRules.ts
│ │
│ ├── services/
│ │ ├── api.ts
│ │ ├── analysis.api.ts
│ │ ├── traffic.api.ts
│ │ ├── flow.api.ts
│ │ ├── rule.api.ts
│ │ └── report.api.ts
│ │
│ ├── types/
│ │ ├── analysis.ts
│ │ ├── packet.ts
│ │ ├── flow.ts
│ │ ├── application.ts
│ │ ├── domain.ts
│ │ └── rule.ts
│ │
│ └── utils/
│ ├── format.ts
│ ├── filters.ts
│ └── constants.ts
│
│
├── storage/
│ │
│ ├── uploads/
│ │ ├── .gitkeep
│ │ └── User-uploaded input PCAP files.
│ │
│ ├── outputs/
│ │ ├── .gitkeep
│ │ └── Filtered/output PCAP files generated by the engine.
│ │
│ ├── results/
│ │ ├── .gitkeep
│ │ └── Machine-readable JSON analysis results.
│ │
│ └── reports/
│ ├── .gitkeep
│ └── Generated analysis reports.
│
│
├── database/
│ ├── schema.sql
│ │ └── SQLite schema definition.
│ │
│ └── netinspect.db
│ └── Local SQLite database; should not be committed.
│
│
├── samples/
│ ├── test_dpi.pcap
│ │ └── Main sample capture used for engine testing.
│ │
│ ├── blocked.pcap
│ │ └── Sample capture used for blocking-rule testing.
│ │
│ └── unblocked.pcap
│ └── Sample capture used for allowed-traffic testing.
│
│
├── scripts/
│ ├── generate_test_pcap.py
│ │ └── Test PCAP generation utility.
│ │
│ ├── build_engine.ps1
│ │ └── Windows engine build helper.
│ │
│ └── run_demo.ps1
│ └── Optional demo workflow.
│
│
├── docs/
│ │
│ ├── architecture/
│ │ ├── system.md
│ │ ├── engine.md
│ │ ├── backend.md
│ │ └── frontend.md
│ │
│ ├── api/
│ │ └── api.md
│ │
│ └── development/
│ ├── setup.md
│ ├── testing.md
│ └── contributing.md
│
│
└── .vscode/
├── c_cpp_properties.json
├── settings.json
└── tasks.json

28. Current Files → Target Locations

This section maps the existing working repository to the future monorepo structure.

Current location

Target location

include/connection_tracker.h

engine/include/connection_tracker.h

include/dpi_engine.h

engine/include/dpi_engine.h

include/fast_path.h

engine/include/fast_path.h

include/load_balancer.h

engine/include/load_balancer.h

include/packet_parser.h

engine/include/packet_parser.h

include/pcap_reader.h

engine/include/pcap_reader.h

include/platform.h

engine/include/platform.h

include/rule_manager.h

engine/include/rule_manager.h

include/sni_extractor.h

engine/include/sni_extractor.h

include/thread_safe_queue.h

engine/include/thread_safe_queue.h

include/types.h

engine/include/types.h

src/connection_tracker.cpp

engine/src/connection_tracker.cpp

src/dpi_engine.cpp

engine/src/dpi_engine.cpp

src/dpi_mt.cpp

engine/src/dpi_mt.cpp

src/fast_path.cpp

engine/src/fast_path.cpp

src/load_balancer.cpp

engine/src/load_balancer.cpp

src/main.cpp

engine/src/main.cpp

src/main_dpi.cpp

engine/src/main_dpi.cpp

src/main_simple.cpp

engine/src/main_simple.cpp

src/main_working.cpp

engine/src/main_working.cpp

src/packet_parser.cpp

engine/src/packet_parser.cpp

src/pcap_reader.cpp

engine/src/pcap_reader.cpp

src/rule_manager.cpp

engine/src/rule_manager.cpp

src/sni_extractor.cpp

engine/src/sni_extractor.cpp

src/types.cpp

engine/src/types.cpp

generate_test_pcap.py

scripts/generate_test_pcap.py

test_dpi.pcap

samples/test_dpi.pcap

blocked.pcap

samples/blocked.pcap

unblocked.pcap

samples/unblocked.pcap

generated output.pcap

storage/outputs/

generated blocked output

storage/outputs/

dpi_engine.exe

local engine build output; do not treat as source

dpi_engine

local engine build output; do not treat as source

.vscode/c_cpp_properties.json

.vscode/c_cpp_properties.json

WINDOWS_SETUP.md

can remain at root or move to docs/development/setup.md

structure.txt

replace with this Markdown project-structure document

29. Final Repository View

After the reorganization and full-stack integration, the project should conceptually look like this:

NetInspect/
│
├── PROJECT_BLUEPRINT.md
├── README.md
├── LICENSE
├── .gitignore
├── CMakeLists.txt
│
├── engine/ # C++17 DPI CORE
│ ├── CMakeLists.txt
│ ├── include/ # C++ headers
│ ├── src/ # C++ implementations
│ ├── tests/ # Engine tests
│ └── build/ # Local build output
│
├── backend/ # API + ENGINE CONTROL
│ ├── package.json
│ ├── tsconfig.json
│ └── src/
│ ├── server.ts
│ ├── routes/
│ ├── controllers/
│ ├── services/
│ ├── middleware/
│ ├── models/
│ ├── types/
│ └── utils/
│
├── frontend/ # WEB UI
│ ├── package.json
│ ├── tsconfig.json
│ ├── vite.config.ts
│ └── src/
│ ├── App.tsx
│ ├── main.tsx
│ ├── pages/
│ ├── components/
│ ├── layouts/
│ ├── hooks/
│ ├── services/
│ ├── types/
│ └── utils/
│
├── storage/ # RUNTIME DATA
│ ├── uploads/
│ ├── outputs/
│ ├── results/
│ └── reports/
│
├── database/ # PERSISTENT METADATA
│ ├── schema.sql
│ └── netinspect.db
│
├── samples/ # TEST PCAPS
│ ├── test_dpi.pcap
│ ├── blocked.pcap
│ └── unblocked.pcap
│
├── scripts/ # DEVELOPMENT UTILITIES
│ ├── generate_test_pcap.py
│ ├── build_engine.ps1
│ └── run_demo.ps1
│
├── docs/ # DOCUMENTATION
│ ├── architecture/
│ ├── api/
│ └── development/
│
└── .vscode/
├── c_cpp_properties.json
├── settings.json
└── tasks.json

30. Complete System Data Flow

                         USER
                           |
                           v
                  +------------------+
                  |    FRONTEND      |
                  | React / TS       |
                  +--------+---------+
                           |
                     HTTP / JSON
                           |
                           v
                  +------------------+
                  |     BACKEND      |
                  | Node / TS        |
                  +--------+---------+
                           |
             +-------------+-------------+
             |                           |
             v                           v

    File Management Rule Management
    | |
    +-------------+-------------+
    |
    v
    +------------------+
    | C++17 ENGINE |
    | NetInspect |
    +--------+---------+
    |
    v
    +-------------+
    | PCAP Reader |
    +------+------+
    |
    v
    +-------------+
    | Packet |
    | Parser |
    +------+------+
    |
    v
    +-------------+
    | Five-Tuple |
    | Flow Track |
    +------+------+
    |
    v
    +-------------+
    | TLS / SNI |
    | Extraction |
    +------+------+
    |
    v
    +-------------+
    | Application |
    | Detection |
    +------+------+
    |
    v
    +-------------+
    | Rule Engine |
    +------+------+
    |
    +------+------+
    | |
    ALLOW BLOCK
    | |
    v v
    Output PCAP DROP
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
    USER REPORT

31. Core Architectural Rule

The most important boundary in the complete project is:

┌─────────────────────────────────────────────────────────────┐
│ FRONTEND │
│ │
│ Visualization • Tables • Charts • Filters • User Actions │
└──────────────────────────────┬──────────────────────────────┘
│
JSON/API
│
┌──────────────────────────────▼──────────────────────────────┐
│ BACKEND │
│ │
│ Uploads • API • Engine Control • Results • Storage • DB │
└──────────────────────────────┬──────────────────────────────┘
│
Process / Files
│
┌──────────────────────────────▼──────────────────────────────┐
│ C++17 DPI ENGINE │
│ │
│ PCAP • Parsing • Flow Tracking • SNI • Classification │
│ Rules • Multi-threading • Forward / Drop │
└─────────────────────────────────────────────────────────────┘

Network analysis remains inside the C++ engine.
Backend controls and exposes the engine.
Frontend visualizes the engine's results.

This separation prevents the web layer from becoming a second, inconsistent implementation of the DPI engine.
