import * as IntentParserAgent from "./intentParser.js";
import * as PolicyCheckAgent from "./policyCheck.js";
import * as MockExternalServiceAgent from "./mockExternalService.js";
import * as AuditLoggerAgent from "./auditLogger.js";

export const registry = {
  IntentParserAgent,
  PolicyCheckAgent,
  MockExternalServiceAgent,
  AuditLoggerAgent,
};
