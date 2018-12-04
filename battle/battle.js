const Unit = require('./unit');
const Attack = require('./actions/attack');

// Definition of the battle class
const Battle = function() {
	this.end = false;
	this.startedTime = null;
	this.lastUpdateTime = 0;
	this.timer = null;
	this.actionQueue = [];
	this.ally = null;
	this.foe = null;
	this.result = {
		winner: false,
		log: ''
	};
};

Battle.prototype = {
	initialize: function(data) {
		this.createAlly.bind(this)(data.ally);
		this.createFoe.bind(this)(data.foe);
	},
	createAlly: function(data) {
		this.ally = new Unit(data);
	},
	createFoe: function(data) {
		this.foe = new Unit(data);
	},
	pushAttack: function(unit, target) {
		// Pushing and attack object
		action = {
			type: 'attack',
			perform: Attack,
			speed: unit.speed,
			actor: unit,
			args: [unit, target]
		};
		this.actionQueue.push(action);
	},
	turnStart: function() {
		// Decides who goes first in a battle
		this.pushAttack(this.ally, this.foe);
		this.pushAttack(this.foe, this.ally);
		this.actionQueue.sort((a, b) => {
			return b.speed - a.speed;
		});
	},
	start: function() {
		// Every milisecond it updates the battle and returns battle results when finished
		return new Promise((resolve, reject) => {
			this.startedTime = this.lastUpdateTime = new Date().getTime();
			let scope = this;
			// console.log(scope);
			this.timer = setInterval(function() {
				let now = new Date().getTime();
				let deltaTime = now - scope.lastUpdateTime;
				this.lastUpdateTime = now;
				scope.update.call(scope, deltaTime);

				if (scope.end) {
					// console.log(scope);
					clearTimeout(scope.timer);
					resolve(scope.result);
				}
			}, 1);
		});
	},
	update: function(elapsed) {
		let action, dead;
		// console.log(this.actionQueue);
		// console.log(' [update] ', elapsed);

		if (this.actionQueue.length > 0) {
			action = this.actionQueue.shift();

			if (action.actor !== null && action.actor !== undefined) {
				action.perform.apply(this, action.args);
			}

			if (action.type === 'attack' && action.args[1].health <= 0) {
				dead = action.args[1];

				console.log(dead.name + ' dies!');
				this.result.log += dead.name + ' dies!\n';

				if (this.ally.name === dead.name) {
					this.ally = null;
				} else {
					this.foe = null;
				}
			}
		} else {
			this.turnStart();
		}

		if (this.ally === null) {
			console.log('!~You died~!');
			this.result.log += '!~You died~!\n';
			this.end = true;
		}

		if (this.foe === null) {
			console.log('!~You won~!');
			this.result.winner = true;
			this.result.log += '!~You won the battle~!\n';
			this.end = true;
		}
	}
};

module.exports = Battle;
