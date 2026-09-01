"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMockStore } from "@/lib/mock/store";

/** DEV-ONLY: restores the seeded mock dataset (clears submitted demo reports). */
export function ResetDemoDataButton() {
  const { resetDemoData } = useMockStore();
  const [done, setDone] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-xs"
      onClick={() => {
        resetDemoData();
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {done ? "Reset!" : "Reset demo data"}
    </Button>
  );
}
