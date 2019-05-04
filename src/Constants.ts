/**
 * supported database models
 */
export const DB_MODELS = {
    NOSQL: 1,
    RELATIONAL: 2
};

/**
 * supported database model case styles
*/
export const DB_MODEL_CASE_STYLES = {
    CAMEL_CASE: 1,
    SNAKE_CASE: 2
};

/**
 * supported date formats
 */
export const DATE_FORMAT = /^([0-9]{4})([-._:|/\s])?([0-9]{1,2})\2?([0-9]{1,2})$/;

/**
 * default accepted protocols or schemes
 */
export const URL_SCHEMES = [
    'http', 'https', 'ssh', 'ftp', 'smtp', 'telnet', 'imap', 'ip',
    'ssl', 'pop3', 'sip','ws', 'wss'
];

/**
 * defines the default minimum password length
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * defines the default maximum password length
 */
export const MAX_PASSWORD_LENGTH = 26;

export const DEFAULT_DOCUMENT_FILES = ['pdf', 'docx'];

export const DEFAULT_ARCHIVE_FILES = ['zip', 'rar', 'gz', 'tar'];