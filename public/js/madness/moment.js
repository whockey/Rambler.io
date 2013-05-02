var Moment = function(transactions) {
    this.transactions = _transactionsToPoints(transactions).transactions;
    this.points       = _transactionsToPoints(transactions).points;
    this.markers      = [];
}

//Takes in an array of transaction objects
//and converts them to points
function _transactionsToPoints(transactions){
    var c, points=[], tran_holder=[];
    for (var i = 0; i < transactions.length; i++) {
        c = transactions[i].cleanedData;
        if((c && c.location) && (c.location.lat && c.location.lng)){
            tran_holder.push(transactions[i])
            points.push({lat: c.location.lat, lng: c.location.lng})
        }
    }

    console.log(tran_holder);


    return {points: points, transactions: tran_holder};
}
//time is an optional parameter that gently removes the point
Moment.prototype.placeMarkers = function(time, callback) {
    this.markers = [];
    if(!time){
        for (var i = 0; i < this.points.length; i++) {
            this.markers.push(_placeMarker(this.points[i].lat, this.points[i].lng));
        };
        return callback()
    }else{
        var i = 0;
        var self = this;
        var z = setInterval(function(){
            if(i>=self.points.length){
                clearInterval(z)
                return callback();
            }
             self.markers.push(_placeMarker(self.points[i].lat, self.points[i].lng));
            i++;
        }, time)
    }
};
//time is an optional parameter that gently removes the point
Moment.prototype.removeMarkers = function(time) {
    if(this.markers.length<1)
        return null;
    console.log("Removing markers ", this.markers.length);
    if(!time){
        for (var i = 0; i < this.points.length; i++) {
            this.markers[i].setMap(null);
        };
        this.markers = [];
    }else{
        var i = this.points.length-1;
        var self = this;
        var z = setInterval(function(){
            if(i<0)
                return clearInterval(z)
            self.markers[i].setMap(null);
            self.markers.removeAt(i);
            i--;
        }, time)
    }
};

Moment.prototype.setParent = function(parent){
    this.parent = parent;
}
Moment.prototype.setChild = function(child){
    this.child = child;
}

function _placeMarker(lat, lng) {
  var latLng = new google.maps.LatLng(lat, lng);
  return new google.maps.Marker({
    map: map,
    position: latLng
  });
}

