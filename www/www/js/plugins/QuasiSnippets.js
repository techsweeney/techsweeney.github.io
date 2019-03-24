//============================================================================
// Quasi Snippets
// Version: 1.0.0
// Last Update: October 23, 2015
//============================================================================

var Imported = Imported || {};
Imported.Quasi_Snippets = 1.0;

//=============================================================================
 /*:
 * @plugindesc Some quick changes to MV.
 * @author Quasi
 *
 * @param Quick Test
 * @desc Enable quick testing.
 * Set to true or false
 * @default true
 *
 * @param Demo Text
 * @desc Turns switch 1 on or off on new game with Quick Test
 * Set to true or false
 * @default true
  */
 //=============================================================================

(function() {
  var Quasi = {};
  Quasi.param      = PluginManager.parameters('QuasiSnippets');
  Quasi.quickStart = (Quasi.param['Quick Test'].toLowerCase() == 'true');
  Quasi.demoText   = (Quasi.param['Demo Text'].toLowerCase() == 'true');

  var Alias_Scene_Boot_start = Scene_Boot.prototype.start;
  Scene_Boot.prototype.start = function() {
    if (DataManager.isBattleTest() || DataManager.isEventTest()) {
      Alias_Scene_Boot_start.call(this);
    } else if (Quasi.quickStart) {
      Scene_Base.prototype.start.call(this);
      SoundManager.preloadImportantSounds();
      this.checkPlayerLocation();
      DataManager.setupNewGame();
      SceneManager.goto(Scene_Map);
      $gameSwitches.setValue(1, Quasi.demoText);
      this.updateDocumentTitle();
    } else {
      Alias_Scene_Boot_start.call(this);
    }
  };
})();
