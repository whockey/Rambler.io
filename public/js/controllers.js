'use strict';

/* Controllers */
var map, map2, first, z, auto_start='', playMap, stopMap, infobubble;

var saveCookie = true;

function MainCtrl($scope, $rootScope, $cookies, $location, $routeParams, Plaid, Moments, MapUtilities) {
	var at;

	if($routeParams.access_token === 'demo') {
		// Demo AT using Rambler client ID
		$scope.demo = true;
		at = '-e-j-xzumdCStZRTKvuzBw4Be0Q=r8MlckeS90f62a62f646e4a8d3bb0730f9c76226e2d3a6487e02bef786abc02b7b7b2302f123f090affe5a44a79be1f14074f5df49984bb90f92f59c55ab935daa142f95';
	} else {
		$scope.demo = false;
		at = $routeParams.access_token;
	}

	if(!at && $cookies.access_token) {
		if($cookies.access_token) {
			at = $cookies.access_token;
		} else {
			$location.path('/onboard');
		}
	}		


	$(function(){
			$('.spinIn').delay(2000).css({'transition':'1s','visibility':'visible','-webkit-transform':'rotate(' + 360 + 'deg)'});
	});

	$(function(){
		$('#map_canvas').css('height', ($(window).height()-126));
	})

	$(function(){
		$('.firstLoadPlay').click(function(){
			$('.firstLoadPlay').css({'transition':'1s','-webkit-transform':'rotate(720deg)','opacity':'0'});
			$('.overlay').delay(350).fadeOut(300);
			$('#firstPlayHolder').delay(350).fadeOut(300);
			$('#playButton').click();

		});
	});

	$(window).resize(function() {
	  $('#map_canvas').css('height', ($(window).height()-126));
	  google.maps.event.trigger(map, "resize");
	});

	$(function(){
		var n = 2;
		$('.spinIn').click(function(){
			n++;
			$('.spinIn').css({'transition':'1s','-webkit-transform':'rotate(' + 180*n + 'deg)'});
			$('.statsPanel').toggleClass('tallPanel');
			$('.sliderHolder').toggleClass('sliderUp');
			$('.dateHolder').toggleClass('highDate');
			$('.magnify').toggleClass('magSlide');

		});
	});

	_showNumber('days', 0);
	_showNumber('places', 0);
	_showNumber('cities', 0);
	_showNumber('food', 0);
	_showNumber('bars', 0);

	/*if(at && $routeParams.access_token) {
			console.log('saving cookie');
			$cookies.access_token = $routeParams.access_token;
	} else {
			console.log('not saving the cookie cause im not a pussy');
	}

	if(!$cookies.access_token) {
		$location.path('/onboard');
	}*/
	var image = 'imgs/http://google-maps-icons.googlecode.com/files/factory.png';

	infobubble = new InfoBubble({
        content: document.getElementById('ibox'),
        shadowStyle: 0,
        padding: 10,
        backgroundColor: 'rgb(242,242,242)',
        borderRadius: 0,
        arrowSize: 15,
        borderWidth: 1,
        borderColor: 'rgb(204,204,204)',
        disableAutoPan: true,
        hideCloseButton: true,
        arrowPosition: 30,
        backgroundClassName: 'popup',
        arrowStyle: 2
    });
	
	//$scope.myMarkers = [];
	$scope.mapOptions = {
	    zoom :5,
	    scrollwheel: true,
	    mapTypeControl: false,
	    panControl: false,
	    streetViewControl: false,
	    mapTypeId : google.maps.MapTypeId.ROADMAP,
	    center: new google.maps.LatLng(38.73721617295555, -92.560546875)
	    // center of US: 39.8282, -98.5795
	    //37.857507 , -87.1875
	};

	$scope.mapOptionsTwo = {
	    zoom : 11,
	    scrollwheel: true,
	    mapTypeControl: false,
	    panControl: false,
	    streetViewControl: false,
	    mapTypeId : google.maps.MapTypeId.ROADMAP,
	    center: new google.maps.LatLng(33.779718, -84.370537)
	};

	$scope.stats = {days : 0, places: 0, spend: 0};
	$scope._showCumulativeStats = function(max) {
		$scope.stats = _cumulativeStats(max);
		for(var key in $scope.stats) {
			_showNumber(key, $scope.stats[key]);
		}
	}

	$scope._inflectionPoint = function(max) {
		var transitions = [];
		for(var i = 1; i < max; i++) {
			var stats1 = _cumulativeStats(i);
			var stats2 = _cumulativeStats(i-1);
			//console.log(stats1.highScores.cities[0]);
			//console.log(stats1.highScores.cities[0] + ' -- '+ stats2.highScores.cities[0]);
			//console.log(stats1.highScores.cities[1] + ' -- '+ stats2.highScores.cities[1]);
			if(!stats1.highScores.cities[0] || !stats2.highScores.cities[0] || !stats1.highScores.cities[1] || !stats2.highScores.cities[1]) continue;

			var d1 = (stats1.highScores.cities[0][1] - stats2.highScores.cities[0][1])
			var d2 = (stats1.highScores.cities[1][1] - stats2.highScores.cities[1][1])

			//if(stats2.highScores.cities[0][0] !== stats2.highScores.cities[1][0]) continue;
			if(stats1.highScores.cities[1][0] != stats2.highScores.cities[1][0]) continue;
			if(d2 > d1 && ((d2-d1) > 4)) {
				//console.log('d2: '+ d2 +' -- '+ d1);
				//console.log('mightve found dat inflection point');
				//console.log('moment index: '+ i);
				if(transitions[transitions.length-1]) {
					var prev = transitions[transitions.length-1];
					if(prev.city === stats1.highScores.cities[1][0]) {
						continue;
					}
				}
				transitions.push({moment: i, city: stats1.highScores.cities[1][0], from: stats1.highScores.cities[0][0]})
				//console.log(transitions);
				//console.log('going to move from '+ stats1.highScores.cities[0][0] +' to '+ stats1.highScores.cities[1][0] +' at '+ i);
				//return {moment: i, city: stats1.highScores.cities[1][0]}
			}
			//console.log(d1 +' v. '+ d2);
		}
		return transitions;
	}

	function _determineMinimapCity(inflectionPoints, moment) {
		if(!inflectionPoints || inflectionPoints.length == 0) {
			return;
		}
		for(var i = 0; i < inflectionPoints.length; i++) {
			var nextPoint = inflectionPoints[i+1];
			var previousPoint = inflectionPoints[i-1];
			if(nextPoint) {
				if(inflectionPoints[i].moment <= moment && moment < nextPoint.moment) {
					return inflectionPoints[i].city;
				}
			} else {
				if(inflectionPoints[i].moment <= moment) {
					return inflectionPoints[i].city;
				}
			}
		}
		return inflectionPoints[0].from;
	}

	function _determineCityCoordinates(city, callback) {
		var latLng = [];
		var iter = function(tran, cbk) {
			if((tran.cleanedData.location && tran.cleanedData.location.city) && tran.cleanedData.location.city === city) {
				latLng.push({lat: tran.cleanedData.location.lat, lng: tran.cleanedData.location.lng});
			}
			return cbk();
		}
		var cb = callback;
		async.each($rootScope.transactions, iter, function(err, res) {
			callback(MapUtilities.bounds(latLng))
		});
		//console.log($rootScope.transactions)
	}
	$(function(){
		$('.firstLoadPlay').attr('src', 'images/firstPlayEmpty.svg');
		$('.firstLoadPlay').attr('alt', 'images/firstPlayEmpty.svg')
	})
	Plaid.get(at, function(error, response) {
		$rootScope.transactions = response.transactions;
		//Builing our moment linkedlist
		var buildMap = function(){
			$rootScope.moments = Moments.build($rootScope.transactions);

			$scope.inflectionPoints = $scope._inflectionPoint($rootScope.moments.length);

			// Set up minimap
			if($scope.inflectionPoints[0]) {
				// take 1st inflection point as starter
				$scope.currentCity = $scope.inflectionPoints[0].from;
				_determineCityCoordinates($scope.currentCity, function(bounds) {
					map2.fitBounds(bounds);
				});

			} else {
				// take max city
				var maxStats = _cumulativeStats($rootScope.moments.length-1);
				if((maxStats && maxStats.highScores.cities) && maxStats.highScores.cities[0]) {
					$scope.currentCity = maxStats.highScores.cities[0][0];
					_determineCityCoordinates($scope.currentCity, function(bounds) {
						map2.fitBounds(bounds);
					});
				}

			}

			$( "#slider" ).slider({
				value:0,
				min: 0,
				max: $rootScope.moments.length-1,
				step: 1,
				change: function( event, ui ) {
					$scope.$apply (function() {
						var down;
						var oldValue = $scope.sliderValue;
						if(oldValue>ui.value)
							down =true;
						else
							down =false;
	 					$scope.sliderValue = ui.value;

	 					var moment = $rootScope.moments[$scope.sliderValue];

	 					var monthNames = [ "January", "February", "March", "April", "May", "June",
	 					    "July", "August", "September", "October", "November", "December" ];

	 					if(down){
	 						if(moment && moment.parent){
	 							for (var i = ui.value+1; i <= oldValue; i++) {
	 								if($rootScope.moments[i]){
	 									removeMoment($rootScope.moments[i], 100)
	 								}
	 							};
	 						}
	 					}
	 					else{
	 						if(moment && moment.child){
	 							for (var i = oldValue; i < ui.value; i++) {
	 								if($rootScope.moments[i]){
	 									removeMoment($rootScope.moments[i], 100)
	 								}
	 							};
	 						}
	 					}
	 					if(moment){
	 						if(moment.points.length<1)
	 							return;
	 						//map.fitBounds(MapUtilities.bounds(moment.points))
	 						//console.log("Displaying " + moment.date);
	 						
	 						var date = new Date(moment.date.split('.')[0]+'.'+moment.date.split('.')[1])
	 						$('#date').html(monthNames[date.getMonth()] + ', ' + date.getFullYear());

	 						var date = new Date(moment.date.split('.')[0]+'.'+moment.date.split('.')[1])
	 						$('#date').html(monthNames[date.getMonth()] + ', ' + date.getFullYear());
	 						


	 						if($scope.inflectionPoints) {
	 							var panToCity = _determineMinimapCity($scope.inflectionPoints, $scope.sliderValue);
	 							
	 							if(panToCity != $scope.currentCity) {
	 								$scope.currentCity = panToCity;
									_determineCityCoordinates($scope.currentCity, function(bounds) {
										//console.log(bounds);
										map2.fitBounds(bounds);
										map2.setZoom(map2.getZoom()-1);
										//map2.fitBounds(bounds);
									});	 								
	 							}
	 						}

	 						moment.placeMarkers(map, 100);
	 						//_showStats(moment.stats);
	 						$scope._showCumulativeStats($scope.sliderValue);
	 					}
					});
				}
			});
			var play=false, speed=500;
			$(document).keydown(function(e){
				if(e.keyCode==32){
					$('#playButton').click();
				}
			});
			$('#playButton').click(function(){
				if(!play){
					playMap = function() {
					    if (auto_start !== "") {
					        return;
					    }

					    play = true;
					    $('#playButton').removeClass('play').addClass('pause');
					    var i = $scope.sliderValue+1 || 0
					    $("#slider").slider('value', i++)

					    auto_start = setInterval(function() {
					    	if(i==$rootScope.moments.length){
					    		clearInterval(auto_start);
					    		$('#playButton').removeClass('pause').addClass('play');
					    	}
					    	$("#slider").slider('value', i++)
					    }, speed);
					};

					stopMap = function() {
					    clearInterval(auto_start);
					    auto_start = "";
					    play = false;
					    $('#playButton').removeClass('pause').addClass('play');
					};


					playMap();

				}else{
					play = false;
					clearInterval(auto_start);
					auto_start = "";
					$('#playButton').removeClass('pause').addClass('play');
				}
			});

			var all=false;
			$('#allButton').click(function(){
					if(!all){
						for (var i = 0; i < $rootScope.moments.length; i++) {
							$rootScope.moments[i].placeMarkers(map);
						}
						all=true;
						//$("#slider").slider('value', $rootScope.moments.length)
						$('#allButton').html("&times;");
					}else{
						for (var i = 0; i < $rootScope.moments.length; i++) {
							removeMoment($rootScope.moments[i])
						}
						all=false;
						//$("#slider").slider('value', 0)
						$('#allButton').html("All");
					}
			});

		}
		if(!response.success) {
			$scope.error = response.message;
		} else {
			map = $scope.myMap;
			map2 = $scope.mapTwo;
			if(!map){
				var z = setInterval(function(){
					if(map && map2){
						clearInterval(z);
						map = $scope.myMap;
						map2 = $scope.mapTwo;
						console.log("Map loaded...");
						buildMap();
						var i = -1;
					}else{
						map = $scope.myMap;
						map2 = $scope.mapTwo;
						console.log("Map not loaded yet");
					}
				}, 500)
			}else{
				console.log("Map loaded");
				buildMap();
			}
		}

	});

	// Display a number on the flipper
	function _showNumber(flipper, n) {
		n = n.toString();
		if(n < 10) n = '000'+n;
		else if(n < 100 && n > 9) n = '00'+n;
		else if(n < 1000 && n > 99) n = '0'+n;

		var selectors = ['thousands', 'hundreds', 'tens', 'ones'];
		for(var i = 0; i < selectors.length; i++) {
			var sel = '#'+ flipper +' .'+ selectors[i];

			var curVal = $(sel).children('.number').html();
			if(curVal == n[i]) continue;

			$(sel).children('.number').css({'transition':'0.2s','-webkit-transform':'rotateX(' + 360*n + 'deg)'})
			$(sel).children('.number').delay(2000).empty().append((n[i]));
		}
	}

	// Display stats on the assorted flippers
	function _showStats(stats) {
		for(var k in stats) {
			_showNumber(k, stats[k]);
		}
	}

	var cumStatsCache = [];

	function _cumulativeStats(max) {
		if(cumStatsCache[max]) {
			return cumStatsCache[max];
		}


		var globalOccurences = {'bars': [], 'food': [], 'cities': []};
		var stats = {'bars': [], 'food': [], 'places': [], 'cities': [], 'days': 0, 'other': 0, 'spend': 0, 'transactions': 0};
		for(var i = 0; i <= max; i++) {
			var s = $rootScope.moments[i].stats;

			//console.log('----');
			for(var key in s.occurences) {
				if(!globalOccurences[key]) continue;
			//	console.log('---'+key+'---');
				for(var item in s.occurences[key]) {
						//console.log(item);
						//console.log(globalOccurences[key][item]);
						//console.log(s.occurences[key][item]);
					if(globalOccurences[key][item]) {
						globalOccurences[key][item] += s.occurences[key][item];
					} else {
						globalOccurences[key][item] = s.occurences[key][item];
					}
				}
			}

			var sortable;
			var highScores = {'cities': [], 'bars': [], 'food': []}
			for(var key in globalOccurences) {
				sortable = [];
				for(var obj in globalOccurences[key]) {
					sortable.push([obj, globalOccurences[key][obj]]);
				}
				sortable.sort(function(a, b) {return b[1] - a[1]})
				highScores[key] = sortable.splice(0,5);
			}

			stats['places'] = stats['places'].union(Object.keys(s['occurences']['other']));
			stats['bars'] = stats['bars'].union(Object.keys(s['occurences']['bars']));
			stats['food'] = stats['food'].union(Object.keys(s['occurences']['food']));
			stats['cities'] = stats['cities'].union(Object.keys(s['occurences']['cities']));

			stats['days'] += s.days;
			stats['spend'] += s.spend;
			stats['transactions'] += s.transactions;
		}

		var resultObj = {
			'bars' 	 : stats['bars'].length,
			'food'   : stats['food'].length,
			'cities' : stats['cities'].length,
			'days'   : stats['days'],
			'places' : stats['places'].length + stats['food'].length + stats['bars'].length,
			'spend'  : stats['spend'],
			'transactions' : stats['transactions'],
			'highScores': highScores
		};

		cumStatsCache[max] = resultObj;

		return resultObj;
	}

}

