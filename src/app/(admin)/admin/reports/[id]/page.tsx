"use client";

import { use } from "react";
import { ReportDetail } from "@/components/shared/report-detail";

export default function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ReportDetail reportId={id} context="admin" />;
}
