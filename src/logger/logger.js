import util from 'util';
import winston from 'winston';

const Logger = winston.Logger;
const ConsoleTransport = winston.transports.Console;
const IS_DEV_MODE = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development');
const IS_TEST_MODE = (process.env.NODE_ENV === 'test');

const logger = new Logger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
  transports: [
    // log console if developement
    ... (IS_DEV_MODE ?
    [new ConsoleTransport({
      name: 'debug-console',
      level: 'debug',
      colorize: true,
      prettyPrint: true,
      timestamp: !IS_TEST_MODE,
    })] : []),
    // Do not log debug level if environment is not development
    // Remark: info level already include warn and error level
    // No file transport, as there is logging system
    // that captue the console log insteadof files
    ... ((!IS_DEV_MODE) ?
    [new ConsoleTransport({
      name: 'info-console',
      level: 'info',
      colorize: true,
      prettyPrint: true,
      timestamp: !IS_TEST_MODE,
    })] : []),
  ],
});

function formatArgs(...args) {
  return [util.format.apply(util, args)];
}

// overwrite the console.log methods
// because third party middleware use console instead of winston,
// but we want to persist the logging style
console.log = (...args) => {
  logger.info.apply(logger, formatArgs(...args));
};
console.info = (...args) => {
  logger.info.apply(logger, formatArgs(...args));
};
console.warn = (...args) => {
  logger.warn.apply(logger, formatArgs(...args));
};
console.error = (...args) => {
  logger.error.apply(logger, formatArgs(...args));
};
console.debug = (...args) => {
  logger.debug.apply(logger, formatArgs(...args));
};

export default logger;
