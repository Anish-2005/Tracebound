import * as IntentParserAgent from "./intentParser.js";
import * as PolicyValidatorAgent from "./policyValidator.js";
import * as ExternalServiceAgent from "./externalService.js";
import * as LoggerAgent from "./logger.js";

export const registry = {
  IntentParserAgent,
  PolicyValidatorAgent,
  ExternalServiceAgent,
  LoggerAgent,
};
