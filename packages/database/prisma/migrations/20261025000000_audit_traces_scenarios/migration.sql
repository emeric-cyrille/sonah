-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "policy_gaps";

-- CreateTable
CREATE TABLE "traces" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "conversationId" TEXT,
    "scenarioRunId" TEXT,
    "agentId" TEXT,
    "verdict" TEXT NOT NULL,
    "promptVersion" TEXT,
    "model" TEXT,
    "steps" JSONB NOT NULL,
    "prevHash" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "traces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_runs" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "totalSteps" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenario_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_run_steps" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "event" JSONB NOT NULL,
    "responses" JSONB NOT NULL,
    "gaps" JSONB NOT NULL,
    "injectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_run_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "traces_sequence_key" ON "traces"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "traces_hash_key" ON "traces"("hash");

-- CreateIndex
CREATE INDEX "traces_conversationId_idx" ON "traces"("conversationId");

-- CreateIndex
CREATE INDEX "traces_scenarioRunId_idx" ON "traces"("scenarioRunId");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_run_steps_runId_step_key" ON "scenario_run_steps"("runId", "step");

-- AddForeignKey
ALTER TABLE "scenario_run_steps" ADD CONSTRAINT "scenario_run_steps_runId_fkey" FOREIGN KEY ("runId") REFERENCES "scenario_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Journal d'audit en ajout seul : toute modification ou suppression d'une trace est refusée
CREATE FUNCTION "traces_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Le journal d''audit est en ajout seul (opération % refusée)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "traces_no_update_delete"
  BEFORE UPDATE OR DELETE ON "traces"
  FOR EACH ROW EXECUTE FUNCTION "traces_append_only"();

