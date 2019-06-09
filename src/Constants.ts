/** supported database models */
export const DB_MODELS = {
    NOSQL: 1,
    RELATIONAL: 2
};

/** supported date format */
export const DATE_FORMAT = /^([0-9]{4})([-._:|/\s])?([0-9]{1,2})\2?([0-9]{1,2})$/;

/** supported url schemes */
export const URL_SCHEMES = [
    'http', 'https', 'ssh', 'ftp', 'smtp', 'telnet', 'imap', 'ip',
    'ssl', 'pop3', 'sip','ws', 'wss'
];

/** default password min length */
export const MIN_PASSWORD_LENGTH = 8;

/** default password max length */
export const MAX_PASSWORD_LENGTH = 26;

/** default supported document file extensions */
export const DEFAULT_DOCUMENT_FILES = ['pdf', 'docx'];

/** default supported archive file extensions */
export const DEFAULT_ARCHIVE_FILES = ['zip', 'rar', 'gz', 'tar'];