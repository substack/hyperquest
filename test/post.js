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
    r.pipe(through(write, end));
    
    setTimeout(function () {
        r.write('beep ');
    }, 50);
    
    setTimeout(function () {
        r.end('boop.');
    }, 100);
    
    var data = '';
    function write (buf, enc, cb) { data += buf; cb() }
    function end () {
        t.equal(data, 'BEEP BOOP.');
    }
}
