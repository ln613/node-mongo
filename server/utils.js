const R = require('ramda');
const fs = require('fs');
const path = require('path');

const e = {};

// util
e.tap = x => R.tap(console.log, R.isNil(x) ? 'null' : x);
e.isIn = arr => val => arr.some(item => val === item);
e.sort = R.sort((a, b) => a - b);
e.sortDesc = R.sort((a, b) => b - a);

// env
e.root = path.dirname(require.main.filename);
e.path = f => path.join(e.root, f);
e.config = fs.existsSync(e.path('config.js')) ? require(e.path('config.js')) : null;
e.isDev = () => process.env.NODE_ENV && e.isIn(['development', 'dev'])(process.env.NODE_ENV.toLowerCase());
e.isProd = () => !process.env.NODE_ENV || e.isIn(['production', 'prod'])(process.env.NODE_ENV.toLowerCase());
e.port = process.env.PORT || e.config ? e.config.port : 3000;
e.ip = process.env.IP || '0.0.0.0';
e.secret = e.config ? e.config.secret : process.env.secret;
e.username = e.config ? e.config.username : process.env.username;
e.password = e.config ? e.config.password : process.env.password;
e.dbname = e.config ? e.config.dbname : (process.env.dbname || e.root.split(path.sep).slice(-1));
e.mongoURL = process.env.MONGO_URL || `mongodb://localhost:27017/${e.dbname}`;
e.appname = e.config ? e.config.appname : process.env.appname;

// request/response
const send = d => (p, res) => p.then(x => res.json(d || x)).catch(e => res.send(e));
e.done = send('done');
e.send = send();

e.cors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if ('OPTIONS' == req.method) res.send(200);
  else next();
}

e.nocache = (req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

// login
e.gotoLogin = res => {
  res.clearCookie(`${e.appname}_token`);
  res.redirect('/login');
}

module.exports = e;