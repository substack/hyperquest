var test = require('tape');
var http = require('http');
var hyperquest = require('../');
var through = require('through2');

var server = http.createServer(function (req, res) {
    res.setHeader('content-type', 'text/robot-speak');
    res.end('beep boop');
});

test('get', function (t) {
    t.plan(3);
    server.listen(0, function () {
        var port = server.address().port;
        check(t, port);
    });
    t.on('end', server.close.bind(server));
});

function check (t, port) {
    var r = hyperquest('http://localhost:' + port);
    r.pipe(through(write, end));
    
    r.on('request', function (req) {
        t.ok(req);
    });
    
    r.on('response', function (res) {
        t.equal(res.headers['content-type'], 'text/robot-speak');
    });
    
    var data = '';
    function write (buf, enc, cb) { data += buf; cb() }
    function end () {
        t.equal(data, 'beep boop');
    }
}
