/**
 * @author Gilgamar
 * @version 1.06
 * @license MIT
 */

/*:
 * @plugindesc v1.06 Action Battle System
 * @author Gilgamar
 *
 * @param Animation Enemy Death
 * @desc ID for enemy death animation.
 * Default 117
 * @default 117
 *
 * @param Cleanup Delay
 * @desc Delay before clearing enemy corpse.
 * Default 300
 * @default 300
 *
 */

//=============================================================================
// Configure script
//=============================================================================
GIL.configure('ABS');

console.log(Imported);
console.log(GIL);

//-----------------------------------------------------------------------------
// ABS
//
// The Action Battle System.

function ABS() {
    this.initialize.apply(this, arguments);
}

ABS.log = console.log.bind(console);

//=============================================================================
// ABS
//=============================================================================
ABS._loot = {
    heart: {
        mapId: 1,
        eventId: 1,
        weight: 15,
    },
    gem: {
        mapId: 1,
        eventId: 2,
        weight: 5,
    },
    nothing: {
        mapId: 0,
        eventId: 0,
        weight: 15,
    }
};

//-----------------------------------------------------------------------------
// SIMPLE CODE
//
//=============================================================================
// ABS Button Events
//=============================================================================
ABS.buttonEvent = function(id) {
    if (id === 1) ABS.arrow();
    if (id === 2) ABS.fireball();
};

ABS.arrow = function() {
    var skillId = 11;
    var projectile = new Projectile({mapId: 1, eventId: 3, delay: 150});
    projectile.hit = function(event) {
        event.knockback(projectile.d);
        ABS.ranged.call(event, skillId);
    };
};
ABS.fireball = function() {
    var projectile = new Projectile({mapId: 1, eventId: 4, delay: 700});
};

//=============================================================================
// ABS Manager
//=============================================================================
ABS.ranged = function() {
    ABS.battle.apply(this, arguments);
};

ABS.battle = function() {
    try {
        ABS.attack.apply(this, arguments);
    } catch (e) {
        SceneManager.catchException(e);
        return false;
    }
};

ABS.attack = function(skillId) {
    if (!ABS.isValid.call(this)) return;

    ABS.engageEnemy();

    skillId = skillId || 1;

    ABS.actor.takeAction(skillId, ABS.enemy);
    if (skillId === 1) {
        ABS.actor.performAttack();
        // Check if enemy can counter
        ABS.enemy.takeAction(skillId, ABS.actor);
    }

    ABS.aftermath();
};

ABS.aftermath = function() {
    var a = ABS.actor;
    var b = ABS.enemy;
    ABS.log(a.hp, b.hp);
    // Actor died
    if (a.hp === 0) {
        ABS.log('actor died');
        ABS.shiftActors();
    }
    // Enemy died
    if (b.hp === 0) {
        ABS.victory();
        ABS.enemyDied();
        ABS.log('enemies left', ABS.enemiesLeft);
    }
};

ABS.enemyDied = function() {
    ABS.log('enemy died');
    ABS.enemy.requestAnimation(GIL.Param.ABS_AnimationEnemyDeath);
};

ABS.victory = function() {
    ABS.log('victory');
    ABS.gainRewards();
    setTimeout(ABS.cleanup.bind(this), GIL.Param.ABS_CleanupDelay);
};

ABS.cleanup = function() {
    ABS.gainLoot();
    // ABS.eraseEnemy();
};

ABS.gainRewards = function() {
    var exp   = ABS.enemy.exp();
    var gold  = ABS.enemy.gold() * ABS.goldRate;
    var items = ABS.enemy.items();

    ABS.actor.gainExp(exp);
    ABS.party.gainGold(gold);
    ABS.party.gainItems(items);
};

ABS.gainLoot = function() {
    var loot = ABS.pickLoot();
    ABS.log('found', loot);
    ABS.dropLoot(loot);
};




//-----------------------------------------------------------------------------
// ADVANCED CODE
//
//=============================================================================
// ABS Properties
//=============================================================================
Object.defineProperties(ABS, {
    actor:      { get: function() { return $gamePlayer; }},
    enemy:      { get: function() { return $gameMap.event(ABS._id); }},
    party:      { get: function() { return $gameParty; }},
    goldRate:   { get: function() { return $gameParty.hasGoldDouble() ? 2 : 1; }},
    enemiesLeft:{ get: function() { return $gameTroop.aliveMembers().length; }},
});

//=============================================================================
// ABS - Advanced Code
//=============================================================================
ABS._id = undefined;

ABS.isValid = function() {
    ABS._id = (this || {})._eventId;
    var actor = ABS.actor || {};
    var enemy = ABS.enemy || {};
    if (!ABS._id)         throw new Error('ABS could not find eventId');
    if (!enemy.battler()) throw new Error('ABS could not find enemy battler');
    if (actor.inMotion()) return false;     // Already attacking
    if (enemy.hp === 0) return false;       // Enemy already dead
    return !!ABS._id;
};

ABS.engageEnemy = function() {
    ABS.enemy._locked = false;            // Prevent enemy turning away while battle engaged
    ABS.enemy.turnTowardPlayer();
};

ABS.eraseEnemy = function() {
    $gameMap.eraseEvent(ABS.enemy._eventId);
};

ABS.takeAction = function(id, subject, target) {
    var action = new Game_Action(subject);
    action.setSkill(id);
    subject.useItem(action.item());
    action.applyGlobal();
    action.apply(target.battler());
    target.startDamagePopup();
    var animationId = action.item().animationId;
    if (animationId === -1) {
        animationId = subject.attackAnimation();
    }
    target.requestAnimation(animationId);
};

ABS.shiftActors = function() {
    var actors = ABS.party._actors;
    actors.push(actors.shift());
    ABS.actor.refresh();
};

ABS.pickLoot = function() {
    var loot = {};
    for (var key in ABS._loot) {
        loot[key] = ABS._loot[key].weight;
    }
    return (new Weighted_List(loot)).peek();
};

ABS.dropLoot = function(loot) {
    if (loot === 'nothing') return ABS.eraseEnemy();
    $gameMap.addEvent(
        ABS._loot[loot].mapId,
        ABS._loot[loot].eventId,
        ABS.enemy.x, ABS.enemy.y
    );
};

//=============================================================================
// Game_Character
//=============================================================================
Game_Character.prototype.takeAction = function(skillId, target) {
    var subject = this.battler();
    ABS.takeAction(skillId, subject, target);
};

//=============================================================================
// Scene_Map - From YEP_ButtonCommonEvents
//=============================================================================
Scene_Map.prototype.updateButtonEvents = function() {
    for (var key in Yanfly.Param.BCEList) {
        var id = Yanfly.Param.BCEList[key];
        if (id <= 0) continue;
        if (!Input.isRepeated(key)) continue;
        ABS.buttonEvent(id);
        break;
    }
};
