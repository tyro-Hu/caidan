import type { TimelineStep } from "@/lib/mock-data";

export function OrderTimeline({ timeline }: { timeline: TimelineStep[] }) {
  return (
    <ol className="space-y-4">
      {timeline.map((step) => {
        const toneClass =
          step.state === "done"
            ? "bg-basil text-white"
            : step.state === "active"
              ? "bg-accent text-white"
              : "bg-[rgba(31,35,25,0.08)] text-[rgba(31,35,25,0.62)]";

        return (
          <li
            key={`${step.title}-${step.time}`}
            className="flex gap-4 rounded-[24px] border border-line bg-white/72 p-4"
          >
            <div
              className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${toneClass}`}
            >
              {step.state === "done" ? "1" : step.state === "active" ? "2" : "3"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold">{step.title}</p>
                <p className="text-sm font-medium text-[rgba(31,35,25,0.56)]">
                  {step.time}
                </p>
              </div>
              <p className="mt-2 text-sm leading-7 text-[rgba(31,35,25,0.64)]">
                {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
