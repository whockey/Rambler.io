var good=0, bad=0;
var Moment = function(transactions, date) {
    this.date         = date
    this.transactions = _transactionsToPoints(transactions).transactions;
    this.points       = _transactionsToPoints(transactions).points;
    this.markers      = [];
    this.markers2      = [];
    this.placing      = false;

    this.stats        = _calculateStats(this.transactions);
    //Experimental set with null value 

    //this.infobubble = infobuble;
    //this.placeMarkers();
}

function _calculateStats(transactions) {
    if(transactions.length<1){
        return( {
            occurences: {'cities': {}, 'bars': {}, 'other': {}, 'food': {}},
            days: 0,
            spend: 0,
            transactions: 0
        });
    }
    /*
    var stats = {'spend': 0, 'bars': 0, 'food': 0, 'places': transactions.length, 'cities': 0, 'days': 0, 'other': 0, _bars: [], _food: [], _cities: []};
    var cities = []; // keep track of cities we've seen
    var occurences = {'cities': {}, 'bars': {}, 'food': {}};
    */

    var first = new Date(transactions[0].date); var last = new Date(transactions[transactions.length-1].date);
    var spend = 0;
    var days = Math.round(Math.abs((first.getTime() - last.getTime())/(24*60*60*1000)));

    var newOccur = {'cities': [], 'bars': [], 'food': [], 'other': []};
    var cat, t, city;
    for(var i = 0; i < transactions.length; i++) {
        t = transactions[i];

        var category = _determineCategory(t.cleanedData.category);
        newOccur[category].push(t.cleanedData.placeName);

        if(t.cleanedData.location && t.cleanedData.location.city)
            newOccur['cities'].push(t.cleanedData.location.city);

        /*
        // Check city
        if(t.cleanedData.location && t.cleanedData.location.city) {
            city = t.cleanedData.location.city.toLowerCase();
            if(cities.indexOf(city) == -1) {
                cities.push(city);
            } 
        }
        cat = _determineCategory(t.cleanedData.category);
        stats[cat]++;
        if(cat !== 'other') stats['_'+cat].push(t.cleanedData.placeName);
        stats['spend'] += t.amount;
        */
        spend += t.amount;
    }

    // deal with occur
    var occurences = {'cities': {}, 'bars': {}, 'other': {}, 'food': {}};
    for(var key in occurences) {
        var toDeal = newOccur[key];
        for(var i = 0; i < toDeal.length; i++) {
            occurences[key][toDeal[i]] = newOccur[key].count(toDeal[i]);
        }
    }

    return( {
        occurences: occurences,
        days: days,
        spend: spend,
        transactions: transactions.length
    });


    /*

    //console.log(newOccur);
    stats['cities'] = cities.length;
    stats['_cities'] = cities;
    stats['days'] = Math.round(Math.abs((first.getTime() - last.getTime())/(24*60*60*1000)));

    return stats; */                       
}

function _determineCategory(c) {
    if(!c) return 'other';
    var pieces = c.toLowerCase().split('>');
    for(var i = 0; i < pieces.length; i++) {
        pieces[i] = pieces[i].compact();
        if(pieces[i].indexOf('nightlife') > -1) return 'bars';
        if(pieces[i].indexOf('food') > -1) return 'food';
    }
    return 'other'
}

function _pickIcon(c) {
    if(!c) return 'genericPin';
    var pieces = c.toLowerCase().split('>');
    for(var i = 0; i < pieces.length; i++) {
        pieces[i] = pieces[i].compact();
        if(pieces[i].indexOf('nightlife') > -1) return 'barPin';
        if(pieces[i].indexOf('food') > -1) return 'foodPin';
        if(pieces[i].indexOf('shops') > -1) return 'shopPin';
    }
    return 'genericPin';
}

