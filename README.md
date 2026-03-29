# cribl-auth-service

Authentication and authorization microservice for the Cribl platform.

## Overview

Handles login, token issuance (JWT), refresh, and revocation for internal platform APIs.

## Setup

```bash
cp .env.example .env
npm install
npm start
```

## Endpoints

| Method | Path           | Auth     | Description                    |
|--------|----------------|----------|--------------------------------|
| POST   | /auth/login    | None     | Issue access + refresh tokens  |
| POST   | /auth/refresh  | None     | Rotate access token            |
| POST   | /auth/logout   | Bearer   | Revoke session                 |
| GET    | /auth/me       | Bearer   | Current user info              |
| GET    | /health        | None     | Liveness probe                 |

## Environment

See `.env.example` for required variables.
