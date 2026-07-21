export const APP_NAME = "Statlas";
export const SAVE_SCHEMA_VERSION = 1;
export const SAVE_FILE_PREFIX = "profile-";
export const SETTINGS_FILE_NAME = "statlas-settings.json";
export const PROFILES_INDEX_FILE = "profiles-index.json";
export const BACKUP_DIR_NAME = "backups";
export const MAX_BACKUPS = 10;

export const MASTERY_LEVELS = ["unseen", "introduced", "practicing", "proficient", "mastered"] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 5;