//Takes in an array of transaction objects
//and converts them to points
function _transactionsToPoints(transactions){
    var good =0, bad=0;
    var c, points=[], tran_holder=[];
    for (var i = 0; i < transactions.length; i++) {
        c = transactions[i].cleanedData;
        if((c && c.location) && (c.location.lat && c.location.lng)){ 
            if(transactions[i].score==1 || transactions[i].score==2){
                tran_holder.push(transactions[i])
                points.push({lat: c.location.lat, lng: c.location.lng})
                good++
            }else{
                bad++
            }
        }else{
            bad++
        }
    }
    //console.log("Transaction length %s", transactions.length);
    //console.log("Good: %d, Bad, %d", good, bad);
    return {points: points, transactions: tran_holder};
}
//time is an optional parameter that gently removes the point
Moment.prototype.placeMarkers = function(map, time, callback) {
    if(this.points.length<1)
        return
    this.markers = [];
    this.markers2 = [];
    //console.log("Placing markers ", this.points.length);
    if(!time){
        this.placing=true;
        for (var i = 0; i < this.points.length; i++) {
            var placed = _placeMarker(this.points[i].lat, this.points[i].lng, i, this.transactions[i].cleanedData.category, map)
            var m = placed.one;
            var m2 = placed.two;
            this.markers.push(m);
            this.markers2.push(m2);
            var self = this;
            new google.maps.event.addListener(m, 'click', function(one, two, three) {
                var t = self.transactions[this.momentIndex];
                $('.ibox-name').html(t.cleanedData.placeName);
                $('.ibox-line1').html(t.cleanedData.category);
                $('.ibox-line2').html(Date.create(t.date).format('{Month} {d}, {yyyy}') +' - $'+ t.amount);
                infobubble.open(map, this);
            });
            new google.maps.event.addListener(m2, 'click', function(one, two, three) {
                var t = self.transactions[this.momentIndex];
                $('.ibox-name').html(t.cleanedData.placeName);
                $('.ibox-line1').html(t.cleanedData.category);
                $('.ibox-line2').html(Date.create(t.date).format('{Month} {d}, {yyyy}') +' - $'+ t.amount);
                infobubble.open(map, this);
            });

        }
        this.placing=false;
        if(callback) return callback()
    }else{
        var i = 0;
        var self = this;
        this.placing=true
        var z = setInterval(function(){
            if(i>=self.points.length-1){
                clearInterval(z)
                self.placing=false;
                if(callback) return callback()
            }
            if(!self.points[i])
                console.log(self.points);
            var placed = _placeMarker(self.points[i].lat, self.points[i].lng, i, self.transactions[i].cleanedData.category, map)
            var m = placed.one;
            var m2 = placed.two;
            self.markers.push(m);
            self.markers2.push(m2);
            var s = self;
            new google.maps.event.addListener(m, 'click', function(one, two, three) {
                var t = s.transactions[this.momentIndex];
                $('.ibox-name').html(t.cleanedData.placeName);
                $('.ibox-line1').html(t.cleanedData.category.split('>').pop());
                $('.ibox-line2').html(Date.create(t.date).format('{Month} {d}, {yyyy}') +' - $'+ t.amount);
                infobubble.open(map, this);
            });
            new google.maps.event.addListener(m2, 'click', function(one, two, three) {
                var t = self.transactions[this.momentIndex];
                $('.ibox-name').html(t.cleanedData.placeName);
                $('.ibox-line1').html(t.cleanedData.category);
                $('.ibox-line2').html(Date.create(t.date).format('{Month} {d}, {yyyy}') +' - $'+ t.amount);
                infobubble.open(map, this);
            });
            i++;
        }, time)
    }
};
//time is an optional parameter that gently removes the point
Moment.prototype.removeMarkers = function(time) {
    infobubble.close();

    if(this.markers.length<1)
        return null;
    if(!time){
        for (var i = 0; i < this.points.length; i++) {
            this.markers[i].setMap(null);
            this.markers2[i].setMap(null);
        };
        //this.markers = [];
    }else{
        var i = this.markers.length-1;
        var self = this;
        var z = setInterval(function(){
            if(i<0)
                return clearInterval(z)
            if(self.markers[i])
                self.markers[i].setMap(null);
            self.markers2[i].setMap(null);
            //self.markers.removeAt(i);
            i--;
        }, time)
    }
};

Moment.prototype.setMap = function(map){
    for (var i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(map);
    };
}
Moment.prototype.setParent = function(parent){
    this.parent = parent;
}
Moment.prototype.setChild = function(child){
    this.child = child;
}

function _placeMarker(lat, lng, mi, cat, map) {
  var latLng = new google.maps.LatLng(lat, lng);
  var m = new google.maps.Marker({
    map: map,
    position: latLng,
    momentIndex: mi,
    icon: '/images/'+_pickIcon(cat) +'.png'
  });
  var m2 = new google.maps.Marker({
    map: map2,
    position: latLng,
    momentIndex: mi,
    icon: '/images/'+_pickIcon(cat) +'.png'
  });
  return {one:m, two:m2};
}

