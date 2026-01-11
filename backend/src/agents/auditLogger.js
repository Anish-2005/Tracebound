export async function run(step, context) {
  const { timeline = [] } = context;
  const summary = timeline.map((t) => ({ stepId: t.step.stepId, status: t.status }));
  return {
    success: true,
    output: {
      summary,
      message: "Logged workflow state for audit trail.",
    },
  };
}
