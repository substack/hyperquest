var url = require('url');
var http = require('http');
var through = require('through');
var duplexer = require('duplexer');

module.exports = function (uri, opts) {
    if (!opts) opts = {};
    var headers = opts.headers || {};
    if (opts.json) headers['content-type'] = 'application/json';
    
    var u = url.parse(uri);
    if (u.auth) {
        headers.authorization = 'Basic ' + Buffer(u.auth).toString('base64');
    }
    var req = http.request({
        method: opts.method || 'GET',
        host: u.hostname,
        port: Number(u.port),
        path: u.path,
        agent: false,
        headers: headers
    });
    req.setTimeout(Math.pow(2, 32) * 1000);
    
    var rs = through();
    var dup = duplexer(req, rs);
    
    dup.request = req;
    
    req.on('error', dup.emit.bind(dup, 'error'));
    
    req.on('response', function (res) {
        dup.response = res;
        dup.emit('response', res);
        res.pipe(rs);
    });
    
    return dup;
};
