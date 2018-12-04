const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const filePath = './data/accounts.json';

// Creates a local user object
const addLocalUser = (username, password) => {
	let id = crypto.randomBytes(16).toString('hex');
	let hash = bcrypt.hashSync(password, 10);
	let userObj = {
		id: id,
		username: username,
		hashedPassword: hash
	};
	if (!getUserByUsername(username)) {
		let allUsers = getAllUsers();
		allUsers.push(userObj);
		saveJson(filePath, allUsers);
		return userObj;
	} else {
		console.log(getUserByUsername(username));
		return false;
	}
};

// Creates a Google user object
const addGoogleUser = (googleId, displayName) => {
	let id = crypto.randomBytes(16).toString('hex');
	let userObj = {
		id: id,
		displayName: displayName,
		googleId: googleId
	};
	if (!getUserByGoogleId(googleId)) {
		let allUsers = getAllUsers();
		allUsers.push(userObj);
		saveJson(filePath, allUsers);
		return userObj;
	} else {
		return false;
	}
};

const checkPassword = (username, password) => {
	let foundUser = getUserByUsername(username);
	if (!foundUser) {
		return false;
	}
	if (bcrypt.compareSync(password, foundUser.hashedPassword)) {
		return true;
	}
	return false;
};

const getUserByUsername = username => {
	let allUsers = getAllUsers();
	for (let i = 0; i < allUsers.length; i++) {
		if (allUsers[i].username === username) {
			return allUsers[i];
		}
	}
	return false;
};

const getUserByGoogleId = googleId => {
	let allUsers = getAllUsers();
	for (let i = 0; i < allUsers.length; i++) {
		if (allUsers[i].googleId === googleId) {
			return allUsers[i];
		}
	}
	return false;
};

const getUserById = id => {
	let allUsers = getAllUsers();
	for (let i = 0; i < allUsers.length; i++) {
		if (allUsers[i].id === id) {
			return allUsers[i];
		}
	}
	return false;
};

const getAllUsers = () => {
	return readJson(filePath);
};

const readJson = path => {
	if (fs.existsSync(path)) {
		resultString = fs.readFileSync(path);
		resultObject = JSON.parse(resultString);
		return resultObject;
	} else {
		return new Array();
	}
};

const saveJson = (path, object) => {
	fs.writeFileSync(path, JSON.stringify(object));
};

module.exports = {
	addLocalUser,
	checkPassword,
	getUserByUsername,
	getUserById,
	getUserByGoogleId,
	addGoogleUser,
	getAllUsers
};
