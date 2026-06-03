'use client'

export default function SafetyBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white/40 text-xs">
      <span className="text-base">🛡️</span>
      <span>Veiligheid en verkeersregels gaan altijd voor.</span>
    </div>
  )
}
