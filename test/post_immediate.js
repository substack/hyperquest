var test = require('tape');
var http = require('http');
var hyperquest = require('../');
var through = require('through2');

var server = http.createServer(function (req, res) {
    req.pipe(through(function (buf, enc, cb) {
        this.push(String(buf).toUpperCase());
        cb();
    })).pipe(res);
});

test('post', function (t) {
    t.plan(1);
    server.listen(0, function () {
        var port = server.address().port;
        check(t, port);
    });
    t.on('end', server.close.bind(server));
});

function check (t, port) {
    var r = hyperquest.post('http://localhost:' + port);
    r.end('beep boop.');
    
    var data = '';
    r.on('data', function (buf) { data += buf });
    r.on('end', function () {
        t.equal(data, 'BEEP BOOP.');
    });
}
