//============================================================================
// Quasi ABS Hud A
// Version: 1.00
// Last Update: December 22, 2015
//============================================================================
// ** Terms of Use
// http://quasixi.com/mv/
// https://github.com/quasixi/RPG-Maker-MV/blob/master/README.md
//============================================================================
// How to install:
//  - Save this file as "QuasiABSHudB.js" in your js/plugins/ folder
//  - Add plugin through the plugin manager
//  - - Place somewhere below QuasiABS
//  - Configure as needed
//  - Open the Help menu for setup guide or visit one of the following:
//  - - http://quasixi.com/mv/abs/
//  - - http://forums.rpgmakerweb.com/ -- abs link
//============================================================================

var Imported = Imported || {};
Imported.Quasi_ABSHudB = 1.00;

//=============================================================================
 /*:
 * @plugindesc Adds a hud for Quasi ABS ( Version B )
 * @author Quasi      Site: http://quasixi.com
 *
 * @help
 * =============================================================================
 * ** About
 * =============================================================================
 *   This version B of a skill toolbar hud. This version is designed for a more
 * full touch input game, like mobile games. Version A is targeted for desktop
 * use. Version B is targeted for touch input.
 * =============================================================================
 * Links
 *  - http://quasixi.com/mv/abs/
 *  - https://github.com/quasixi/RPG-Maker-MV
 *  - http://forums.rpgmakerweb.com/ -- abs link
 */
//=============================================================================

//-----------------------------------------------------------------------------
// Dependencies

if (!Imported.Quasi_ABS) {
  //alert("Error: Quasi ABS Hud B requires Quasi ABS to work.");
  //throw new Error("Error: Quasi ABS Hud B requires Quasi ABS to work.")
}

//-----------------------------------------------------------------------------
// New Classes

function Sprite_ABSKeys() {
  this.initialize.apply(this, arguments);
}

//-----------------------------------------------------------------------------
// Quasi ABS Hud A

