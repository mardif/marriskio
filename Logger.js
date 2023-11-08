const winston = require('winston');
const fs = require('fs');
const errorPath = 'logs';

fs.mkdir('./'+errorPath, function(err) {
    //if (err) throw err;
});

const format = winston.format;
const customFormatter = format((info) => {
    return Object.assign({
        timestamp: info.timestamp
    }, info);
});

let settings = {
    level: 'debug',
    format: winston.format.simple(),
    transports: [
        new (winston.transports.File)({
            filename: errorPath + '/error.log',
            level: 'debug',
            handleExceptions: true,
            stack: true,
            format: format.combine(
                format.timestamp(),
                customFormatter(),
                format.simple()
            )
        }),
        new (winston.transports.File)({
            filename: errorPath + '/console.log',
            format: format.combine(
                format.timestamp(),
                customFormatter(),
                format.simple()
            )
        })
    ],
    exitOnError: false
};
//settings.transports.push(new (winston.transports.Console)());

module.exports = new winston.createLogger(settings);