import { registry as agents } from "./agents/index.js";
import { ContractClient } from "./contractClient.js";

function baseSteps(instruction) {
  return [
    {
      step_id: "step-1",
      agent_name: "IntentParserAgent",
      action: "Interpret user instruction and derive intents",
      input: instruction,
      conditional_next: { success: "step-2", failure: "step-4-fail" },
    },
    {
      step_id: "step-2",
      agent_name: "PolicyValidatorAgent",
      action: "Validate intents against guardrails",
      input: "Derived intents",
      conditional_next: { success: "step-3", failure: "step-4-fail" },
    },
    {
      step_id: "step-3",
      agent_name: "ExternalServiceAgent",
      action: "Execute mocked external API call",
      input: "Plan",
      conditional_next: { success: "step-4", failure: "step-4-fail" },
    },
    {
      step_id: "step-4",
      agent_name: "LoggerAgent",
      action: "Summarize workflow state",
      input: "Timeline",
      conditional_next: { success: null, failure: null },
    },
    {
      step_id: "step-4-fail",
      agent_name: "LoggerAgent",
      action: "Log failure and halt",
      input: "Failure reason",
      conditional_next: { success: null, failure: null },
    },
  ];
}

export function buildWorkflow(instruction) {
  return {
    id: `wf-${Date.now()}`,
    instruction,
    steps: baseSteps(instruction),
  };
}

export async function executeWorkflow(instruction, contractClient) {
  const workflow = buildWorkflow(instruction);
  const stepsById = Object.fromEntries(workflow.steps.map((s) => [s.step_id, s]));
  const timeline = [];
  const context = { instruction, timeline };
  const chain = { workflowId: null, txs: [] };

  let currentId = workflow.steps[0]?.step_id;

  if (contractClient?.isEnabled()) {
    const created = await contractClient.createWorkflow(instruction);
    chain.workflowId = created.workflowId;
    if (created.txHash) chain.txs.push({ type: "create", hash: created.txHash });
  }

  while (currentId) {
    const step = stepsById[currentId];
    if (!step) break;
    const agent = agents[step.agent_name];
    if (!agent) {
      timeline.push({ step, status: "failure", output: { error: "missing agent" } });
      break;
    }

    const result = await agent.run(step, context);
    const status = result.success ? "success" : "failure";

    const record = { step, status, output: result.output };
    timeline.push(record);
    context.timeline = timeline;

    if (chain.workflowId && contractClient?.isEnabled()) {
      const logged = await contractClient.logStep(
        chain.workflowId,
        step.step_id,
        status,
        result.output
      );
      if (logged.txHash) chain.txs.push({ type: "step", stepId: step.step_id, hash: logged.txHash });
    }

    currentId = step.conditional_next[status === "success" ? "success" : "failure"];
  }

  const finalStatus = timeline.at(-1)?.status === "failure" ? "failure" : "success";
  if (chain.workflowId && contractClient?.isEnabled()) {
    const finalized = await contractClient.finalizeWorkflow(chain.workflowId, finalStatus === "success");
    if (finalized.txHash) chain.txs.push({ type: "finalize", hash: finalized.txHash });
  }

  return {
    workflow,
    timeline,
    chain,
    finalStatus,
  };
}

export function buildContractClientFromEnv(env) {
  const enabled = env.ENABLE_ONCHAIN !== "false";
  return new ContractClient({
    rpcUrl: env.RPC_URL,
    privateKey: env.PRIVATE_KEY,
    contractAddress: env.CONTRACT_ADDRESS,
    enabled,
  });
}
