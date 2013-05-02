/**
 * API Module for whitepages.com
 * by: William Hockey
 */

var http = require( 'http' );
var qs = require('querystring');
var request = require('request');



module.exports = bing = function (place, cbk) {
    var url = 'http://dev.virtualearth.net/REST/v1/Locations?'

    var params = qs.stringify({
          query   : place
       ,  o       : 'json'
       ,  key     : "Aq8SAVztAl-gGbmKvEyu4b886uGcc0jH6nXHBWqihsGd-ZlnqTeedeljMHq64-au"
    });

    request(url+params, function (error, response, body) {
      if ((!error && response.statusCode == 200) && JSON.parse(body).status!='error' ) {
        body=JSON.parse(body);
        if(body.resourceSets[0].resources[0]){
          if(body.resourceSets[0].resources[0].confidence !="High")
            return cbk(1, null);
          return cbk(null, body.resourceSets[0].resources[0].point.coordinates);
        }
        else{
          //console.log("Error with Bing GeoCode");
          return cbk(1, null);
        }
        //cbk(body.resourceSets, null);
      }
      else
      {
        //console.log("Error with Bing GeoCode");
        return cbk(1, null);
      }

    });
  }


