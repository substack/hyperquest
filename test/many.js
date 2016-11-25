var test = require('tape');
var http = require('http');
var hyperquest = require('../');
var through = require('through2');

var server = http.createServer(function (req, res) {
    res.write('beep boop');
});

test('more than 5 pending connections', function (t) {
    t.plan(20);
    var pending = [];
    server.listen(0, function () {
        var port = server.address().port;
        for (var i = 0; i < 20; i++) {
            pending.push(check(t, port));
        }
    });
    t.on('end', function () {
        pending.forEach(function (p) { p.destroy() });
        server.close();
    });
});

function check (t, port) {
    var r = hyperquest('http://localhost:' + port);
    var data = '';
    r.pipe(through(function (buf, enc, cb) { data += buf; cb() }));
    
    setTimeout(function () {
        t.equal(data, 'beep boop');
    }, 200);
    return  r;
}
