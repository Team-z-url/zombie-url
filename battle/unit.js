var Unit = (module.exports = function(parameters) {
   if (!parameters) {
      throw new Error('Unit must be instantiated with some parameters');
   }
   if (!parameters.name) {
      throw new Error('Unit must have a name');
   }

   this.name = parameters.name;
   this.health = parameters.health || 0;
   this.attack = parameters.attack || 0;
   this.defense = parameters.defense || 0;
   this.speed = parameters.speed || 0;
   this.special = parameters.special || false;
   this.abilities = parameters.abilities || [];
   this.effects = [];
});
