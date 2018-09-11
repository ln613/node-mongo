const fs = require('fs');
const mongodb = require('mongodb');
const { fromPairs, merge } = require('ramda');

let db = null;
const e = {};

e.initdb = mongoURL => {
  if (db || mongoURL == null) return;

  mongodb.connect(mongoURL).then(conn => {
    db = conn;
    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

e.initdocs = docs => {
  const f = k => r => db.collection(k).insertMany(docs[k]);
  return Promise.all(
    Object.keys(docs).map(k => db.collection(k).drop().then(f(k)).catch(f(k)))
  );
}

e.initdata = () => e.initdocs(json2js(fs.readFileSync('./data/db.json')))

e.bak = () => Promise.all(allDocs.map(e.get)).then(l => fromPairs(l.map((d, i) => [allDocs[i], d])))//.then(x => JSON.stringify(x)).then(x => { fs.writeFile('./data/db.json', x); return x; })

e.list = () => Object.keys(db)

e.count = doc => db.collection(doc).count()

e.get = doc => db.collection(doc).find({}, { _id: 0 }).toArray()

e.getIdName = doc => db.collection(doc).find({}, { _id: 0, id: 1, name: 1 }).toArray()

e.getById = (doc, id) => db.collection(doc).findOne({ id: +id }, { _id: 0 })

e.search = (doc, prop, val, fields) => db.collection(doc).find(
    (prop || prop === '_') ? {} : { [prop]: isNaN(+val) ? new RegExp(val, 'i') : +val},
    merge({ _id: 0, id: 1, name: 1 }, fields ? fromPairs(fields.split(',').map(x => [x, 1])) : {})
).toArray()

e.add = (doc, obj) => db.collection(doc).insert(obj);

e.replace = (doc, obj) => db.collection(doc).replaceOne({ id: obj.id }, obj)

e.addToList = (doc, id, list, obj) => db.collection(doc).update({ id: +id }, { $addToSet: { [list]: obj } })

e.replaceList = (doc, id, list, obj) => db.collection(doc).update({ id: +id, [list + '.id']: obj.id }, { $set: { [list + '.$']:obj } })

e.update = (doc, obj) => db.collection(doc).update({ id: obj.id }, { $set: obj })

e.delete = (doc, obj) => db.collection(doc).remove({ id: obj.id })

e.drop = doc => db.collection(doc).drop()

module.exports = e;
