var config = {
	production: {
		host: "www.debellum.net",
		ip: process.env.IP,
		port: process.env.PORT
	},
	development:{
		host: "mardif.noip.me:8000",
		ip: "192.168.0.10",
		port: 8000
	}
};


//var port = process.env.OPENSHIFT_NODEJS_PORT;  //openshift
//var ip   = process.env.OPENSHIFT_NODEJS_IP;    //openshift


module.exports = config;