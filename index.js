var url = require('url');
var http = require('http');
var https = require('https');
var through = require('through2');
var duplexer = require('duplexer2');

module.exports = hyperquest;

function hyperquest (uri, opts, cb, extra) {
    if (typeof uri === 'object') {
        cb = opts;
        opts = uri;
        uri = undefined;
    }
    if (typeof opts === 'function') {
      cb = opts;
      opts = undefined;
    }
    if (!opts) opts = {};
    if (uri !== undefined) opts.uri = uri;
    if (extra) opts.method = extra.method;

    var req = new Req(opts);
    var ws = req.duplex && through();
    var rs = through();

    var dup = req.duplex ? duplexer(ws, rs) : rs;
    if (!req.duplex) {
        rs.writable = false;
    }
    dup.request = req;
    dup.setHeader = function () { req.setHeader.apply(req, arguments); };
    dup.setLocation = function () { req.setLocation.apply(req, arguments); };

    var closed = false;
    dup.on('close', function () { closed = true; });

    process.nextTick(function () {
        if (closed) return;
        dup.on('close', function () { r.destroy(); });

        var r = req._send();
        r.on('error', function (error) { dup.emit('error', error); });

        r.on('response', function (res) {
            dup.response = res;
            dup.emit('response', res);
            if (req.duplex) res.pipe(rs);
            else {
                res.on('data', function (buf) { rs.push(buf); });
                res.on('end', function () { rs.push(null); });
            }
        });

        if (req.duplex) {
            ws.pipe(r);
        }
        else r.end();
    });

    if (cb) {
        dup.on('error', cb);
        dup.on('response', function (res) { cb(null, res); });
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

hyperquest['delete'] = function (uri, opts, cb) {
    return hyperquest(uri, opts, cb, { method: 'DELETE' });
};

function Req (opts) {
    this.headers = opts.headers || {};

    var method = (opts.method || 'GET').toUpperCase();
    this.method = method;
    this.duplex = !(method === 'GET' || method === 'DELETE'
        || method === 'HEAD');
    this.auth = opts.auth;

    this.options = opts;

    if (opts.uri) this.setLocation(opts.uri);
}

Req.prototype._send = function () {
    this._sent = true;

    var headers = this.headers || {};
    var u = url.parse(this.uri);
    var au = u.auth || this.auth;
    if (au) {
        headers.authorization = 'Basic ' + Buffer(au).toString('base64');
    }

    var protocol = u.protocol || '';
    var iface = protocol === 'https:' ? https : http;
    var opts = {
        scheme: protocol.replace(/:$/, ''),
        method: this.method,
        host: u.hostname,
        port: Number(u.port) || (protocol === 'https:' ? 443 : 80),
        path: u.path,
        agent: false,
        headers: headers,
        withCredentials: this.options.withCredentials
    };
    if (protocol === 'https:') {
        opts.pfx = this.options.pfx;
        opts.key = this.options.key;
        opts.cert = this.options.cert;
        opts.ca = this.options.ca;
        opts.ciphers = this.options.ciphers;
        opts.rejectUnauthorized = this.options.rejectUnauthorized;
        opts.secureProtocol = this.options.secureProtocol;
    }
    var req = iface.request(opts);

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
