require('babel-register');

var app = require('./app').default;

var PORT = process.env.PORT || 8080;

app.listen(PORT, function () {
  console.log('Server running on port ' + PORT);
});
