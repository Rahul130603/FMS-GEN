import React from "react";
import { PublishingProvider } from "./original-reports/context/PublishingContext";
import { MyReport } from "./original-reports/pages/MyReport";
import "./original-report-tailwind.css";

export default function OriginalMyReportPage({ user }) {
  return (
    <div className="original-report">
      <PublishingProvider>
        <MyReport user={user} />
      </PublishingProvider>
    </div>
  );
}
