const fs = require('fs');
const crypto = require('crypto');
const faker = require('faker');
const filePath = './data/opponents.json';

// Adds caplitalization to the first letter of a name
function titleCase(str) {
	var splitStr = str.toLowerCase().split(' ');
	for (var i = 0; i < splitStr.length; i++) {
		// You do not need to check if i is larger than splitStr length, as your for does that for you
		// Assign it back to the array
		splitStr[i] =
			splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
	}
	// Directly return the joined string
	return splitStr.join(' ');
}


const addOpponentsForUser = userId => {
	let id = crypto.randomBytes(16).toString('hex');
	let date = new Date();
	let human = () => {
		result = {
			name: faker.name.findName(),
			health: Math.round(Math.random() * 100 + 50),
			attack: Math.round(Math.random() * 50 + 80),
			defense: Math.round(Math.random() * 75 + 25),
			speed: Math.round(Math.random() * 10 + 5),
			special: Math.random() < 0.03 ? true : false
		};
		if (result.special) {
			result.name += ' *';
		}
		return result;
	};

	let humans = [human(), human(), human()];
	humans.sort((a, b) => {
		let asum = a.health + a.attack + a.defense + a.speed;
		let bsum = b.health + b.attack + b.defense + b.speed;
		return asum > bsum ? 1 : 0;
	});

	let opponents = {
		id: id,
		userId: userId,
		humans: humans,
		since: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
	};
	let allOpponents = getAllOpponents();
	allOpponents.push(opponents);
	saveJson(filePath, allOpponents);
	return opponents;
};

// After a victory, deletes all opponents
const deleteOpponentsForUser = userId => {
	let allOpponents = getAllOpponents();
	for (let i = 0; i < allOpponents.length; i++) {
		if (allOpponents[i].userId === userId) {
			allOpponents.splice(i, 1);
		}
	}
	saveJson(filePath, allOpponents);
};

const getOpponentsByUserId = userId => {
	let allOpponents = getAllOpponents();
	for (let i = 0; i < allOpponents.length; i++) {
		if (allOpponents[i].userId === userId) {
			return allOpponents[i];
		}
	}
	return addOpponentsForUser(userId);
};

const getAllOpponents = () => {
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
	getOpponentsByUserId,
	addOpponentsForUser,
	getAllOpponents,
	deleteOpponentsForUser
};
