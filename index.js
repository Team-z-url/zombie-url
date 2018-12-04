// Packages
const express = require('express');
const hbs = require('hbs');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userAccounts = require('./data/userAccounts');
const userZombies = require('./data/userZombies');
const userOpponents = require('./data/userOpponents');
const Battle = require('./battle/battle');
const bodies = require('./data/bodies');
const keys = require('./config/keys');
const PORT = process.env.PORT || 8080;
const rootUrl =
	// Node environment variable that allows heroku to host the website without us needing to change anything
	process.env.NODE_ENV === 'production'
		? 'zombie-url.herokuapp.com/body/'
		: 'localhost:8080/body/';

// Telling the handlebars where the partial.hbs files are located
hbs.registerPartials(__dirname + '/views/partials');

// Helper that returns the current year
hbs.registerHelper('getCurrentYear', () => {
	return new Date().getFullYear();
});

// Helper that combines Url with bodyID
hbs.registerHelper('urlBody', bodyId => {
	return rootUrl + bodyId;
});

// hbs.registerHelper('breaklines', function(text) {
// 	text = hbs.Utils.escapeExpression(text);
// 	text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
// 	return new hbs.SafeString(text);
// });

// User and Password authorization
passport.use(
	'local',
	new LocalStrategy(
		{ usernameField: 'username' },
		(username, password, done) => {
			foundUser = userAccounts.getUserByUsername(username);
			if (!foundUser) {
				return done(null, false, { message: 'Invalid username.' });
			}
			if (!userAccounts.checkPassword(username, password)) {
				return done(null, false, { message: 'Invalid password.' });
			}
			return done(null, foundUser);
		}
	)
);

// Authentication for Google login
passport.use(
	'google',
	new GoogleStrategy(
		{
			clientID: keys.googleClientID,
			clientSecret: keys.googleClientSecret,
			callbackURL: '/auth/google/callback',
			proxy: true
		},
		(accessToken, refreshToken, profile, done) => {
			console.log(profile);
			const existingUser = userAccounts.getUserByGoogleId(profile.id);

			if (existingUser) {
				return done(null, existingUser);
			}
			const user = userAccounts.addGoogleUser(profile.id, profile.displayName);
			done(null, user);
		}
	)
);

// Turns the user object into a string
passport.serializeUser((user, done) => {
	done(null, user.id);
});

// Turns a string into a user object
passport.deserializeUser((id, done) => {
	foundUser = userAccounts.getUserById(id);
	done(null, foundUser);
});

var app = express();

// Enabling access to the req.body object
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Used with passport.js to create a session
app.use(
	session({
		secret: keys.cookieKey,
		resave: true,
		saveUninitialized: false
	})
);

// Passport initialization and session creation
app.use(passport.initialize());
app.use(passport.session());

// Tells express to use handlebars to render html pages
app.set('view engine', 'hbs');

// Tells express where the public assets are
app.use(express.static(__dirname + '/public'));

// Logs out HTTP requests to backend
app.use(morgan('dev'));

// Home index handle-er
app.get('/', (request, response) => {
	// console.log(request.user);
	if (request.user) {
		let user = request.user;
		let zombie = userZombies.getZombieByUserId(user.id);
		response.render('index-user.hbs', {
			user: user,
			zombie: zombie
		});
	} else {
		response.render('index-guest.hbs');
	}
});

// Battle page handle-er
app.get('/battle', (req, res) => {
	if (req.user) {
		let user = req.user;
		let opponents = userOpponents.getOpponentsByUserId(user.id);
		// console.log(opponents);
		res.render('battle.hbs', {
			opponents: opponents.humans
		});
	} else {
		res.redirect('/');
	}
});

// results page handle-er. Also starts a battle object and returns battle results
app.get('/battle/result/:index', async (req, res) => {
	if (req.user) {
		let user = req.user;
		let zombie = userZombies.getZombieByUserId(user.id);
		let opponents = userOpponents.getOpponentsByUserId(user.id);
		let target = opponents.humans[req.params.index];
		let battle = new Battle();
		let url = null;
		battle.initialize({
			ally: zombie,
			foe: target
		});
		result = await battle.start();
		// console.log('result' + result);
		// console.log(battle);
		if (result.winner) {
			url = bodies.generateBody(zombie, target);
			userOpponents.deleteOpponentsForUser(req.user.id);
		} else {
			userZombies.deleteZombieForUser(req.user.id);
		}
		console.log(result.log.split('\n'));
		res.render('result.hbs', {
			log: result.log.split('\n').slice(0, -2),
			winner: result.winner,
			url: url
		});
	} else {
		res.redirect('/');
	}
});

// bodies page handle-er
app.get('/bodies', (req, res) => {
	if (req.user) {
		let user = req.user;
		let bodyCollection = bodies.getBodyCollectionByUserId(user.id);
		res.render('bodies.hbs', { bodies: bodyCollection.bodies });
	} else {
		res.redirect('/');
	}
});

// claimbody page handle-er
app.get('/body/:id', (req, res) => {
	if (req.user) {
		let bodyFound = bodies.getBodyById(req.params.id);
		if (bodyFound) {
			res.render('claimbody.hbs', {
				body: bodyFound
			});
		} else {
			res.redirect('/');
		}
	} else {
		res.redirect('/');
	}
});

// claim body logic handle-er
app.post('/body', (req, res) => {
	if (req.user) {
		// console.log(req.body);
		let bodyFound = bodies.getBodyById(req.body.bodyId);
		if (bodyFound) {
			userZombies.replaceZombieForUserWithBody(req.user.id, bodyFound);
			bodies.deleteBodyById(bodyFound.id);
			res.redirect('/');
		} else {
			res.redirect('/');
		}
	} else {
		res.redirect('/');
	}
});

app.get('/about', (request, response) => {
	response.render('about.hbs');
});

app.get('/register', (request, response) => {
	response.render('register.hbs');
});

// How the register page works
app.post('/register', function(req, res) {
	var password = req.body.password;
	var password2 = req.body.password2;

	if (password == password2) {
		addedUser = userAccounts.addLocalUser(req.body.username, req.body.password);
		if (!addedUser) {
			res.status(500).send('{errors: "User already exists"}');
		} else {
			passport.authenticate('local')(req, res, function() {
				res.redirect('/');
			});
		}
	} else {
		res.status(500).send('{errors: "Passwords don\'t match"}');
	}
});

// Login handle-er
app.post(
	'/login',
	passport.authenticate('local', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/');
	}
);

// Google login handle-er
app.get(
	'/auth/google',
	passport.authenticate('google', {
		scope: ['profile', 'email']
	})
);

// Google login callback handle-er
app.get(
	'/auth/google/callback',
	passport.authenticate('google'),
	(req, res) => {
		res.redirect('/');
	}
);

// logout handle-er
app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

app.get('/jsonaccounts', function(req, res) {
	var file = __dirname + '/data/accounts.json';
	res.download(file);
});

app.get('/jsonzombies', function(req, res) {
	var file = __dirname + '/data/zombies.json';
	res.download(file);
});

app.get('/jsonbodies', function(req, res) {
	var file = __dirname + '/data/bodies.json';
	res.download(file);
});

app.get('/jsonopponents', function(req, res) {
	var file = __dirname + '/data/opponents.json';
	res.download(file);
});

app.listen(PORT, () => {
	console.log('Server is up on the port 8080');
});
