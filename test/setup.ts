import { JestLogLevel, JEST_LOG_LEVEL } from '../jest-log.config';

function getLogLevel(): any {
    const dummyFN = jest.fn();

    const consoleConfig = {
        // Keep native behaviour for other methods, use those to print out things in your own tests, not `console.log`
        debug: console.debug,
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error
    };

    switch (JEST_LOG_LEVEL) {
        case JestLogLevel.DEBUG:
            return consoleConfig;
        case JestLogLevel.LOG:
            return Object.assign(consoleConfig, {
                debug: dummyFN
            });
        case JestLogLevel.INFO:
            return Object.assign(consoleConfig, {
                debug: dummyFN,
                log: dummyFN
            });
        case JestLogLevel.WARNING:
            return Object.assign(consoleConfig, {
                debug: dummyFN,
                log: dummyFN,
                info: dummyFN
            });
        case JestLogLevel.ERROR:
            return Object.assign(consoleConfig, {
                debug: dummyFN,
                log: dummyFN,
                info: dummyFN,
                warn: dummyFN
            });
        case JestLogLevel.NONE:
            return Object.assign(consoleConfig, {
                debug: dummyFN,
                log: dummyFN,
                info: dummyFN,
                warn: dummyFN,
                error: dummyFN
            });
    }
}

global.console = getLogLevel();
