const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const api = require('./api');
const { isProd, done, send, cors, nocache, port, ip, mongoURL, secret, username, password, gotoLogin } = require('./utils');

const app = express();

if (!isProd)
  app.use(cors);

api.initdb(mongoURL);

//app.use(express.static('client/build'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  api.initdb(mongoURL);
  next();
});

// get --------------------

app.get('/api/lookup', (req, res) => {
  //send(Promise.all([api.get('...')]).then(r => ({ [...]: r[0] })), res);
});

app.get('/api/idname/:doc', (req, res) => {
  send(api.getIdName(req.params.doc), res);
});

app.get('/api/:doc/:prop/:val/:fields', (req, res) => {
  const { doc, prop, val, fields } = req.params;
  send(api.search(doc, prop, val, fields), res);
});

app.get('/api/:doc/:id', (req, res) => {
  const { doc, id } = req.params;
  send(api.getById(doc, id), res);
});

app.get('/api/:doc', (req, res) => {
  send(api.get(req.params.doc), res);
});

// admin --------------------

app.copy('/admin/bak', (req, res) => {
  send(api.bak(), res);
});

app.get('/login', nocache, (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  if (username != req.body.username || password != req.body.password) {
    gotoLogin(res);
  } else {
    const token = jwt.sign({}, secret, { expiresIn: '24h' });
    res.cookie(`${config.appname}_token`, token);
    res.redirect('/admin');
  }
});

app.get('/logout', (req, res) => {
  gotoLogin(res);
});

app.use('/admin', (req, res, next) => {
  if (!isProd) {
    next();
  } else {
    const token = req.cookies.vttc_token;
    if (token) {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          gotoLogin(res);
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      gotoLogin(res);
    }
  }  
});

app.copy('/admin/initdata', (req, res) => {
  done(api.initdata(), res);
});

app.get('/admin/env', (req, res) => {
  res.send(Object.keys(process.env).map(k => k + ' - ' + process.env[k]).sort());
});

app.get('/admin/count/:doc', (req, res) => {
  send(api.count(req.params.doc), res);
});

app.post('/admin/:doc/:id/:list', (req, res) => {
  const { doc, id, list } = req.params;
  send(api.addToList(doc, id, list, req.body), res);
});

app.put('/admin/:doc/:id/:list', (req, res) => {
  const { doc, id, list } = req.params;
  send(api.replaceList(doc, id, list, req.body), res);
});

app.post('/admin/:doc', (req, res) => {
  send(api.add(req.params.doc, req.body), res);
});

app.put('/admin/:doc', (req, res) => {
  send(api.replace(req.params.doc, req.body), res);
});

app.patch('/admin/:doc', (req, res) => {
  send(api.update(req.params.doc, req.body), res);
});

app.purge('/admin/:doc', (req, res) => {
  done(api.drop(req.params.doc), res);
});

// catch all --------------------

app.get('/admin', nocache, function (req, res) {
  //res.sendFile(path.resolve(__dirname, '../client/build/index.html'))
});

app.get('*', function (req, res) {
  res.sendFile(path.resolve(__dirname, '../client/build/index.html'))
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);
