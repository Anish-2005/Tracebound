export async function run(step, context) {
  const raw = step.input || context.instruction || "";
  const sentences = raw
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const intents = sentences.map((s, idx) => ({
    id: `intent-${idx + 1}`,
    summary: s,
  }));

  const plan = intents.map((intent, idx) => ({
    order: idx + 1,
    action: intent.summary,
    owner: "ExternalServiceAgent",
  }));

  context.intents = intents;
  context.plan = plan;

  return {
    success: true,
    output: {
      intents,
      plan,
      note: "Parsed intents with simple rule-based splitter.",
    },
  };
}
