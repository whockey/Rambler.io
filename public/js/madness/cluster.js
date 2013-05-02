/* Some Cluster analysis madness by William Hockey, Zach Perret & Michael Kelly


/* Calculate Clusters */
function generateClusters(points){

  var threshold = average(points);
  var clusters  = cluster(threshold, points);

  var i=0, markers=[], center;
  var z = setInterval(function(){
  	clearMap(markers, center);

  	if(i>= clusters.length)
  		return clearInterval(z)
  	//Plot cluster x
  	markers = plotPoints(clusters[i].points)
  	//Plot center of cluster x
  	center = createMarker(clusters[i].center.lat, clusters[i].center.lng, 2)
  	i++;
  }, 500)
}




function cluster(threshold, points){
  points = points.splice(0,100);
  var clusters = [];

  clusters[0]= {center: points[0], points: [points[0]]}

  for(var i = 1; i < points.length; i++) {
    // find a cluster for point i
    // iterate through the cluster
    for(var j = 0; j < clusters.length; j++) {
      if(calcDistance(clusters[j].center.lat, points[i].lat, clusters[j].center.lng, points[i].lng) < threshold) {
        clusters[j].points.push(points[i]);
        // recalcualte center
        clusters[j].center = center(clusters[j].points);

      } else {
        if(j == (clusters.length - 1)) {
          //console.log('creating a new cluster');
          // we made it through all the clusters, found no match
          // create a new cluster with this point in it
          clusters.push({center: points[i], points: [points[i]]});
        } else {

          // no match... continue
        }
      }
    }
  }

  return clusters;
}

function center(points) {
  var sumX  = 0; var sumY = 0;

  for(var i = 0; i < points.length; i++) {
    sumX += parseInt(points[i].lat); sumY += parseInt(points[i].lng);
  }
  return {lat:sumX/points.length, lng:sumY/points.length};
}



//Calculates average distance of points to its next neighbor
function average(points){
  var total=0
  for(var i=0; i<points.length-1; i++){
    distance = calcDistance(points[i].lat, points[i+1].lat, points[i].lng, points[i+1].lng)
    total+=distance;
  }
  return total/points.length;
}


//Calculate the distance in miles between two points
function calcDistance(lat1,lat2,lon1,lon2) {
  var R = 6371; // km
  var dLat = (parseInt(lat2)-parseInt(lat1)).toRad();
  var dLon = (parseInt(lon2)-parseInt(lon1)).toRad();
  var lat1 = parseInt(lat1).toRad();
  var lat2 = parseInt(lat2).toRad();

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