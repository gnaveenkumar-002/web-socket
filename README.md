# WebSocket Chat Application (AWS Serverless)

A real-time WebSocket-based chat application built using **AWS API Gateway (WebSocket)**, **Lambda**, **DynamoDB**, and **TypeScript**, with strong validation, throttling, and enterprise-level testing & code quality checks.

---

##  Features

- Real-time chat using **WebSocket**
- Group-based messaging (`groupId`)
- Message validation using **Zod**
- Per-connection throttling (1 msg/sec)
- Automatic cleanup of stale WebSocket connections
- Fully serverless architecture
- 100% unit test coverage (statements, lines, functions)
- CI-based static analysis using **SonarCloud**

---

##  Tech Stack

- **AWS API Gateway (WebSocket)**
- **AWS Lambda (Node.js + TypeScript)**
- **AWS DynamoDB**
- **Zod** – runtime validation
- **Jest** – unit testing
- **SonarCloud** – static code analysis
- **GitHub Actions** – CI pipeline

---

##  Project Structure

websocket-chat/
├── src/
│ └── websocket/
│ ├── connect.ts
│ ├── disconnect.ts
│ └── default.ts
├── tests/
│ └── unit/
│ └── test-handler.test.ts
├── template.yaml
├── package.json
├── tsconfig.json
├── sonar-project.properties
└── README.md


---

##  WebSocket Message Format

```json
{
  "action": "sendMessage",
  "groupId": "team-1",
  "user": "nav",
  "message": "Hello everyone"
}

Commands
  sam build
  sam deploy --guided

 Testing

Run unit tests with coverage:

npm test -- --coverage


Coverage includes:

Statements

Lines

Functions

Branches (tracked via SonarCloud)

 Code Quality (SonarCloud)

This project is integrated with SonarCloud to provide:

Code coverage tracking

Branch coverage visibility

Code smells & bugs

Quality Gates (CI enforced)

 Key Design Decisions

Zod is used to ensure runtime safety for WebSocket payloads

Throttling prevents message flooding

Stale WebSocket connections (HTTP 410) are removed automatically

Logic is written to be fully testable and mock-friendly

 Author

GUDDEPPA GARI NAVEEN KUMAR
B.Tech – Computer Science & Engineering
AWS | Serverless | Backend | TypeScript


