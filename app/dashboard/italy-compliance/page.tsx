import { Suspense } from "react";
import ItalyComplianceContent from "./_components/italy-compliance-content";

export default function ItalyCompliancePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 sm:px-6 py-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<div>Loading Italian compliance...</div>}>
          <ItalyComplianceContent />
        </Suspense>
      </div>
    </div>
  );
}
