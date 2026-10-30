export const APP_NAME = "PublishTrace";
export const APP_VERSION = "1.0.0";

export const MODE_IDENTITY = {
  FIXTURE: "fixture" as const,
  REAL: "real" as const,
} as const;

export type ModeIdentity = (typeof MODE_IDENTITY)[keyof typeof MODE_IDENTITY];

export const STATUS_MATCH = "MATCH";
export const STATUS_MISMATCH = "MISMATCH";
export const STATUS_UNKNOWN = "UNKNOWN";

export type CheckStatus = typeof STATUS_MATCH | typeof STATUS_MISMATCH | typeof STATUS_UNKNOWN;

export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_MODEL = "page";
export const DEFAULT_FIELD_PATH = "data.headline";
export const DEFAULT_SELECTOR = "h1";

export const MAX_FIELD_PATH_SEGMENTS = 6;
export const MAX_FIELD_PATH_SEGMENT_LENGTH = 100;
