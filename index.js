var url = require('url');
var http = require('http');
var through = require('through');
var duplexer = require('duplexer');
var Stream = require('stream');

module.exports = function (uri, opts, cb) {
    if (typeof uri === 'object') {
        opts = uri;
        cb = opts;
        uri = undefined;
    }
    if (!opts) opts = {};
    if (uri !== undefined) opts.uri = uri;
    
    var req = new Req(opts);
    var rs = through();
    
    var dup = req.duplex ? duplexer(req, rs) : rs;
    if (!req.duplex) {
        rs.writable = false;
    }
    dup.request = req;
    
    process.nextTick(function () {
        var r = req._send();
        r.on('error', dup.emit.bind(dup, 'error'));
        
        r.on('response', function (res) {
            dup.response = res;
            dup.emit('response', res);
            if (req.duplex) res.pipe(rs)
            else res.on('data', function (buf) { rs.queue(buf) })
        });
        
        if (!req.duplex) r.end();
    });
    
    if (cb) {
        dup.on('error', cb);
        dup.on('response', cb.bind(dup, null));
    }
    return dup;
};

function Req (opts) {
    this.headers = opts.headers || {};
    
    var method = (opts.method || 'GET').toUpperCase();
    this.method = method;
    this.duplex = !(method === 'GET' || method === 'DELETE');
    
    if (opts.uri) this.setLocation(opts.uri);
}

Req.prototype._send = function () {
    this._sent = true;
    
    var headers = this.headers || {};
    var u = url.parse(this.uri);
    if (u.auth) {
        headers.authorization = 'Basic ' + Buffer(u.auth).toString('base64');
    }
    var req = http.request({
        method: this.method,
        host: u.hostname,
        port: Number(u.port),
        path: u.path,
        agent: false,
        headers: headers
    });
    
    req.setTimeout(Math.pow(2, 32) * 1000);
    return req;
};

Req.prototype.setHeader = function (key, value) {
    if (this._sent) throw new Error('request already sent');
    this.headers[key] = value;
    return this;
};

Req.prototype.setLocation = function (uri) {
    this.uri = uri;
    return this;
};
