import { registry as agents } from "./agents/index.js";
import { ContractClient } from "./contractClient.js";

function baseSteps(instruction) {
  return [
    {
      stepId: "step-1",
      agent: "IntentParserAgent",
      action: "Interpret user instruction and derive intents",
      input: { instruction },
      onSuccess: "step-2",
      onFailure: "step-4-fail",
    },
    {
      stepId: "step-2",
      agent: "PolicyCheckAgent",
      action: "Validate intents against guardrails",
      input: { derived: "intents" },
      onSuccess: "step-3",
      onFailure: "step-4-fail",
    },
    {
      stepId: "step-3",
      agent: "MockExternalServiceAgent",
      action: "Execute mocked external API call",
      input: { plan: "derived plan" },
      onSuccess: "step-4",
      onFailure: "step-4-fail",
    },
    {
      stepId: "step-4",
      agent: "AuditLoggerAgent",
      action: "Summarize workflow state",
      input: { timeline: true },
      onSuccess: null,
      onFailure: null,
    },
    {
      stepId: "step-4-fail",
      agent: "AuditLoggerAgent",
      action: "Log failure and halt",
      input: { failure: true },
      onSuccess: null,
      onFailure: null,
    },
  ];
}

export function buildWorkflow(instruction) {
  return {
    workflowId: `wf-${Date.now()}`,
    intent: instruction,
    steps: baseSteps(instruction),
  };
}

export async function executeWorkflow(instruction, contractClient) {
  const workflow = buildWorkflow(instruction);
  const stepsById = Object.fromEntries(workflow.steps.map((s) => [s.stepId, s]));
  const timeline = [];
  const context = { instruction, timeline };
  const chain = { workflowId: null, txs: [] };

  let currentId = workflow.steps[0]?.stepId;

  if (contractClient?.isEnabled()) {
    const created = await contractClient.createWorkflow(instruction);
    chain.workflowId = created.workflowId;
    if (created.txHash) chain.txs.push({ type: "create", hash: created.txHash });
  }

  while (currentId) {
    const step = stepsById[currentId];
    if (!step) break;
    const agent = agents[step.agent];
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
        step.stepId,
        step.agent,
        status,
        result.output
      );
      if (logged.txHash) chain.txs.push({ type: "step", stepId: step.stepId, hash: logged.txHash });
    }

    currentId = status === "success" ? step.onSuccess : step.onFailure;
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
