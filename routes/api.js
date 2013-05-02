/*
 * Serve JSON to our AngularJS client
 */
var plaid = require('plaid')({'client_id': '517ed609b084afa222000001', 'secret':'d_pBGhyFj16h6sA3k01j1j', 'protocol': 'https://', 'host': 'api.plaid.io'})
  , geocode = require('../utilities/geocode');

exports.geocode = function(req, res) {
	var city = req.query.city;

	if(!city) return res.json({success: false, error: 'No city provided.'});

	geocode(city, function(e,r) {
		if(r) {
			return res.json({success: true, lat: r[0], lng: r[1]});
		}
		else {
			return res.json({success:false, error: 'Unable to geocode.', message: e});
		}
	});
}

exports.transactions = function(req, res) {
	var access_token = req.query.access_token;

	plaid.get(access_token, function(error, transactions) {
		return res.json(transactions);
	});
}

exports.onboard = function(req, res) {
	var email 		  = req.query.email
	  , amex_username = req.query.amex_username
	  , amex_password = req.query.amex_password

	// 
	//if(!email || !amex_username || !amex_password) {
	//	return res.json({success: false, error: "Required fields are missing."}); 
	//}

	console.log('Start onboard for AMEX user [%s,%s] and email %s', amex_username, amex_password, email);

	res.connection.setTimeout(3600000); // 20 minute timeout... we kno
	// let's get aggressive...
	//var options = {'trans_history' : '730'};

	var options = {
		user:
		{
			'source' : 'rambler',
			'email'  : email
		},
		'no_trans' : true
	}
	// TODO: Make Plaid API AUTH call

	res.json({success:true});
	//return require('../email')('waiting_list', 'Rambler API', {email: email});
	plaid.connect({username: amex_username, password: amex_password}, 'amex', email, options, function(err, response, mfa) {
		if(!err) {
			if(mfa) {
				// handle MFA somehow?
				// lol fuck that
			} else {
				if(response.success) {
					// success!
					// send email
					// include access token in URL
					//require('../email')('onboard_success', 'Rambler API', {email: email, access_token: response.access_token});
				} else {
					// err'd
					// send email explaining details
					require('../email')('onboard_error', 'Rambler API', {email: email, error: response.error});
				}
			}
		} else {
			// err'd
			// send email explaining details
			require('../email')('onboard_error', 'Rambler API', {email: email, error: err});
		}
	});
}