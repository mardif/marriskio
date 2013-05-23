var forever = require('forever-monitor');

var child = new (forever.Monitor)('main.js', {
    options: [{
			  "silent": false,
              "watch": true
    }]
});

child.on('exit', function () {
    console.log('main.js has exited');
});

child.start();