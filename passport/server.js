var express = require('express'),
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
    app = express.createServer();
 
app.use(express.static(__dirname + '/public'));
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
 
passport.serializeUser(function(user, done) {
  done(null, user);
});
 
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});
 
 
var TWITTER_CONSUMER_KEY = "pdh7eiZHcRgZ6OYcCslIw";
var TWITTER_CONSUMER_SECRET = "Y2kxQbFSRlHWd8VW1rtBVc42Yr5hEb7R0iRR9D0U";
 
passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://2.226.32.121:8000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    // NOTE: You'll probably want to associate the Twitter profile with a
    //       user record in your application's DB.
    var user = profile;
    return done(null, user);
  }
));
 
 
app.get('/', function(req, res){
    res.send('Hello World, please <a href="/login">Signin here</a>');
  });
 
app.get('/account',
  ensureLoggedIn('/login'),
  function(req, res) {
    res.send('Hello ' + req.user.username+ ' - <a href="/logout">Logout</a>');
  });

app.get('/login', function(req, res){
	res.sendfile(__dirname + '/public/login.html');
});
  
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});
 
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { successReturnToOrRedirect: '/account', failureRedirect: '/login' }));
 
 
var server = app.listen(8000);
console.log('Express server started on port %s', server.address().port);