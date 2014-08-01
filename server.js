var express = require("express");
var app = express();

var policy = require("./policy");
var db_image = require("./db_image");

app.get("/test", function(req, res) {
  var key = "";
  db_image.makeUniqueKey(function(err, key) {
    if (err) {
      console.log(err, err.stack);
    } else {
      policy.generate(key, function(credentials) {
        res.send(credentials);
      });
    }
  });

});

db_image.imageTableReady(function(err, data) {
  if (err) {
    console.log(err, err.stack);
  } else {
    console.log("Image table status: " + data.Table.TableStatus);
    var server = app.listen(30000, function() {
      console.log("Listening on port %d", server.address().port);
    });
  }
});
