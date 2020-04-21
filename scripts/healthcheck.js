'use strict';
const http = require("http");

const options = {
    host : "0.0.0.0",
		port : "5000",
		path: "/health",
    timeout : 2000
};

const request = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode == 200) {
        process.exit(0);
    }
    else {
        process.exit(1);
    }
});

request.on('error', function(err) {
    console.log('ERROR: ', err);
    process.exit(1);
});

request.end();
