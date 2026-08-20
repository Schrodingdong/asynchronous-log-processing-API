# Asynchronous log processing API
A simple Log processing API built with Typescript and Prisma.

**Techstack**

Nodejs, ExpressJS, Typescript, Prisma ORM, PosgreSQL, BullMQ, Redis, MinIO

# Quickstart
- Run the compose dependencies
```env
docker compose up -d
```
- Setup .env file
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
SALT=...
JWT_SECRET=...
```
- Setup pnpm and prisma
```shell
pnpm install
pnpm prisma generate
# Assuming empty db
pnpm prisma migrate deploy
```
- Start the backend
```
pnpm start
```

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
