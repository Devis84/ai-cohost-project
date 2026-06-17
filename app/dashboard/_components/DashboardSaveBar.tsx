"use client";

export function DashboardSaveBar({
  propertyName,
  saveStatusMessage,
  saving,
  canSave,
  onSave,
}: {
  propertyName: string;
  saveStatusMessage: string;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl bg-black text-white rounded-3xl px-6 py-5 shadow-2xl flex items-center justify-between z-50">
      <div>
        <div className="font-semibold">
          {propertyName || "No property selected"}
        </div>

        <div className="text-white/60 text-sm">
          {saveStatusMessage}
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={!canSave}
        className="bg-white text-black px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}