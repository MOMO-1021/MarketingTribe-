import "server-only";

import { SeverityNumber } from "@opentelemetry/api-logs";
import { after } from "next/server";
import { loggerProvider, posthogLogger } from "@/instrumentation";

type LogAttributes = Record<string, string | number | boolean>;

export function logPostHogAction(body: string, attributes: LogAttributes) {
  const provider = loggerProvider;
  const logger = posthogLogger;
  if (!provider || !logger) return;

  logger.emit({
    body,
    severityNumber: SeverityNumber.INFO,
    severityText: "INFO",
    attributes,
  });

  after(() => {
    void provider.forceFlush().catch(() => {});
  });
}
