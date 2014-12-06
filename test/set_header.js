var test = require('tape');
var http = require('http');
var hyperquest = require('../');
var through = require('through2');

test('setHeader on a request', function (t) {
    t.plan(2);
    
    var server = http.createServer(function (req, res) {
        t.equal(req.headers.robot, 'party');
        res.end('beep boop');
    });
    server.listen(0, function () {
        var port = server.address().port;
        check(t, port);
    });
    t.on('end', server.close.bind(server));
});

function check (t, port) {
    var r = hyperquest('http://localhost:' + port);
    r.setHeader('robot', 'party');
    r.pipe(through(write, end));
    
    var data = '';
    function write (buf, enc, cb) { data += buf; cb() }
    function end () {
        t.equal(data, 'beep boop');
    }
}
