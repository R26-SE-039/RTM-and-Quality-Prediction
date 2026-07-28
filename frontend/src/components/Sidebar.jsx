import {
  AlertTriangle,
  BarChart3,
  Code2,
  FlaskConical,
  LayoutGrid,
  Moon,
  ShoppingCart,
  Sun,
  Table2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/inventory", label: "Test Inventory", icon: ShoppingCart },
  { to: "/quality-prediction", label: "Quality Prediction", icon: FlaskConical },
  { to: "/rtm", label: "RTM Matrix", icon: Table2 },
  { to: "/gaps", label: "Coverage Gaps", icon: AlertTriangle },
  { to: "/coverage", label: "Code Coverage", icon: Code2 },
];

export default function Sidebar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <aside className="flex h-screen w-[280px] shrink-0 flex-col bg-white">
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <BarChart3 size={20} className="text-white" />
          </span>
          <span className="text-lg font-bold text-white">NextGen QA</span>
        </div>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="rounded-md p-1.5 text-white/90 hover:bg-white/10"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 p-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-[0.95rem] font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
        <p>© 2026 NextGen QA</p>
        <p className="mt-1.5 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          System Online
        </p>
      </div>
    </aside>
  );
}
