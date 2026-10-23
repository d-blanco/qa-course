# BookNook Sample App

The online bookstore used throughout the course labs. Requirements are in [REQUIREMENTS.md](REQUIREMENTS.md).

> BookNook contains **intentional defects**. Finding them is part of the labs, so please don't fix them unless a lab tells you to.

## Run It

Requires Node.js 22 or later.

```bash
cd sample-app
npm install
npm start
```

Open http://localhost:3000.

To use a different port: `PORT=4000 npm start` (macOS/Linux) or `$env:PORT=4000; npm start` (PowerShell).

**Slow mode** (Lab 3.4): `npm run start:slow` adds a random 0–1.5 s delay to every API call, like a slow network or a busy CI machine. For a different maximum: `node server.js --latency 3000`.

## Logs

Every API request, login attempt, discount code, and server error is logged to the terminal **and** to `sample-app/logs/booknook.log`.

To watch the log live:
- PowerShell: `Get-Content logs\booknook.log -Wait -Tail 20`
- macOS/Linux/Git Bash: `tail -f logs/booknook.log`

## Test Accounts

| Email | Password |
|-------|----------|
| `qa.user@booknook.test` | `Passw0rd!` |
| `second.user@booknook.test` | `Passw0rd!` |

Five failed logins in a row lock an account for 15 minutes.

## Reset

All data is in memory. Either restart the server (`Ctrl+C`, then `npm start`) or send:

```bash
curl -X POST http://localhost:3000/api/test/reset
```

In Windows PowerShell: `Invoke-RestMethod -Method Post http://localhost:3000/api/test/reset`

The reset endpoint clears all carts, sessions, and lockouts and restores the test accounts. Automated tests call it before each test.

## Discount Codes for Testing

| Code | Type | Expires |
|------|------|---------|
| `SAVE15` | 15% off | 2030-12-31 |
| `FIVEOFF` | $5.00 off | 2030-12-31 |
| `SUMMER20` | 20% off | 2025-08-31 |
