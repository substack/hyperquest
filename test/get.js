var test = require('tap').test;
var http = require('http');
var hreq = require('../');
var through = require('through');

var server = http.createServer(function (req, res) {
    res.setHeader('content-type', 'text/robot-speak');
    res.end('beep boop');
});

var port;
test('set up', function (t) {
    server.listen(0, function () {
        port = server.address().port;
        t.end();
    });
});

test('get', function (t) {
    t.plan(2);
    
    var r = hreq('http://localhost:' + port);
    r.pipe(through(write, end));
    
    r.on('response', function (res) {
        t.equal(res.headers['content-type'], 'text/robot-speak');
    });
    
    var data = '';
    function write (buf) { data += buf }
    function end () {
        t.equal(data, 'beep boop');
    }
});

test('tear down', function (t) {
    server.close();
    t.end();
});
