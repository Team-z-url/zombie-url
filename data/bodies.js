const fs = require('fs');
const crypto = require('crypto');
const filePath = './data/bodies.json';

function shuffle(a) {
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// Creates a body object
const generateBody = async (zombie, human) => {
	let id = crypto.randomBytes(16).toString('hex');
	let date = new Date();
	let randomArray = [0.1, 0.1, 0.1, 0.5];
	shuffle(randomArray);
	console.log(randomArray);
	let body = {
		id: id,
		userId: zombie.userId,
		name: human.name,
		health: human.health + Math.floor(zombie.health * randomArray[0]),
		attack: human.attack + Math.floor(zombie.health * randomArray[1]),
		defense: human.defense + Math.floor(zombie.health * randomArray[2]),
		speed: human.speed + Math.floor(zombie.health * randomArray[3]),
		special: human.special,
		since: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
	};

	let collectionIndex = getBodyCollectionIndexByUserId(zombie.userId);
	if (!collectionIndex) {
		await addEmptyCollectionForUserId(zombie.userId);
		collectionIndex = await getBodyCollectionIndexByUserId(zombie.userId);
	}

	let allBodyCollections = getAllBodyCollections();
	if (allBodyCollections[collectionIndex].bodies.length >= 5) {
		allBodyCollections[collectionIndex].bodies.shift();
	}
	allBodyCollections[collectionIndex].bodies.push(body);
	saveJson(filePath, allBodyCollections);
	return body;
};
///

///

// Deletes a body when claimed
const deleteBodyById = bodyId => {
	let allBodyCollections = getAllBodyCollections();
	for (let i = 0; i < allBodyCollections.length; i++) {
		for (let ii = 0; ii < allBodyCollections[i].bodies.length; ii++) {
			if (allBodyCollections[i].bodies[ii].id === bodyId) {
				allBodyCollections[i].bodies.splice(ii, 1);
			}
		}
	}
	saveJson(filePath, allBodyCollections);
};

// Body object getter
const getBodyById = id => {
	let allBodyCollections = getAllBodyCollections();
	for (let i = 0; i < allBodyCollections.length; i++) {
		for (let ii = 0; ii < allBodyCollections[i].bodies.length; ii++) {
			if (allBodyCollections[i].bodies[ii].id === id) {
				return allBodyCollections[i].bodies[ii];
			}
		}
	}
	return false;
};

//
const getBodyCollectionIndexByUserId = userId => {
	let allBodyCollections = getAllBodyCollections();
	for (let i = 0; i < allBodyCollections.length; i++) {
		if (allBodyCollections[i].userId === userId) {
			return i;
		}
	}
	return false;
};

// Returns the body information after clicking on the Bodies link
const getBodyCollectionByUserId = userId => {
	let allBodyCollections = getAllBodyCollections();
	for (let i = 0; i < allBodyCollections.length; i++) {
		if (allBodyCollections[i].userId === userId) {
			return allBodyCollections[i];
		}
	}
	addEmptyCollectionForUserId(userId);
	return getBodyCollectionByUserId(userId);
};

// Add empty list to user if the user doesn't have a record
const addEmptyCollectionForUserId = userId => {
	let allBodyCollections = getAllBodyCollections();
	allBodyCollections.push({
		userId: userId,
		bodies: []
	});
	saveJson(filePath, allBodyCollections);
};

// Getter for all the bodies
const getAllBodyCollections = () => {
	return readJson(filePath);
};

// Reads the Json file
const readJson = path => {
	if (fs.existsSync(path)) {
		resultString = fs.readFileSync(path);
		resultObject = JSON.parse(resultString);
		return resultObject;
	} else {
		return new Array();
	}
};

// Saves the Json file
const saveJson = (path, object) => {
	fs.writeFileSync(path, JSON.stringify(object));
};

module.exports = {
	generateBody,
	getBodyById,
	getBodyCollectionIndexByUserId,
	getBodyCollectionByUserId,
	getAllBodyCollections,
	deleteBodyById
};
