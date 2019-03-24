/*:
 * @plugindesc Version: 1.00 | Core plugin for casino games!
 * @author William Ramsey (TheUnproPro)
 *
 * @param Chip Cost
 * @desc How much Gold does it cost per chip?
 * @default 1
 *
 * @param Max Chips
 * @desc What's the max number of Chips you can have?
 * @default 9999
 *
 * @param Chip Name
 * @desc What are Chips called in your game?
 * @default Chips
 *
 * @param Gold Icon
 * @desc What icon is the gold icon?
 * @default 314
 *
 * @param Mobile Mode
 * @desc Use when exporting for touch screen devices.
 * @default false
 *
 * @param Block Color
 * @desc Color of the dark area drawn behind the text.
 * @default 0, 0, 0, 0.5
 *
 * @help
 * upp_casinoCore is required for all of the casino games. This is basically
 * this shop, as well as data management.
 *
 * There are a few plugin commands you can use.
 *
 * 1) - upp_setCasinoFace name id - where name is the face name (Example:
 *                                  People4) and id is the index.
 *
 * 2) - upp_setCasinoMsg msg - You can use the same text codes when displaying
 *                             a normal message. You can also use \cn to display
 *                             the name of the casino currency.
 *
 * 3) - upp_earnChips number - where number is how many you gain. Use -
 *                             before the number to subtract. Example: -50
 *
 * 4) - upp_openCasinoShop - This opens the casino shop.
 * 
*/