function OnboardCtrl($scope, $rootScope, $cookies, Plaid) {

	$(function(){
		$('.question').mouseover(function(){
			$('.infoBox').addClass('show');
		});
		$('.question').mouseleave(function(){
			setTimeout(function(){$('.infoBox').removeClass('show');}, 3000);
		});
	});

	$scope.onboard = function() {
		$scope.error = null;

		// !$scope.user || !$scope.user.email || !$scope.user.amex_username || !$scope.user.amex_password
		if(!$scope.user || !$scope.user.email) {
			$('.onboardMessage').addClass('onboardError');
			return $scope.message = 'Please provide us with an email address!';
		} else {
			Plaid.connect($scope.user, function(err, resp) {
				console.log(err || resp);
				// request initial indicator
				// this should almost unversally go through, unless the API is down or the request was spoofed
				if(!err) {
					if(resp.success) {
						$('.onboardMessage').removeClass('onboardError');
						$('.inputHolder').hide();
						//$('.onboardMessage').addClass('onboardSuccess');
						$('.onboardMessage').hide();
						$scope.message = 'Thanks for signing up! We are processing your data now, which is quite a heavy process. We will send a message to ' + $scope.user.email + ' as soon as your account is ready. This generally takes ~30 minutes.';
					} else {
						$scope.message = 'Something went wrong...';
					}
				} else {
					$scope.message = 'Something went wrong...';
				}
			});
		}
	}
}

