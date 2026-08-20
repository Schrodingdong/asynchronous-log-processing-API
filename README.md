# Asynchronous log processing API
A simple Log processing API built with Typescript and Prisma.

**Techstack**
- Nodejs
- ExpressJS
- Typescript
- Prisma ORM
- PosgreSQL
- BullMQ
- Redis
- Minioe

# Scenario
- Registered Users would send a log file to the API
- The log file will automatically be load balanced among workers 
- Each worker will analyse the log file and extract the errors
- Other than the auth endpoints, all the other endpoints are secured with JWT

# Endpoints
```shell
/auth/login
/auth/register
/logs
/jobs
/jobs/:jobId
```
