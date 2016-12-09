var test = require('tap').test;
var http = require('http');
var hyperquest = require('../');

var server = http.createServer(function (req, res) {});

test('close event is delegated', function (t) {
    t.plan(1);

    server.on('request', function(req, res) {
        process.nextTick(function() {
          res.end();
        });
    });

    server.listen(0, function () {
        var port = server.address().port;
        check(t, port);
    });

    t.on('end', server.close.bind(server));
});

function check (t, port) {
  var r = hyperquest('http://localhost:' + port);

  r.on('close', function() {
    t.ok(true)
  });
}
