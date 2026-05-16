"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataLoadErrorProps {
  message: string;
  onRetry: () => void;
}

export function DataLoadError({ message, onRetry }: DataLoadErrorProps) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-5 text-sm text-destructive">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <p className="font-medium">{message}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}
