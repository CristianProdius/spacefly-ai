# Agent Instructions

- Do not start local development servers, watchers, or service instances for this project. The user runs dev processes manually.
- For local development, assume the project is already available on ports `5001` and `5002`.
- Treat `5001` as the admin app port and `5002` as the client app port unless the user says otherwise.
- If verification needs a running app or service, use the existing user-managed ports and report when a required service is unavailable instead of starting it.
