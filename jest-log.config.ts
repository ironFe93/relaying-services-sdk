// logging level, from the more specific to the less
export enum JestLogLevel {
    DEBUG,
    LOG,
    INFO,
    WARNING,
    ERROR,
    NONE
}

export const JEST_LOG_LEVEL: JestLogLevel = JestLogLevel.ERROR;
