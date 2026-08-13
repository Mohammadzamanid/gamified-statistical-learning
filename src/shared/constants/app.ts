export const APP_NAME = "Statlas";
export const SAVE_SCHEMA_VERSION = 5;
export const SAVE_FILE_PREFIX = "profile-";
export const SETTINGS_FILE_NAME = "statlas-settings.json";
export const PROFILES_INDEX_FILE = "profiles-index.json";
export const BACKUP_DIR_NAME = "backups";
export const MAX_BACKUPS = 10;

export const MASTERY_LEVELS = ["unseen", "introduced", "practicing", "proficient", "mastered"] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 5;

/**
 * How many experiments the laboratory shelf holds.
 *
 * A bounded shelf, because saved experiments live in the save file and a save
 * file that grows without limit is a persistence defect wearing a feature's
 * clothes. When it is full the bench says so and asks for one to be removed
 * rather than quietly dropping the oldest — the learner chose to keep those.
 */
export const LABORATORY_SHELF_LIMIT = 12;
