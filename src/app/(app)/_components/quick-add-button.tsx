"use client";

import { useState } from "react";
import { GlassModal } from "@/components/glass";
import { SubmissionsQuickAdd } from "./submissions-quick-add";
import { InterviewsQuickAdd } from "./interviews-quick-add";

type Option = { id: string; name: string };
type InFlightSubmission = { id: string; candidateName: string; recruiterId: string; role: { title: string } };

type Step = "choose" | "submissions" | "interviews";

export function QuickAddButton({
  date,
  recruiters,
  roles,
  vendors,
  inFlight,
}: {
  date: string;
  recruiters: Option[];
  roles: Option[];
  vendors: Option[];
  inFlight: InFlightSubmission[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");

  function close() {
    setOpen(false);
    setStep("choose");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className="glass-strong flex items-center justify-center w-11 h-11 rounded-full text-slate-900 text-2xl leading-none hover:bg-white/80 transition-colors shadow-lg"
      >
        +
      </button>

      {open && (
        <GlassModal
          title={
            step === "choose" ? "Quick add" : step === "submissions" ? "Log submissions" : "Log interviews"
          }
          onClose={close}
          wide={step !== "choose"}
        >
          {step === "choose" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setStep("submissions")}
                className="glass rounded-xl p-5 text-left hover:bg-white/70 transition-colors"
              >
                <div className="text-2xl mb-2">📝</div>
                <div className="font-medium text-slate-900 text-sm">Log Submissions</div>
                <p className="text-xs text-slate-500 mt-1">Pick a recruiter and log candidates submitted today.</p>
              </button>
              <button
                onClick={() => setStep("interviews")}
                className="glass rounded-xl p-5 text-left hover:bg-white/70 transition-colors"
              >
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-medium text-slate-900 text-sm">Log Interviews</div>
                <p className="text-xs text-slate-500 mt-1">Advance in-flight candidates to their interview stage.</p>
              </button>
            </div>
          )}

          {step === "submissions" && (
            <SubmissionsQuickAdd date={date} recruiters={recruiters} roles={roles} vendors={vendors} onDone={close} />
          )}

          {step === "interviews" && (
            <InterviewsQuickAdd date={date} recruiters={recruiters} inFlight={inFlight} onDone={close} />
          )}
        </GlassModal>
      )}
    </>
  );
}
