'use strict';

/* Services */

angular.module('plaid', [], function($provide) {
    $provide.factory('Plaid', ['$filter', '$http', function(filter, http) {
        return {
            /**
            * Pull a user's transactions
            * @param {String} at Plaid Access Token
            * @param {String} fsat Foursquare Access Token
            * @param {Function} callback The function to callback with results
            */
            get: function(access_token, callback) {
                //return callback(null, getLocalTrans());
                http({method: 'GET', url:'/api/transactions?access_token='+ access_token}).success(function(data) {
                    console.log('received response');
                    console.log(data);
                    callback(null, data);
                }).error(function(data, status, headers, config) {
                    console.log('received error');
                    console.log(data);

                    callback(true, data);
                });
            },
            connect: function(user, callback) {
                http({method: 'GET', url:'/api/onboard?'+ Object.toQueryString(user)}).success(function(data) {
                    callback(null,data);
                }).error(function(data,status,headers,config) {
                    callback(true,data);
                });
            },
            geocode: function(city, callback) {
                http({method: 'GET', url:'/api/geocode?city='+ city}).success(function(data) {
                    callback(null,data);
                }).error(function(data,status,headers,config) {
                    callback(true,data);
                });
            }
        }
    }]);
});

var moments = []; 
angular.module('moments', [], function($provide) {
    $provide.factory('Moments', ['$filter', 'MapUtilities', function(filter, mapUtilities) {
        return {
        	cluster : function(moments) {
        		console.log('c called');
        		var points = [];
        		for(var i = 0; i < moments.length; i++) {
        			for(var j = 0; j < moments[i].points.length; j++) {
        				points.push(moments[i].points[j]);
        			}
        		}
        		var clusters = [];
				clusters[0]= {center: {jb: points[0].lat, kb: points[0].lng}, points: [points[0]]}
				//return console.log(points.length);
				for(var i = 1; i < points.length; i++) {

					for(var j = 0; j < clusters.length; j++) {
            //console.log(clusters[j].center);
						var d = calcDistance(points[i].lat, clusters[j].center.jb, points[i].lng, clusters[j].center.kb)
						//console.log('distance from cluster center: '+ d);

						if(d < 40) {
							clusters[j].points.push(points[i]);

							clusters[j].center = mapUtilities.bounds(clusters[j].points).getCenter();
							//console.log(clusters[j].center);
              continue;

						} else {
							if(j == (clusters.length-1)) {
                //console.log('new cluster');
                //console.log(clusters.length);
								var newCluster = {
									center: {jb: points[i].lat, kb: points[i].lng},
									points: [points[i]]
								};

								clusters.push(newCluster);
								continue;
							} else {
								// continue...
							}
						}
					}
				}
        return clusters;
        	},

            build: function(transactions) {
                //Transactions sorted by month
                /*{'01/2011':{
                    trans: //array of transaction objects
                    }
                  }
                }}*/
                var dateObject = convertToDate(transactions);
                var keys = Object.keys(dateObject);
                var past, now;
                for (var i = keys.length - 1; i >= 0; i--) {
                    keys[i]

                    now = new Moment(dateObject[keys[i]].trans, dateObject[keys[i]].date)
                    if(past)
                        past.setParent(now);
                    now.setChild(past);
                    past = now;
                    moments.push(now);
                };
                return moments;
            }
        }
    }]);
});

/**
* Utility service for our results map 
*/
angular.module('map-utilities', [], function($provide) {
  $provide.factory('MapUtilities', [function() {
    return {
      calculateIQR: function(lat, lng) {
        //return ([lat,lng])
        lat = lat.sort(function(a,b){return a-b});
        lng = lng.sort(function(a,b){return a-b});

        var bottomLat   = this.cutHalf(lat)[0];
        var topLat    = this.cutHalf(lat)[1];

        var bottomLng   = this.cutHalf(lng)[0];
        var topLng    = this.cutHalf(lng)[1];

        var iqrLat = [bottomLat[this.findMedian(bottomLat, false)] , topLat[this.findMedian(topLat, true)]];
        var iqrLng = [bottomLng[this.findMedian(bottomLng, false)] , topLng[this.findMedian(topLat, true)]];

        return([iqrLat, iqrLng]);
      },
      cutHalf: function(a) {
        if(a.length%2==0) {
          return  [ 
            a.slice(0, a.length/2)   
          , a.slice(a.length/2, a.length) 
          ];
        } else {
          return  [ 
            a.slice(0, Math.floor(a.length/2) )   
          , a.slice(Math.ceil(a.length/2), a.length)  
          ];
        }
      },
      findMedian: function(a, up) {
        if(a.length%2!=0) {
          return  Math.floor(a.length/2);
        } else {
          if(up) {
            return  Math.ceil((a.length-1)/2)
          } else {
            return  Math.floor((a.length-1)/2)
          }
        }
      },
      bounds: function(points) {
        var lat = convertToLatLng(points).lat
        var lng = convertToLatLng(points).lng
        var iqr = this.calculateIQR(lat, lng);
        var iqrLat = iqr[0];
        var iqrLng = iqr[1];

        //iqrLat[0], iqrLng[0]
        
        /* Estimated Bounding Box for and Two Demensional IQR */ //Coordinate pairs could be off (correct icr, wrong placement)
        var sw  = new google.maps.LatLng(iqrLat[0], iqrLng[0]);
        var se  = new google.maps.LatLng(iqrLat[0], iqrLng[1]);
        var ne  = new google.maps.LatLng(iqrLat[1], iqrLng[1]);
        var nw  = new google.maps.LatLng(iqrLat[1], iqrLng[0]);

        return new google.maps.LatLngBounds(sw, ne);
      }
    }
  }]);
});

function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(d);
    d.setHours(0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
    // Return array of year and week number
    return [d.getFullYear(), weekNo, d.getMonth()+1];
}
function convertToDate(transactions){
    var tran_dates = {};
    var current, next, ident, month, week;
    for (var i = 0; i < transactions.length; i++) {
        current = new Date(transactions[i].date)
        //next = new Date(transactions[i+1].date)
        month   = (current.getMonth()+1);
        week    = (getWeekNumber(current));
        if(month<10)
            month = '0'+month
        ident = week[0] +'.'+ week[2] +'.'+ week[1];
        if(!tran_dates[ident] || !tran_dates[ident].trans){
            tran_dates[ident] = {date: ident, trans : [transactions[i]]};
        }
        else{
            tran_dates[ident].trans.push(transactions[i])
        }
    };
    return tran_dates;
}

function convertToLatLng(points){
  var lat=[], lng=[];
  for (var i = 0; i < points.length; i++) {
    lat.push(points[i].lat);
    lng.push(points[i].lng)
  };
  return {lat:lat, lng:lng};
}