import { NavLink } from "react-router-dom";
import { Satellite, Radar, TrendingDown, LineChart, Info } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Exploration", icon: Radar },
  { to: "/production", label: "Production Forecast", icon: LineChart },
  { to: "/supply-risk", label: "Supply Risk", icon: TrendingDown },
  { to: "/analytics", label: "Analytics", icon: Satellite },
  { to: "/about", label: "About", icon: Info },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-abyss-700/60 bg-abyss-900/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-semibold tracking-tight text-slate-50">
              MANGAN<span className="text-signal-400">EX</span>
            </span>
            <span className="hidden md:inline text-sm text-slate-400 font-body">
              AI + Satellite Intelligence for Manganese Resource Discovery &amp; Supply Resilience
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-signal-500/15 text-signal-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-abyss-800"
                  }`
                }
              >
                <Icon size={15} />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">{children}</main>
      <footer className="border-t border-abyss-700/60 px-6 py-3 text-xs text-slate-500 text-center">
        Prototype built for Smart India Hackathon — all exploration and production figures shown are
        synthetic sample data, not survey results.
      </footer>
    </div>
  );
}
