const express = require('express');
const hbs = require('hbs');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userAccounts = require('./data/userAccounts');
const keys = require('./config/keys');
const PORT = process.env.PORT || 8080;

hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper('getCurrentYear', () => {
	return new Date().getFullYear();
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
	console.log(request.user);
	response.render('index.hbs', {
		title: 'Z-url',
		user: request.user
	});
});

app.get('/about', (request, response) => {
	response.render('about.hbs', {
		title: 'About'
	});
});

app.get('/register', (request, response) => {
	response.render('register.hbs', {
		title: 'Register'
	});
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

app.post('/login', passport.authenticate('local'), function(req, res) {
	res.redirect('/');
});

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
