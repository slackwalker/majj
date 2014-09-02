var AWS = require("aws-sdk");

AWS.config.update({region: "us-west-2"});

var db = new AWS.DynamoDB();

var ImageTableName = "Majj.Images";
var ImageTableDef = {
  TableName: ImageTableName,
  AttributeDefinitions: [
    {
      AttributeName: "ImageKey",
      AttributeType: "S",
    }
  ],
  KeySchema: [
    {
      AttributeName: "ImageKey",
      KeyType: "HASH",
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
};

function makeRandomString(len) {
  var result = [];
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  while (len--) {
    result.push(chars.charAt(Math.floor(Math.random() * chars.length)));
  }

  return result.join("");
}

exports.makeUniqueKey = function(callback) {
  var retries = 0;

  var image = {
    TableName: ImageTableName,
    Item: {
      ImageKey: {S: ""},
    },
    Expected: {
      ImageKey: {
        Exists: false,
      },
    },
  };

  (function tryInsertImage() {
    if (retries < 5) {
      image.Item.ImageKey.S = makeRandomString(6);
      db.putItem(image, function(err, data) {
        if (err) {
          if (err.code === "ConditionalCheckFailedException") {
            retries++;
            tryInsertImage();
          } else {
            callback(err);
          }
        } else {
          callback(null, image.Item.ImageKey.S);
        }
      });
    } else {
      callback(new Error("Too many attempts without unique key."));
    }
  })();
};

exports.imageTableReady = function(callback) {
  (function waitForTable() {
    db.describeTable({ TableName: ImageTableName, }, function(err, data) {
      if (err && err.code === "ResourceNotFoundException") {
        db.createTable(ImageTableDef, function(err, data) {
          if (err) {
            callback(err);
          } else {
            setTimeout(waitForTable, 1000);
          }
        });
      } else if (data.Table.TableStatus === "ACTIVE"){
        callback(null, data);
      } else {
        setTimeout(waitForTable, 1000);
      }
    });
  })();
};

