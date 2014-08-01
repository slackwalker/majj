var crypto = require("crypto");
var moment = require("moment");
var AWS = require("aws-sdk");

AWS.config.update({region: "us-west-2"});

exports.generate = function(key, callback) {
  var now = new Date();
  var expires = new Date(now + (300 * 1000)); // expire in five minutes
  var size_limit = 10485760; // 10mb

  var s3Policy = {
    "expiration": moment.utc(expires).toISOString(),
    "conditions": [
      ["content-length-range", 0, size_limit],
      ["starts-with", "$Content-Type", "image/"],
      ["eq", "$key", key], 
      {"bucket": "i.majj.in"}, 
      {"acl": "public-read"}, 
      {"success_action_redirect": "http://majj.in/" + key},
    ]
  };

  // stringify and encode the policy
  var stringPolicy = JSON.stringify(s3Policy);
  var base64Policy = Buffer(stringPolicy).toString("base64");

  // sign the base64 encoded policy
  var signature = crypto.createHmac(
    "sha1",
    AWS.config.credentials.secretAccessKey
  ).update(new Buffer(base64Policy)).digest("base64");

  // build the results object
  var s3Credentials = {
    s3Policy: base64Policy,
    s3Signature: signature,
    accessKey: AWS.config.credentials.accessKeyId,
    fileKey: key,
  };

  // send it back
  callback(s3Credentials);
};