(function() {
	var empty={};
	var upp_miniMapCmds = Game_Interpreter.prototype.pluginCommand
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		upp_miniMapCmds.apply(this, arguments);
		
		if(command=="upp_openCasinoShop") {
			SceneManager.push(Scene_ChipShop);
		}
		
		if(command=="upp_setCasinoFace") {
			upp_data().casinoFace = args[0];
			upp_data().casinoFaceIndex = Number(args[1]);
		}
		
		if(command=="upp_earnChips") {
			upp_data().chips += Number(args[0]);
			if(upp_data().chips>maxChips) {
				upp_data().chips = maxChips;
			}
		}
		
		if(command=="upp_setCasinoMsg") {
			var str="";
			for(var i=0;i<args.length;i++) {
				str += args[i];
				if(i<args.length-1) {
					str += " ";
				}
			}
			str = str.replace(/\\cn/g, chipName);
			upp_data().casinoMsg = str.replace(/\\n/g, "\n");
		}
	}
	
	var params = PluginManager.parameters("upp_casinoCore");
	var chipName = params['Chip Name'];
	var chipCost = Number(params['Chip Cost']);
	var goldIcon = Number(params['Gold Icon']);
	var mobileMode = (params['Mobile Mode'] == "true" || params['Mobile Mode'] == "false") ? eval(params['Mobile Mode']) : false;
	var blockColor = "rgba("+params['Block Color']+")";
	
	var maxChips = Number(params['Max Chips']);

	function _upp_data() {
		this.extractAlias = function(fun) {
			var dmex = DataManager.extractSaveContents;
			DataManager.extractSaveContents = function(contents) {
				dmex.apply(this, arguments);
				$gameSystem.upp_data = {};
				fun.apply(this, arguments);
			}
		}
	}
	
	var upp_data = function() {
		if($gameSystem) {
			return $gameSystem.upp_data;
		} else { return empty }
	}
	
	var chips = function() {
		return $gameSystem.upp_data;
	}
	
	var gameSystemAlias = Game_System.prototype.initialize;
	Game_System.prototype.initialize = function() {
		gameSystemAlias.call(this);
		this.upp_data = this.upp_data || new _upp_data();
		this.upp_data.mobileMode = mobileMode;
		this.upp_data.casinoFace = "";
		this.upp_data.casinoMsg = "";
		this.upp_data.casinoFaceIndex = 0;
		this.upp_data.chipName = chipName;
		this.upp_data.chips=0;
	}
	
	var dmex = DataManager.extractSaveContents;
	DataManager.extractSaveContents = function(contents) {
		dmex.apply(this, arguments);
		$gameSystem.upp_data = $gameSystem.upp_data || new _upp_data();
	}
	

	
	Window_ChipShop = function() {
		this.initialize.apply(this, arguments);
	}
	
	Window_ChipShop.prototype = Object.create(Window_Base.prototype);
	Window_ChipShop.prototype.constructor = Window_ChipShop;
	
	Window_ChipShop.prototype.initialize = function(width, height) {
		Window_Base.prototype.initialize.call(this, 0, 0, width, height);
		this.chipCount=0;
		this.cos=0;
		this.refresh();
	}
	
	Window_ChipShop.prototype.refresh = function() {
		this.contents.clear();
		this.contents.fillRect(0, 0, this.contents.width, this.contents.height, blockColor);
		this.contents.drawText("How many "+chipName+" would you like to buy?", 0, 0, this.contents.width, this.lineHeight());
		this.contents.drawText("x"+this.chipCount, this.contents.fontSize/2, this.lineHeight(), 50, this.lineHeight(), 'center');
		this.contents.drawText(this.chipCount*chipCost, -32-this.padding/2, this.lineHeight(), this.contents.width, this.lineHeight(), 'right');
		this.drawIcon(goldIcon, this.contents.width-32, this.lineHeight());
		
		this.contents.drawText("<", -Math.cos(this.cos), this.lineHeight(), 50, this.lineHeight());
		this.contents.drawText(">", 50+this.contents.fontSize/2+Math.cos(this.cos), this.lineHeight(), 50, this.lineHeight());
	}
	
	Window_ChipShop.prototype.update = function() {
		this.cos+=0.1;
		if(Input.isRepeated("right") && $gameParty.gold()>this.chipCount*chipCost) {
			this.chipCount+=1;
			SoundManager.playCursor();
		}
		
		if(Input.isRepeated("pagedown") && $gameParty.gold()>this.chipCount*chipCost) {
			this.chipCount+=10;
			SoundManager.playCursor();
		}
		
		if(Input.isRepeated("left") && this.chipCount>0) {
			this.chipCount-=1;
			SoundManager.playCursor();
		}
		
		if(Input.isRepeated("pageup") && this.chipCount>0) {
			this.chipCount-=10;
			SoundManager.playCursor();
		}
		
		this.chipCount = Math.min(Math.max(this.chipCount, 0), $gameParty.gold()/chipCost);
		this.refresh();
		
		console.log();
	}
	
				
	Chip_Window = function() {
		this.initialize.apply(this, arguments);
	}
	
	Chip_Window.prototype = Object.create(Window_Base.prototype);
	Chip_Window.prototype.constructor = Chip_Window;
	
	Chip_Window.prototype.initialize = function() {
		Window_Base.prototype.initialize.call(this, 0, 0, 240, 256);
		this.refresh();
	}
	
	Chip_Window.prototype.refresh = function() {
		this.contents.clear();
		this.changeTextColor(this.systemColor());
		this.contents.drawText(chipName, 0, 0, this.contents.width, this.lineHeight());
		this.changeTextColor(this.normalColor());
		this.contents.drawText(upp_data().chips, 0, 0, this.contents.width, this .lineHeight(), 'right');
	}
	
	Chip_Window.prototype.update = function() {
		this.refresh();
	}
	
	Window_ChipMsg = function() {
		this.initialize.apply(this, arguments);
	}
	
	Window_ChipMsg.prototype = Object.create(Window_Base.prototype);
	Window_ChipMsg.prototype.constructor = Window_ChipMsg;
	
	Window_ChipMsg.prototype.initialize = function(height) {
		Window_Base.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, height);
		this.refresh();
	}
	
	Window_ChipMsg.prototype.refresh = function() {
		this.contents.clear();
		this.drawFace(upp_data().casinoFace, upp_data().casinoFaceIndex, 0, 0, 144, 144);
		this.drawTextEx(upp_data().casinoMsg, 144, 0);
	}
	
	Window_ChipMsg.prototype.update = function() {
		this.refresh();
	}
	
	
	function Window_CasinoChoice() {
    this.initialize.apply(this, arguments);
	}

	Window_CasinoChoice.prototype = Object.create(Window_Command.prototype);
	Window_CasinoChoice.prototype.constructor = Window_CasinoChoice;

	Window_CasinoChoice.prototype.initialize = function(x, y) {
		Window_Command.prototype.initialize.call(this, x, y);
	}
	
	Window_CasinoChoice.prototype.windowWidth = function() {
		return Graphics.boxWidth/1.5;
	}
	
	Window_CasinoChoice.prototype.makeCommandList = function() {
		if(upp_data().mobileMode == true) {
			this.addCommand('+1', 'p1');
			this.addCommand('+10', 'p10');
			this.addCommand('-1', 'm1');
			this.addCommand('-10', 'm10');
		}
		this.addCommand('Finished', 'fin');
	}

	
	Scene_ChipShop = function() {
		this.initialize.apply(this, arguments);
	}
	
	Scene_ChipShop.prototype = Object.create(Scene_MenuBase.prototype);
	Scene_ChipShop.prototype.constructor = Scene_ChipShop;
	
	Scene_ChipShop.prototype.initialize = function() {
		Scene_MenuBase.prototype.initialize.call(this);
	}
	
	Scene_ChipShop.prototype.start = function() {
		this.createWindows();
	}
	
	Scene_ChipShop.prototype.createWindows = function() {
		this.window_coinshop = new Window_ChipShop(Graphics.boxWidth/1.5, this.window_coinshopHeight());
		this.window_coinshop.x=Graphics.boxWidth/2-this.window_coinshop.width/2;
		this.window_coinshop.y=Window_Base.prototype.lineHeight()*5;
		
		this.window_coinDisplay = new Chip_Window();
		this.window_coinDisplay.width = 240;
		this.window_coinDisplay.height = Window_Base.prototype.lineHeight()*2;
		this.window_coinDisplay.y=Graphics.boxHeight-this.window_coinDisplay.height;
		this.gold_window = new Window_Gold(0, this.window_coinDisplay.y);
		this.gold_window.x = Graphics.boxWidth-this.gold_window.width;
		this.fin_window = new Window_CasinoChoice(this.window_coinshop.x, this.window_coinshop.y + this.window_coinshop.height);
		this.face_window = new Window_ChipMsg(Window_Base.prototype.lineHeight()*5);
		
		this.fin_window.setHandler('p1', this.changeNum.bind(this, 1));
		this.fin_window.setHandler('p10', this.changeNum.bind(this, 10));
		this.fin_window.setHandler('m1', this.changeNum.bind(this, -1));
		this.fin_window.setHandler('m10', this.changeNum.bind(this, -10));
		this.fin_window.setHandler('cancel', this.popScene.bind(this));
		this.fin_window.setHandler('fin', this.finishBuy.bind(this));
		this.addChild(this.window_coinshop);
		this.addChild(this.window_coinDisplay);
		this.addChild(this.gold_window);
		this.addChild(this.fin_window);
		this.addChild(this.face_window);
	}
	
	Scene_ChipShop.prototype.window_coinshopHeight = function() {
		return Window_Base.prototype.lineHeight()*3;
	}
	
	Scene_ChipShop.prototype.finishBuy = function() {
		if(this.window_coinshop.chipCount>maxChips-upp_data().chips) { this.window_coinshop.chipCount=maxChips-upp_data().chips; }
		upp_data().chips+=this.window_coinshop.chipCount;
		$gameParty.loseGold(this.window_coinshop.chipCount*chipCost);
		this.popScene();
	}
	
	Scene_ChipShop.prototype.changeNum = function(num) {
		this.window_coinshop.chipCount+=num;
		this.fin_window.activate();
	}
	
	Scene_ChipShop.prototype.update = function() {
		Scene_MenuBase.prototype.update.call(this);
		upp_data().chips=Math.min(Math.max(upp_data().chips, 0), maxChips);
	}
})();