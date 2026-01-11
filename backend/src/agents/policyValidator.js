const banned = ["exploit", "fraud", "ddos", "phishing", "ransom"];

export async function run(step, context) {
  const text = `${context.instruction} ${JSON.stringify(context.intents || [])}`.toLowerCase();
  const flagged = banned.filter((word) => text.includes(word));
  const success = flagged.length === 0;

  return {
    success,
    output: success
      ? { status: "clean", checkedAgainst: banned }
      : { status: "blocked", reason: `Flagged terms: ${flagged.join(", ")}` },
  };
}
