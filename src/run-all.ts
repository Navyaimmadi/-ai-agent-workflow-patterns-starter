import { handleRunError, printSection } from "./lib/io";
import { runPromptChaining } from "./patterns/01-prompt-chaining";
import { runRouting } from "./patterns/02-routing";
import { runParallelization } from "./patterns/03-parallelization";
import { runOrchestratorWorker } from "./patterns/04-orchestrator-worker";
import { runEvaluatorOptimizer } from "./patterns/05-evaluator-optimizer";

async function runAllPatterns(): Promise<void> {
  printSection(
    "Starting",
    "Running all five patterns one after another. This makes multiple paid API calls.",
  );

  await runPromptChaining();
  await runRouting();
  await runParallelization();
  await runOrchestratorWorker();
  await runEvaluatorOptimizer();

  printSection("Complete", "All five pattern commands finished successfully.");
}

runAllPatterns().catch(handleRunError);
