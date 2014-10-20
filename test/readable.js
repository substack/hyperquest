var test = require('tape');
var hyperquest = require('../');
var http = require('http');

var server = http.createServer(function (req, res) { res.end() });

test('readable', function (t) {
    server.listen(function () {
        var port = server.address().port;
        var req = hyperquest('http://localhost:' + port);
        t.notOk(req.flowing);
        t.ok(req._read);
        req.on('data', function () {});
        req.on('end', function () {
            server.close();
            t.end();
        });
    });
});

