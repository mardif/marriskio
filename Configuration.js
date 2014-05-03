var util = require("util");
var _ = require('underscore'); 

var Configuration = function(){

	this.init = function(){
		util.log("Initializing Configuration class");
	}

	var getLocalip = function(){ 
		return _.chain(require('os').networkInterfaces()).flatten().filter(function(val){ 
			return (val.family == 'IPv4' && val.internal == false) 
		}).pluck('address').first().value();
	}

	var DEVELOPMENT = "development";
	var PRODUCTION = "production";
	var config = {
		production: {
			heroku: {
				host: "www.debellum.net",
				ip: process.env.IP,
				port: process.env.PORT
			},
			openshift: {
				host: "debellum-mardif.rhcloud.com",
				ip: process.env.OPENSHIFT_NODEJS_IP,
				port: process.env.OPENSHIFT_NODEJS_PORT
			},
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
			host: getLocalip()+":8000",
			ip: getLocalip(),
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
	this.getEnvironment = function(){
		if ( process.env.NODE_ENV == PRODUCTION || process.env.OPENSHIFT_NODEJS_IP ){
			return PRODUCTION;
		}
		else{
			return DEVELOPMENT;
		}
	};

	var getPlatform = function(){
		if ( process.env.PORT ){
			return "heroku";
		}
		else if ( process.env.OPENSHIFT_NODEJS_PORT ){
			return "openshift";
		}
		return "";
	};

	this.isProduction = function(){
		return this.getEnvironment() == PRODUCTION;
	};

	this.getHost = function(){
		if ( this.isProduction() ){
			return config[this.getEnvironment()][getPlatform()].host;
		}
		return config[this.getEnvironment()].host;
	}
	this.getIP = function(){
		if ( this.isProduction() ){
			return config[this.getEnvironment()][getPlatform()].ip;
		}
		return config[this.getEnvironment()].ip;
	}
	this.getPort = function(){
		if ( this.isProduction() ){
			return config[this.getEnvironment()][getPlatform()].port;
		}
		return config[this.getEnvironment()].port;
	}

	this.getOAuthClientId = function(platform){
		return config[this.getEnvironment()][platform].clientID;
	}

	this.getOAuthClientSecret = function(platform){
		return config[this.getEnvironment()][platform].clientSecret;
	}

	this.init();
}

var conf = new Configuration();
exports.Configuration = conf;