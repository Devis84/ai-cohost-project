"use client";

interface DashboardHeaderProps {
  propertiesCount: number;
  aiEnabled: boolean;
  isPartnerMode: boolean;
}

export function DashboardHeader({
  propertiesCount,
  aiEnabled,
  isPartnerMode,
}: DashboardHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white px-6 py-10 shadow-2xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div>
            <div className="uppercase tracking-[0.3em] text-xs text-white/50 mb-4">
              AI CO-HOST PLATFORM
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Property Dashboard
            </h1>

            <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
              Manage welcome pages, AI concierge, check-in instructions,
              local recommendations and guest experience from one place.
            </p>

            {isPartnerMode && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 border border-emerald-300/20 px-4 py-2 text-sm text-emerald-100">
                <span>Limited Partner Access</span>
                <span className="text-white/40">•</span>
                <span>Assigned properties only</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 min-w-[280px]">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
              <div className="text-white/50 text-sm mb-2">
                Properties
              </div>

              <div className="text-3xl font-bold">
                {propertiesCount}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
              <div className="text-white/50 text-sm mb-2">
                AI Concierge
              </div>

              <div className="text-3xl font-bold">
                {aiEnabled ? "ON" : "OFF"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
