var nodemailer = require('nodemailer');


/************
 *
 ***  Message Object   ***
 location : Description of where the error happened
 message.error : raw error message
 message.user	: the user in which  the error occured
 message.transaction: what transaction we errored on
 message.other	: an other information
 *
 ************/
 
//var rambler_url = 'http://localhost:3000/';
var rambler_url = 'http://www.rambler.io/';

module.exports=email=function(type, location, message, callback){
	try{
		var auth	=	{
				        user: "bot@plaid.io",
				        pass: "copperdog1"
				    	}

		if(type === 'onboard_success') {
			var from 	=	"Rambler Bot <bot@plaid.io>"
			,	to		=	message.email
			,	subject	=	"Rambler is Ready!";
			var body = "Thanks so much for your patience!  Rambler is ready for you.  Just head over to the following URL to get started.\n\n"+ rambler_url +"main/"+ message.access_token +" \n\nThanks,\nThe Rambler Team";
		} else if(type === 'onboard_error') {
			var from 	=	"Rambler Bot <bot@plaid.io>"
			,	to		=	message.email
			,	subject	=	"Rambler had a problem!";
			var body = "Thanks so much for your patience, but we ran into an issue when setting up your account.  It looks like it might be related to your American Express credentials.  Please head back to "+ rambler_url +" to fix that up!  The exact error was:\n\n"+ message.error+"\n\nThanks,\nThe Rambler Team";

		} else if(type === 'onboard_mfa') {

		} else if(type === 'waiting_list') {
			var from 	=	"Rambler Bot <bot@plaid.io>"
			,	to		=	'founders@plaid.io'
			,	subject	=	"Waiting list";
			var body = message.email;
		}
		// force email
		return sendMail(auth, from, to, subject, body, callback);

		// let's save this for later
		if(process.env.NODE_ENV=='production' || process.env.EMAIL=='true'){
			return sendMail(auth, from, to, subject, body, callback);
		}
		else
			if(callback) return callback("Emails only sent in production mode");
	}catch(err){
		console.log("Error sending error email");
		console.log(type);
		console.log(location);
		console.log(message);
		console.log(err.stack);
	}
}


function sendMail(auth, from, to, subject, body, callback){
	try{
		var smtpTransport = nodemailer.createTransport("SMTP",{
		    service: "Gmail",
		    auth: auth
		});

		// setup e-mail data with unicode symbols
		var mailOptions = {
		    from: from, 
		    to: to, 
		    subject: subject, // Subject line
		    text: body
		}

	    smtpTransport.sendMail(mailOptions, function(error, response){
	        if(error){
	        	console.log("Error sending mail");
	            console.log(error);
	        }
	        smtpTransport.close(); 
	        if(callback) callback(error);
	    });
	}
	catch(err){
		console.log("Error sending email");
		console.log(body);
		console.log(err);
		if(callback) callback(err);
	}
}