(function() {

  //-----------------------------------------------------------------------------
  // Game_Player
  //
  // The game object class for the player. It contains event starting
  // determinants and map scrolling functions.

  var Alias_Game_Player_canClick = Game_Player.prototype.canClick;
  Game_Player.prototype.canClick = function() {
    return Alias_Game_Player_canClick.call(this) && !this._overABSKeys;
  };

  //-----------------------------------------------------------------------------
  // Sprite_Button
  //
  // The sprite for displaying a button.

  var Alias_Sprite_Button_initialize = Sprite_Button.prototype.initialize;
  Sprite_Button.prototype.initialize = function() {
      Alias_Sprite_Button_initialize.call(this);
      this._pressing = false;
      this._pressHandler = null;
  };

  Sprite_Button.prototype.setPressHandler = function(method) {
      this._pressHandler = method;
  };

  Sprite_Button.prototype.callPressHandler = function() {
    if (this._pressHandler) this._pressHandler();
  };

  var Alias_Sprite_Button_update = Sprite_Button.prototype.update;
  Sprite_Button.prototype.update = function() {
    Alias_Sprite_Button_update.call(this);
    this.processPress();
  };

  Sprite_Button.prototype.processPress = function() {
    if (this.isActive()) {
      if (TouchInput.isPressed() && this.isButtonTouched()) {
        this._pressing = true;
        this.callPressHandler();
      }
    } else {
      this._pressing = false;
    }
  };

  //-----------------------------------------------------------------------------
  // Sprite_ABSKeys
  //
  // A Sprite container for displaying skill keys

  Sprite_ABSKeys.prototype = Object.create(Sprite_Base.prototype);
  Sprite_ABSKeys.prototype.constructor = Sprite_ABSKeys;

  Sprite_ABSKeys.prototype.initialize = function() {
    Sprite_Base.prototype.initialize.call(this);
    this._buttons = [];
    this._over = 0;
    this._lastPressed = 0;
    this._frameDelta = 1;
    this.createKeys();
  };

  Sprite_ABSKeys.prototype.createKeys = function() {
    this.createDirectionCircle();
    return;
    for (var input in QuasiABS.skillKey) {
      if (!QuasiABS.skillKey.hasOwnProperty(input)) continue;
      this.createSkill(QuasiABS.skillKey[input].skillId, input);
    }
  };

  Sprite_ABSKeys.prototype.createDirectionCircle = function() {
    var button = new Sprite_Button();
    // Main circle, radius of 100
    button._frame = this.createButtonFrame(100);
    button.addChild(button._frame);
    button.y = Graphics.height - 200;
    // The inner circle that moves
    button._inner = new Sprite();
    // Should replace next lines with an image instead of a bitmap
    button._inner.bitmap = new Bitmap(50, 50);
    button._inner.bitmap.drawCircle(25, 25, 25, "#ffffff");
    // Sets (0, 0) to center of circle
    // 75 is ( half radius of big circle + radius of inner circle )
    button._inner.alpha = 0;
    button.addChild(button._inner);
    button.setPressHandler(this.onButtonDown1.bind(this));
    this._direction = button;
    this.addChild(button);
  };

  Sprite_ABSKeys.prototype.createSkill = function(skillId, input) {
    var button = new Sprite_Button();
    // Black box under icon
    button._frame = this.createButtonFrame(20);
    button.addChild(button._frame);
    // Skill Icon
    button._icon = this.createButtonIcon(skillId);
    //button.addChild(button._icon);
    // Black box over icon, size changes based off cooldown
    button._cooldown = this.createButtonFrame(20);
    button._cooldown.alpha = 0.5;
    button._cooldown.height = 0;
    //button.addChild(button._cooldown);
    // Hover frame
    button._hover = this.createButtonHover();
    button._hover.alpha = 0;
    //button.addChild(button._hover);
    var x = 36 * this._buttons.length;
    button.x = x;
    button._skillId = skillId;
    button.setClickHandler(this.onButtonDown2.bind(this, skillId));
    this._buttons.push(button);
    this.addChild(button);
  };

  Sprite_ABSKeys.prototype.createButtonFrame = function(radius) {
    var frame = new Sprite();
    frame.bitmap = new Bitmap(2 *radius, 2 * radius);
    frame.bitmap.drawCircle(radius, radius, radius, "rgba(0, 0, 0, 0.3)");
    return frame;
  };

  Sprite_ABSKeys.prototype.createButtonIcon = function(skillId) {
    var icon = new Sprite();
    icon.bitmap = ImageManager.loadSystem("IconSet");
    var skill = $dataSkills[skillId];
    var iconIndex = skill ? skill.iconIndex : 0;
    var pw = 32;
    var ph = 32;
    var sx = iconIndex % 16 * pw;
    var sy = Math.floor(iconIndex / 16) * ph;
    icon.setFrame(sx, sy, pw, ph);
    icon.x = 1;
    icon.y = 1;
    return icon;
  };

  Sprite_ABSKeys.prototype.createButtonHover = function() {
    var frame = new Sprite();
    frame.bitmap = new Bitmap(34, 34);
    var color1 = "rgba(255, 255, 255, 0.9)";
    var color2 = "rgba(255, 255, 255, 0)";
    frame.bitmap.gradientFillRect(0, 0, 8, 34, color1, color2);
    frame.bitmap.gradientFillRect(26, 0, 8, 34, color2, color1);
    frame.bitmap.gradientFillRect(0, 0, 34, 8, color1, color2, true);
    frame.bitmap.gradientFillRect(0, 26, 34, 8, color2, color1, true);
    return frame;
  };

  Sprite_ABSKeys.prototype.onButtonDown1 = function() {
    var time = Graphics.frameCount;
    if (time - this._lastPressed < this._frameDelta) return;
    this._lastPressed = time;
    // Moves mouse position inside the circle
    var x1 = Math.abs(TouchInput.x - this._direction.x);
    var y1 = Math.abs(TouchInput.y - this._direction.y);
    // Center of circle ( radius )
    var x2 = 100;
    var y2 = 100;
    // Find the angle
    var radian = Math.atan2(y2 - y1, x1 - x2);
    // atan2 has a period from -PI to PI
    // so we shift to keep it in 0 to 2PI
    if (radian < 0) radian += Math.PI * 2;
    // Find position for inner circle bitmap
    // If you want to keep inner circle near edge:
    //var x3 = 75 + 75 * Math.cos(radian); // centerX + delta radius * cos(radian)
    //var y3 = 75 + 75 * -Math.sin(radian); // centerY + delta radius * -sin(radian) ( negative sin because Y Axis is flipped )
    // But I think moving it to where you touched looked nicer:
    this._direction._inner.move(x1 - 25, y1 - 25); // both cords minus radius so it centers on the click
    this._direction._inner.alpha = 0.9;
    var moveDirection = this.radianToDirection(radian);
    if ([2, 4, 6, 8].contains(moveDirection)){
      $gamePlayer.moveStraight(moveDirection);
    } else if ([1, 3, 7, 9].contains(moveDirection)){
      var diag = {1: [4, 2], 3: [6, 2], 7: [4, 8], 9: [6, 8]};
      $gamePlayer.moveDiagonally(diag[moveDirection][0], diag[moveDirection][1]);
    }
  };

  Sprite_ABSKeys.prototype.radianToDirection = function(radian) {
    if (QuasiMovement.diagonal) {
      if (radian >= Math.PI / 6 && radian < Math.PI / 3) {
        return 9;
      } else if (radian >= 2 * Math.PI / 3 && radian < 5 * Math.PI / 6) {
        return 7;
      } else if (radian >= 7 * Math.PI / 6 && radian < 4 * Math.PI / 3) {
        return 1;
      } else if (radian >= 5 * Math.PI / 3 && radian < 11 * Math.PI / 6) {
        return 3;
      }
    }
    if (radian >= 0 && radian < Math.PI / 4) {
      return 6;
    } else if (radian >= Math.PI / 4 && radian < 3 * Math.PI / 4) {
      return 8;
    } else if (radian >= 3 * Math.PI / 4 && radian < 5 * Math.PI / 4) {
      return 4;
    } else if (radian >= 5 * Math.PI / 4 && radian < 7 * Math.PI / 4) {
      return 2;
    } else if (radian >= 7 * Math.PI / 4) {
      return 6;
    }
  };

  Sprite_ABSKeys.prototype.onButtonDown2 = function(skillId) {
    $gamePlayer.useSkill(skillId);
  };

  Sprite_ABSKeys.prototype.onButtonHover = function(button) {

  };

  Sprite_ABSKeys.prototype.update = function() {
    Sprite_Base.prototype.update.call(this);
    this._over = 0;
    this.updateDirection();
    //for (var i = 0; i < this._buttons.length; i++) {
      //this.updateButton(this._buttons[i]);
    //}
    $gamePlayer._overABSKeys = this._over > 0;
  };

  Sprite_ABSKeys.prototype.updateDirection = function() {
    if (this._direction.isButtonTouched()) {
      this._over++;
    }
    if (this._direction._inner.alpha > 0) {
      this._direction._inner.alpha = Math.max(this._direction._inner.alpha - 0.05, 0);
    }
  };

  Sprite_ABSKeys.prototype.updateButton = function(button) {
    if (button.isButtonTouched()) {
      this.onButtonHover(button);
      button._count++;
      this._over++;
    } else {
      button._count = 0;
      button._hover.alpha = 0;
      button._info.alpha = 0;
    }
    var skillId = button._skillId;
    if (skillId === 0) return;
    var cd = $gamePlayer._skillCooldowns[skillId];
    if (cd) {
      var settings = QuasiABS.getSkillSettings($dataSkills[skillId]);
      var newH = cd / settings.cooldown;
      button._cooldown.height = 34 * newH;
    } else {
      button._cooldown.height = 0;
    }
  };

  //-----------------------------------------------------------------------------
  // Scene_Map
  //
  // The scene class of the map screen.

  var Alias_Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function() {
    Alias_Scene_Map_createAllWindows.call(this);
    this.createABSKeys();
  };

  Scene_Map.prototype.createABSKeys = function() {
    this._absKeys = new Sprite_ABSKeys();
    this.addChild(this._absKeys);
  };
})();
