-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('MANUAL', 'GITHUB_PR');

-- CreateEnum
CREATE TYPE "ReviewRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('PASS', 'COMMENT', 'REQUEST_CHANGES', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "FindingCategory" AS ENUM ('BUG', 'SECURITY', 'DESIGN', 'PERFORMANCE', 'MAINTAINABILITY', 'TESTING');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "FindingConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "FindingSource" AS ENUM ('AI', 'STATIC_ANALYZER', 'CI', 'MANUAL');

-- CreateEnum
CREATE TYPE "FindingValidationStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AnalyzerStatus" AS ENUM ('PASSED', 'FAILED', 'SKIPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "FeedbackVerdict" AS ENUM ('ACCEPTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "RepositoryConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'github',
    "installationId" TEXT,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "permissions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepositoryConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequest" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "baseSha" TEXT NOT NULL,
    "headSha" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pullRequestId" TEXT,
    "source" "ReviewSource" NOT NULL DEFAULT 'MANUAL',
    "status" "ReviewRunStatus" NOT NULL DEFAULT 'QUEUED',
    "outcome" "ReviewOutcome",
    "inputKind" TEXT NOT NULL,
    "language" TEXT,
    "baseSha" TEXT,
    "headSha" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "configVersion" TEXT,
    "summary" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReviewRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRunFinding" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "category" "FindingCategory" NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "confidence" "FindingConfidence" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "filePath" TEXT,
    "startLine" INTEGER,
    "endLine" INTEGER,
    "evidence" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "suggestedFix" TEXT,
    "source" "FindingSource" NOT NULL,
    "validationStatus" "FindingValidationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRunFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRunCheck" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "analyzer" TEXT NOT NULL,
    "status" "AnalyzerStatus" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRunCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewFeedback" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verdict" "FeedbackVerdict" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationCase" (
    "id" TEXT NOT NULL,
    "datasetVersion" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "language" TEXT,
    "category" TEXT,
    "inputKind" TEXT NOT NULL,
    "inputRef" TEXT NOT NULL,
    "expectedFindings" JSONB NOT NULL,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewEvaluationRun" (
    "id" TEXT NOT NULL,
    "datasetVersion" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT,
    "precision" DOUBLE PRECISION,
    "recall" DOUBLE PRECISION,
    "f1" DOUBLE PRECISION,
    "falsePositives" INTEGER,
    "sampleSize" INTEGER,
    "medianLatency" INTEGER,
    "p95Latency" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewEvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepositoryConnection_userId_idx" ON "RepositoryConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryConnection_provider_owner_repo_key" ON "RepositoryConnection"("provider", "owner", "repo");

-- CreateIndex
CREATE INDEX "PullRequest_connectionId_idx" ON "PullRequest"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_connectionId_number_headSha_key" ON "PullRequest"("connectionId", "number", "headSha");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRun_idempotencyKey_key" ON "ReviewRun"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ReviewRun_userId_idx" ON "ReviewRun"("userId");

-- CreateIndex
CREATE INDEX "ReviewRun_pullRequestId_idx" ON "ReviewRun"("pullRequestId");

-- CreateIndex
CREATE INDEX "ReviewRun_status_idx" ON "ReviewRun"("status");

-- CreateIndex
CREATE INDEX "ReviewRunFinding_runId_idx" ON "ReviewRunFinding"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRunFinding_runId_fingerprint_key" ON "ReviewRunFinding"("runId", "fingerprint");

-- CreateIndex
CREATE INDEX "ReviewRunCheck_runId_idx" ON "ReviewRunCheck"("runId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_findingId_idx" ON "ReviewFeedback"("findingId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewFeedback_findingId_userId_key" ON "ReviewFeedback"("findingId", "userId");

-- CreateIndex
CREATE INDEX "EvaluationCase_datasetVersion_idx" ON "EvaluationCase"("datasetVersion");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCase_datasetVersion_slug_key" ON "EvaluationCase"("datasetVersion", "slug");

-- CreateIndex
CREATE INDEX "ReviewEvaluationRun_datasetVersion_idx" ON "ReviewEvaluationRun"("datasetVersion");

-- AddForeignKey
ALTER TABLE "RepositoryConnection" ADD CONSTRAINT "RepositoryConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "RepositoryConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRun" ADD CONSTRAINT "ReviewRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRun" ADD CONSTRAINT "ReviewRun_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRunFinding" ADD CONSTRAINT "ReviewRunFinding_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReviewRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRunCheck" ADD CONSTRAINT "ReviewRunCheck_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReviewRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "ReviewRunFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
