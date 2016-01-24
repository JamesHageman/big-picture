require('babel-register')
var fs = require('fs')

var Picture = require('../server/models/Picture').default;
var Image = require('../server/models/Image').default;

fs.readFile('Image.json', 'utf-8', function (err, data) {
  data = data.split('\n')
  data.pop()

  data = data.map(function (line) {
    return JSON.parse(line)
  })

  console.log(data);

  data.forEach(function (obj) {
    Image.hydrate(obj).save(function (err, images) {
      console.log(err, images)
    })
  });
});
