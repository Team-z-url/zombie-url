const fs = require('fs');
const crypto = require('crypto');
const generateName = require('sillyname');
const filePath = './data/zombies.json';

// Replaces the user zombie with a URL zombie
const replaceZombieForUserWithBody = (userId, body) => {
	let id = crypto.randomBytes(16).toString('hex');
	let zombie = {
		id: id,
		userId: userId,
		name: body.name,
		health: body.health,
		attack: body.attack,
		defense: body.defense,
		speed: body.speed,
		since: body.since
	};
	deleteZombieForUser(userId);
	let allZombies = getAllZombies();
	allZombies.push(zombie);
	saveJson(filePath, allZombies);
};

// deletes the user's zombie
const deleteZombieForUser = userId => {
	let allZombies = getAllZombies();
	for (let i = 0; i < allZombies.length; i++) {
		if (allZombies[i].userId === userId) {
			allZombies.splice(i, 1);
		}
	}
	saveJson(filePath, allZombies);
};

const addZombieForUser = userId => {
	let id = crypto.randomBytes(16).toString('hex');
	let date = new Date();
	let zombie = {
		id: id,
		userId: userId,
		name: generateName(),
		health: Math.round(Math.random() * 100 + 50),
		attack: Math.round(Math.random() * 50 + 80),
		defense: Math.round(Math.random() * 75 + 25),
		speed: Math.round(Math.random() * 10 + 5),
		since: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
	};
	let allZombies = getAllZombies();
	allZombies.push(zombie);
	saveJson(filePath, allZombies);
	return zombie;
};

const getZombieById = id => {
	let allZombies = getAllZombies();
	for (let i = 0; i < allZombies.length; i++) {
		if (allZombies[i].id === id) {
			return allZombies[i];
		}
	}
	return false;
};

const getZombieByUserId = userId => {
	let allZombies = getAllZombies();
	for (let i = 0; i < allZombies.length; i++) {
		if (allZombies[i].userId === userId) {
			return allZombies[i];
		}
	}
	return addZombieForUser(userId);
};

const getAllZombies = () => {
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
	replaceZombieForUserWithBody,
	deleteZombieForUser,
	getZombieById,
	addZombieForUser,
	getZombieByUserId,
	getAllZombies
};
