var hreq = require('../');
hreq('http://localhost:8000').pipe(process.stdout);
