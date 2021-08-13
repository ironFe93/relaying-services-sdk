// logging level from the top to the more specific
export enum JestLogLevel {
    DEBUG,
    LOG,
    INFO,
    WARNING,
    ERROR,
    NONE
}

export const JEST_LOG_LEVEL: JestLogLevel = JestLogLevel.ERROR;
