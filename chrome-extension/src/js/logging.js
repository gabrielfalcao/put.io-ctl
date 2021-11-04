import chalk from "chalk";

export const DefaultLevelName = "WARNING";
export const LevelNameToNumberMap = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    WARNING: 3,
    ERROR: 4,
    CRITICAL: 5,
};

export const mapLevelToNumber = (levelName) =>
    LevelNameToNumberMap[levelName || DefaultLevelName];

export class Logger {
    constructor(
        name,
        { printFunc, errorFunc, level } = {
            printFunc: console.log,
            errorFunc: console.error,
            level: DefaultLevelName,
        }
    ) {
        if (Object.keys(LevelNameToNumberMap).indexOf(level.toUpperCase()) === -1) {
            throw new Error(`Logger(level) got an invalid level name: ${level}`);
        }

        this.level = mapLevelToNumber(level);
        this.console = {
            log: printFunc,
            error: errorFunc,
        };
    }

    debug(message) {
        const text = chalk.green(`[DEBUG] ${message}`);
        this.console.log.apply(this.console, [text, ...arguments]);
    }
    info(message) {
        const text = chalk.green(`[INFO] ${message}`);
        this.console.log.apply(this.console, [text, ...arguments]);
    }
    warning(message) {
        const text = chalk.green(`[WARNING] ${message}`);
        this.console.log.apply(this.console, [text, ...arguments]);
    }
    error(message) {
        const text = chalk.green(`[ERROR] ${message}`);
        this.console.log.apply(this.console, [text, ...arguments]);
    }
    critical(message) {
        const text = chalk.green(`[CRITICAL] ${message}`);
        this.console.log.apply(this.console, [text, ...arguments]);
    }
}
