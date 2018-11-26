var Unit = require('../unit');

// TODO: implement a more robust and interesting damage algorithm,
// taking into account Unit attributes.

/*
 * Calculates the damage and applies it to the target.
 * damage = actor's attack - target's defense. Minimum damage = 1
 * @param {Unit} actor
 * @param {Unit} target
 * @return {number} the damage amount
 */
var Attack = function(actor, target) {
   if (!actor || !(actor instanceof Unit)) {
      throw new Error(
         'The first argument must be instance of Unit as the actor'
      );
   }

   if (!target || !(target instanceof Unit)) {
      throw new Error(
         'The second argument must be instance of Unit as the target'
      );
   }

   var damage = Math.max(1, actor.attack - target.defense);

   target.health -= damage;

   this.result.log +=
      actor.name + ' attacks ' + target.name + ' for ' + damage + ' damage!\n';
   this.result.log +=
      target.name + ' has ' + target.health + ' remaining health.\n';
   console.info(
      actor.name + ' attacks ' + target.name + ' for ' + damage + ' damage!'
   );
   console.info(target.name + ' has ' + target.health + ' remaining health.');

   // TODO: send damage event [ReceiveDamage] or
   // target.onReceiveDamage( damage )

   return damage;
};

// This should be overridden
Attack.initialize = function() {};

module.exports = Attack;