function removeMoment(moment, time){
	if(moment.placing==true){
		setTimeout(function(){
			removeMoment(moment);
		}, 100)
	}else{
		moment.removeMarkers(time)
	}
}


function shouldChange(current, i, moments, down, MapUtilities){
	var next = down ? moments[i+1] : moments[i-1]
	var previous = down ? moments[i-1] : moments[i+1]

	var center = MapUtilities.bounds(current.points).getCenter();
	var next_center = MapUtilities.bounds(next.points).getCenter();
	var previous_center = MapUtilities.bounds(previous.points).getCenter();
	//var m = new google.maps.Marker({
	//  map: map,
	//  position: center
	//});
	//setTimeout(function(){m.setMap(null)}, 10000)
	if(calcDistance(center.jb, next_center.jb, center.kb, next_center.kb)>100)
		return true;
	else
		return false;
}

//Calculate the distance in miles between two points
function calcDistance(lat1,lat2,lon1,lon2) {
  var R = 6371; // km
  var dLat = ((lat2)-(lat1)).toRad();
  var dLon = ((lon2)-(lon1)).toRad();
  var lat1 = (lat1).toRad();
  var lat2 = (lat2).toRad();

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  //km
  //return d;
  //miles
  return parseInt(parseInt(d)*.62137);
}
Number.prototype.toRad = function() {  // convert degrees to radians
   return this * Math.PI / 180;
}

function smoothZoomIn (map, max, cnt, callback) {
    if (cnt >= max) {
            return callback();
        }
    else {
        var z = google.maps.event.addListener(map, 'zoom_changed', function(event){
            google.maps.event.removeListener(z);
            self.smoothZoomIn(map, max, cnt + 1, callback);
        });
        setTimeout(function(){return map.setZoom(cnt)}, 100); // 80ms is what I found to work well on my system -- it might not work well on all systems
    }
}

function smoothZoomOut (map, max, cnt, callback) {
	console.log(max);
	console.log(cnt);
    if (cnt <= max) {
            return callback();
        }
    else {
        var y = google.maps.event.addListener(map, 'zoom_changed', function(event){
            google.maps.event.removeListener(y);
            self.smoothZoomOut(map, max, cnt - 1, callback);
        });
        setTimeout(function(){return map.setZoom(cnt)}, 100); // 80ms is what I found to work well on my system -- it might not work well on all systems
    }
}  
