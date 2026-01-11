import React from "react";

type Props = {
  instruction: string;
  setInstruction: (v: string) => void;
  focused: boolean;
  setFocused: (v: boolean) => void;
  previewWorkflow: (v?: string) => void;
  presets: string[];
};

export default function IntentInput({ instruction, setInstruction, focused, setFocused, previewWorkflow, presets }: Props) {
  return (
    <section className="space-y-3">
      <div className="text-lg font-plex font-semibold">Describe the workflow intent</div>
      <div className="rounded-xl border border-ledger-line bg-ledger-surface/60 p-2 sm:p-3.5">
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder='"Validate a request, call service, and log the outcome"'
          className="w-full resize-none bg-transparent text-ledger-text outline-none placeholder:text-ledger-muted text-base sm:text-base md:text-lg"
          rows={3}
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {(focused || instruction.trim().length > 0) && (
            <button
              onClick={() => previewWorkflow()}
              className="rounded-lg border border-ledger-line px-4 py-2 text-base font-medium text-ledger-text hover:border-ledger-accent active:scale-95 transition sm:text-sm"
              type="button"
            >
              Generate Workflow
            </button>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-ledger-muted mt-2 sm:mt-0">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setInstruction(p);
                  previewWorkflow(p);
                }}
                className="rounded-full border border-ledger-line px-4 py-2 text-base sm:text-xs text-ledger-muted hover:border-ledger-accent hover:text-ledger-text active:scale-95 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
