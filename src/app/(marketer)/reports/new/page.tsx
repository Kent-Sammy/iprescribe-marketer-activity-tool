import { PageHeader } from "@/components/shared/page-header";
import { ReportForm } from "@/components/forms/report-form";

export default function NewReportPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Submit Field Report"
        description="Your name, date, time and location are captured automatically."
      />
      <ReportForm />
    </div>
  );
}
