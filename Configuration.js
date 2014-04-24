var _ = require('underscore'); 
var localip = _.chain(require('os').networkInterfaces()).flatten().filter(function(val){ 
			return (val.family == 'IPv4' && val.internal == false) 
		}).pluck('address').first().value();

var config = {
	production: {
		host: "www.debellum.net",
		ip: process.env.IP,
		port: process.env.PORT,
		google:{
			clientID: "781347053598-o02dmj2qdsnk178khd3i0abtrc4edvns.apps.googleusercontent.com",
    		clientSecret: "4j-0LN1D68H_nyrXqej8YNFN"
		},
		facebook:{
			clientID: "246073382242593",
    		clientSecret: "82fecbb8c19a450ba5b896f48bf66449"
		}
	},
	development:{
		host: localip+":8000",
		ip: localip,
		port: 8000,
		google:{
			clientID: "781347053598-sch9m2dn9jn6k8d9cihmhe9qstq60d23.apps.googleusercontent.com",
    		clientSecret: "g-sTQL-hr5oJ0OmQBjaiDPqC"
		},
		facebook:{
			clientID: "246073382242593",
    		clientSecret: "82fecbb8c19a450ba5b896f48bf66449"
		}
	}
};


//var port = process.env.OPENSHIFT_NODEJS_PORT;  //openshift
//var ip   = process.env.OPENSHIFT_NODEJS_IP;    //openshift


module.exports = config;