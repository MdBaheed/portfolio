export function Panel({
  title,
  subtitle,
  children,
  className = "",
  action,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`bg-abyss-900/60 border border-abyss-700/60 rounded-lg overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-abyss-700/60">
          <div>
            {title && (
              <h3 className="font-display text-sm font-semibold text-slate-100 tracking-wide">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

const RISK_STYLES: Record<string, string> = {
  HIGH: "bg-risk-high/15 text-risk-high border-risk-high/30",
  MODERATE: "bg-risk-medium/15 text-risk-medium border-risk-medium/30",
  MEDIUM: "bg-risk-medium/15 text-risk-medium border-risk-medium/30",
  LOW: "bg-risk-low/15 text-risk-low border-risk-low/30",
};

export function RiskBadge({ level }: { level: string }) {
  const style = RISK_STYLES[level] ?? RISK_STYLES.MEDIUM;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${style}`}
    >
      {level}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "risk-low" | "risk-medium" | "risk-high" | "signal";
}) {
  const toneClass =
    tone === "risk-low"
      ? "text-risk-low"
      : tone === "risk-medium"
      ? "text-risk-medium"
      : tone === "risk-high"
      ? "text-risk-high"
      : tone === "signal"
      ? "text-signal-400"
      : "text-slate-100";
  return (
    <div className="bg-abyss-900/60 border border-abyss-700/60 rounded-lg px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`font-display text-2xl font-semibold ${toneClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function SampleDataTag() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-slate-500 border border-abyss-600 rounded px-1.5 py-0.5">
      Prototype / Sample Data
    </span>
  );
}
