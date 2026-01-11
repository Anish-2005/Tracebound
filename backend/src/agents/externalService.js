function simulateLatency(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function run(step, context) {
  await simulateLatency();
  const plan = context.plan || [];
  const payload = {
    executed: plan.slice(0, 2),
    note: "Mock external API invocation; deterministic subset of plan executed for demo.",
  };

  // 15% failure chance to exercise branching
  const success = Math.random() > 0.15;

  return {
    success,
    output: success
      ? payload
      : { error: "Mock external service failure", attempted: payload.executed },
  };
}
