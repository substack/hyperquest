var url = require('url');
var http = require('http');
var https = require('https');
var through = require('through');
var duplexer = require('duplexer');
var Stream = require('stream');

module.exports = hyperquest;

function hyperquest (uri, opts, cb, extra) {
    if (typeof uri === 'object') {
        cb = opts;
        opts = uri;
        uri = undefined;
    }
    if (!opts) opts = {};
    if (uri !== undefined) opts.uri = uri;
    if (extra) opts.method = extra.method;
    
    var req = new Req(opts);
    var ws = req.duplex && through();
    if (ws) ws.pause();
    var rs = through();
    
    var dup = req.duplex ? duplexer(ws, rs) : rs;
    if (!req.duplex) {
        rs.writable = false;
    }
    dup.request = req;
    dup.setHeader = req.setHeader.bind(req);
    dup.setLocation = req.setLocation.bind(req);
    dup.setBody = req.setBody.bind(req);
    
    var closed = false;
    dup.on('close', function () { closed = true });
    
    process.nextTick(function () {
        if (closed) return;
        dup.on('close', function () { r.destroy() });
        
        var r = req._send();
        r.on('error', dup.emit.bind(dup, 'error'));
        
        r.on('response', function (res) {
            dup.response = res;
            dup.emit('response', res);
            if (req.duplex) res.pipe(rs)
            else {
                res.on('data', function (buf) { rs.queue(buf) });
                res.on('end', function () { rs.queue(null) });
            }
        });
        
        if (opts.body) r.write(opts.body);

        if (req.duplex) {
            ws.pipe(r);
            ws.resume();
        }
        else r.end();
    });
    
    if (cb) {
        dup.on('error', cb);
        dup.on('response', cb.bind(dup, null));
    }
    return dup;
}

hyperquest.get = hyperquest;

hyperquest.post = function (uri, opts, cb) {
    return hyperquest(uri, opts, cb, { method: 'POST' });
};

hyperquest.put = function (uri, opts, cb) {
    return hyperquest(uri, opts, cb, { method: 'PUT' });
};

hyperquest.delete = function (uri, opts, cb) {
    return hyperquest(uri, opts, cb, { method: 'DELETE' });
};

function Req (opts) {
    this.headers = opts.headers || {};
    
    var method = (opts.method || 'GET').toUpperCase();
    this.method = method;
    this.duplex = !(method === 'GET' || method === 'DELETE');
    
    if (opts.uri) this.setLocation(opts.uri);
    if (opts.body) this.setBody(opts.body);
}

Req.prototype._send = function () {
    this._sent = true;
    
    var headers = this.headers || {};
    var u = url.parse(this.uri);
    if (u.auth) {
        headers.authorization = 'Basic ' + Buffer(u.auth).toString('base64');
    }
    
    if (this.body) headers['content-length'] = this.body.length;

    var interface = (u.protocol === 'https:') ? https : http;
    var req = interface.request({
        method: this.method,
        host: u.hostname,
        port: Number(u.port),
        path: u.path,
        agent: false,
        headers: headers
    });
    
    if (req.setTimeout) req.setTimeout(Math.pow(2, 32) * 1000);
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

Req.prototype.setBody = function (body) {
    this.body = body;
    return this;
};
