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
	process.env.NODE_ENV === 'production'
		? 'zombie-url/body/'
		: 'localhost:8080/body/';

hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper('getCurrentYear', () => {
	return new Date().getFullYear();
});

hbs.registerHelper('urlBody', bodyId => {
	return rootUrl + bodyId;
});

hbs.registerHelper('breaklines', function(text) {
	text = hbs.Utils.escapeExpression(text);
	text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
	return new hbs.SafeString(text);
});

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

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	foundUser = userAccounts.getUserById(id);
	done(null, foundUser);
});

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
	session({
		secret: keys.cookieKey,
		resave: true,
		saveUninitialized: false
	})
);

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));

app.use(morgan('dev'));

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
		}
		res.render('result.hbs', {
			log: result.log,
			url: url
		});
	} else {
		res.redirect('/');
	}
});

app.get('/bodies', (req, res) => {
	if (req.user) {
		let user = req.user;
		let bodyCollection = bodies.getBodyCollectionByUserId(user.id);
		res.render('bodies.hbs', { bodies: bodyCollection.bodies });
	} else {
		res.redirect('/');
	}
});

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

app.post(
	'/login',
	passport.authenticate('local', { failureRedirect: '/' }),
	function(req, res) {
		res.redirect('/');
	}
);

app.get(
	'/auth/google',
	passport.authenticate('google', {
		scope: ['profile', 'email']
	})
);

app.get(
	'/auth/google/callback',
	passport.authenticate('google'),
	(req, res) => {
		res.redirect('/');
	}
);

app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

app.listen(PORT, () => {
	console.log('Server is up on the port 8080');
});
