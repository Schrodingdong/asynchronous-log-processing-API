-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "statistics" JSONB NOT NULL,

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogError" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "jobId" INTEGER NOT NULL,

    CONSTRAINT "LogError_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LogError" ADD CONSTRAINT "LogError_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
