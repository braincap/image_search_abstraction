var path = require('path');
var request = require('request');
var express = require('express');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var db, searchhist_collection;
require('dotenv').config();

var app = express();

app.use(express.static(path.join(__dirname, 'public')));

MongoClient.connect(process.env.MONGOLAB_URI, function (err, database) {
  if (err) throw err;
  db = database;
  searchhist_collection = db.collection('searchhist');
  app.listen(process.env.PORT || 3000, () => console.log("Listening to : " + process.env.PORT || 3000));
});

app.get('/api/imagesearch/:query', (req, response) => {
  var query = req.params.query;
  var offset = req.query.offset || 1;
  var search_url = 'https://www.googleapis.com/customsearch/v1?q=' + query + '&cx=009364027892687368665%3A2hk4bhlppzs&num=' + 10 + '&safe=high&searchType=image&start=' + offset + '&key=' + process.env.CSE_API;
  request(search_url, (err, res, body) => {
    if (err) throw err;
    var items = JSON.parse(body)['items'];
    var return_obj;
    var return_arr = [];
    for (var i = 0; i < items.length; i++) {
      return_obj = {};
      return_obj.url = items[i].link;
      return_obj.snippet = items[i]['snippet'];
      return_obj.thumbnail = items[i]['image']['thumbnailLink'];
      return_obj.context = items[i]['image']['contextLink'];
      return_arr.push(return_obj);
    }
    response.send(return_arr);
  });
  searchhist_collection.insert({
    'term': query,
    'when': new Date()
  });
});

app.get('/api/latest/imagesearch/', (req, res) => {
  searchhist_collection.find({}, { _id: 0 }).sort({ 'when': -1 }).limit(10).toArray((err, results) => {
    if (err) throw err;
    res.send(results);
  });
});
