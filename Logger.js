var winston = require('winston');
var fs = require('fs');

fs.mkdir('./logs', function(err) {
    //if (err) throw err;
});

// Define levels to be like log4j in java
var customLevels = {
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  },
  colors: {
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red'
  }
};

// create the main logger
var logger = new(winston.Logger)({
    level: 'debug',
    levels: customLevels.levels,
    transports: [
        // setup console logging
        new(winston.transports.Console)({
            level: 'debug', // Only write logs of info level or higher
            levels: customLevels.levels,
            colorize: true
        }),
        // setup logging to file
        new(winston.transports.File)({
            filename: './logs/project-debug.log',
            maxsize: 1024 * 1024 * 10, // 10MB
            level: 'debug',
            levels: customLevels.levels
        })
    ]
});

// create the data logger - I only log specific app output socket data here
var datalogger = new (winston.Logger) ({
    level: 'debug',
    levels: customLevels.levels,
    transports: [
        // setup console logging
        new(winston.transports.Console)({
            level: 'debug', // Only write logs of info level or higher
            levels: customLevels.levels,
            colorize: true
        }),
        new (winston.transports.File) ({
            filename: './logs/project-socket.log',
            maxsize: 1024 * 1024 * 10, // 10MB
            level: 'debug',
            levels: customLevels.levels
        })
    ]
});

// make winston aware of your awesome colour choices
winston.addColors(customLevels.colors);

var Logger = function() {
    var loggers = {};

    // always return the singleton instance, if it has been initialised once already.
    if (Logger.prototype._singletonInstance) {
        return Logger.prototype._singletonInstance;
    }

    this.getLogger = function(name) {
        return loggers[name];
    }

    Logger.prototype.get = this.getLogger;

    loggers['project-debug.log'] = logger;
    loggers['project-socket.log'] = datalogger;

    Logger.prototype._singletonInstance = this;
};

exports.Logger = new Logger();