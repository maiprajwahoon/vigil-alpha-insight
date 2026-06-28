import { createFileRoute } from "@tanstack/react-router";
import { SectionHeading } from "@/components/Primitives";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — LynchMark" }] }),
  component: Settings,
});

function Settings() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Settings</p>
        <h1 className="font-display mt-2 text-4xl">Preferences</h1>
      </div>

      <div className="glass-card p-6">
        <SectionHeading title="Profile" subtitle="How you appear inside LynchMark" />
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Full name", val: "Anand Mehta" },
            { label: "Email", val: "anand@lynchmark.io" },
            { label: "Default exchange", val: "NSE" },
            { label: "Time zone", val: "Asia/Kolkata" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <input defaultValue={f.val} className="mt-1.5 h-10 w-full rounded-xl border border-border bg-white/[0.02] px-3 text-sm outline-none focus:border-white/20" />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <SectionHeading title="Notifications" subtitle="Choose which signals reach you" />
        <ul className="divide-y divide-border">
          {["Weekly breakouts", "New VCP detected", "Earnings results", "Watchlist price alerts", "Volume spikes"].map((t) => (
            <li key={t} className="flex items-center justify-between py-3.5 text-sm">
              <div>
                <div>{t}</div>
                <div className="text-xs text-muted-foreground">Push, email and in-app</div>
              </div>
              <Toggle defaultOn />
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-card p-6">
        <SectionHeading title="Saved screeners" subtitle="Your custom GARP × VCP setups" />
        <ul className="space-y-2">
          {["GARP — Indian Compounders", "Weekly VCP Ready", "Defense Leaders", "Renewables Momentum"].map((s) => (
            <li key={s} className="flex items-center justify-between rounded-xl border border-border bg-white/[0.015] px-4 py-3 text-sm">
              <span>{s}</span>
              <button className="text-xs text-muted-foreground hover:text-foreground">Open</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  return (
    <label className="relative inline-flex h-6 w-10 cursor-pointer items-center">
      <input type="checkbox" defaultChecked={defaultOn} className="peer sr-only" />
      <span className="absolute inset-0 rounded-full bg-white/[0.08] transition peer-checked:bg-white/80" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow transition peer-checked:left-[18px]" />
    </label>
  );
}
