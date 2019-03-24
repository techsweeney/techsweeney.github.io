/*:
 * @plugindesc Version: 1.00 | Slot machines! (requires upp_casinoCore)
 * @author William Ramsey (TheUnproPro)
 *
 * @param Slot Random Sound
 * @desc Sound effect when selecting random slots.
 * @default Electrocardiogram
 *
 * @param Slot Random Pitch
 * @desc Sound effect pitch when selecting random slots.
 * @default 100
 *
 * @param Slot Random Volume
 * @desc Sound effect volume when selecting random slots.
 * @default 70
 *
 * @param Slot Selected Sound
 * @desc Sound effect when selecting random slots.
 * @default Reflection
 *
 * @param Slot Selected Pitch
 * @desc Sound effect pitch when selecting random slots.
 * @default 100
 *
 * @param Slot Selected Volume
 * @desc Sound effect volume when selecting random slots.
 * @default 70
 *
 * @param Ticks
 * @desc How many ticks until the slot machine decides to select something?
 * @default 10
 *
 * @param Speed
 * @desc How many frames until it switches the slots?
 * @default 5
 *
 * @help
 * To increase/decrease odds, you can modify the sprite sheet called upp_slotSprites
 * located in the images system folder. Remember though, it's important to make each
 * sprite 144x120, just as seen in the sprite sheet. The cherries, watermelon, etc
 * are 144x120 each, just lined up in a sprite sheet.
 *
 * Plugin commands:
 * To set up a victory goal, you can use this:
 * upp_setSlotsVictory 1 2 3 amount
 * - where 1 2 and 3 are the order you need to get. For example, using the default
 *   image, 0 0 0 would be cherry cherry cherry, since 0 is the first "frame"of the
 *   image, the cherries. 1 1 1 would be watermelons, etc.
 *
 * upp_setSlotsPrice Cost
 * - where Cost is how much it'll cost to play that slot machine.
 *
 * upp_startSlots
 * - After you're done setting up all of the possible victories, you can then
 *   start the casino game using this command.
 * 
*/

(function() {
	var params = PluginManager.parameters("upp_casinoSlots");
	var sounds = [];
	var victories = [];
	var speed = Number(params['Speed']);
	var ticks=Number(params['Ticks']);
	sounds[0] = {
		name: params['Slot Random Sound'],
		pitch: Number(params['Slot Random Pitch']), 
		volume: Number(params['Slot Random Volume']),
		pan: 0
	}
	
	sounds[1] = {
		name: params['Slot Selected Sound'],
		pitch: Number(params['Slot Selected Pitch']), 
		volume: Number(params['Slot Selected Volume']),
		pan: 0
	}
	
	var empty = {};
	var sblsi = Scene_Boot.loadSystemImages
	Scene_Boot.loadSystemImages	= function() {
		sblsi.call(this);
		ImageManager.loadSystem("upp_slotsFront");
		ImageManager.loadSystem("upp_slotsBack");
		ImageManager.loadSystem("upp_slotSprites");
	}
	//{ Standard UPP Settings
	var upp_data = function() {
		if($gameSystem) {
			return $gameSystem.upp_data;
		} else { return empty }
	}
	
	var Obj = function(name) {
		return eval(name + ".prototype");
	}
	
	var newObj = function(name, base) {
		return eval(
		name + ` = function() {
		this.initialize.apply(this, arguments);
		}
	
		`+name+`.prototype = Object.create(`+base+`.prototype);
		`+name+`.prototype.constructor = `+name+`;`
		);
	}
	
	var Fn = function(obj, name, funct) {
		var str=`Obj('`+obj+`').`+name+`=function() { 
			funct.apply(this, arguments);
		}
		`;
		return eval(str);
	}
	//}
	
	//{ Commands
	var upp_miniMapCmds = Game_Interpreter.prototype.pluginCommand
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		upp_miniMapCmds.apply(this, arguments);
		
		if(command=="upp_startSlots") {
			SceneManager.push(Scene_UppSlots);
		}
		
		if(command=="upp_setSlotsVictory") {
			victories.push({
				s1: Number(args[0]),
				s2: Number(args[1]),
				s3: Number(args[2]),
				win: Number(args[3])
			});
		}
		
		if(command=="upp_setSlotsPrice") {
			slotCost = Number(args[0]);
		}
	}
	
	var slotCost=0;
	var slotMsg = "";
	var slotWin = "";
	var slotLose = "";
	//}
	
	//{Windows
	newObj("Dummy_Window", "Window_Base"); //{
		
	Fn("Dummy_Window", "initialize", function(x, y, width, height) {
		Window_Base.prototype.initialize.call(this, x, y, width, height);
	});
	//}
	
	newObj("Window_SlotGraphics", "Window_Base"); //{
	
	Fn("Window_SlotGraphics", "initialize", function() {
		Window_Base.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, Graphics.boxHeight);
		this.opacity=0;
		this.slot_id = [];
		this.timer=0;
		this.ticks=0;
		this.started=false;
		this.finished=false;
		this.win=false;
		this.winAmount = 0;
		this.refresh();
	});
	
	Window_SlotGraphics.prototype.standardPadding = function() {
		return 0;
	}
	
	Fn("Window_SlotGraphics", "refresh", function() {
		this.contents.clear();
		
		this.pad = Window_Base.prototype.standardPadding();
		this.contents.blt(ImageManager.loadSystem('upp_slotsBack'), 0, 0, 816, 624, 0, 0);
		this.contents.blt(ImageManager.loadSystem('upp_slotsFront'), 0, 0, 816, 624, 0, 0);
		if(this.started==false) {
			this.drawTextEx("It costs \\c[2]" + slotCost + " " +  upp_data().chipName + "\\c[0] to play!\nWould you like to play?", this.pad, this.pad+Graphics.boxHeight-this.lineHeight()*3, this.contents.width, this.lineHeight());
		}
		
		if(this.started==true) {
			this.updateSlots();
			if(this.finished==true) {
				if(this.win==true) {
					this.drawTextEx("You Win! You got " + this.winAmount + " " + upp_data().chipName + "\nPlay again?", this.pad, this.pad+Graphics.boxHeight-this.lineHeight()*3, this.contents.width, this.lineHeight());
				} else {
					this.drawTextEx("You Lose! \nPlay again?", this.pad, this.pad+Graphics.boxHeight-this.lineHeight()*3, this.contents.width, this.lineHeight());
				}
			}
		}
	});
	
	Fn("Window_SlotGraphics", "update", function() {
		this.refresh();
	});
	
	Fn("Window_SlotGraphics", "updateSlots", function() {
		var bitmap=ImageManager.loadSystem("upp_slotSprites");
		if(this.timer==speed && this.finished==false) {
			if(this.ticks<ticks) {
				this.slot_id[0] = Math.floor(Math.random()*(bitmap.width/144));
			}
			if(this.ticks<ticks*2) {
				this.slot_id[1] = Math.floor(Math.random()*(bitmap.width/144));
			}
			if(this.ticks<ticks*3) {
				this.slot_id[2] = Math.floor(Math.random()*(bitmap.width/144));
			}
			
			if(this.ticks==ticks || this.ticks==ticks*2 || this.ticks==ticks*3) {
				AudioManager.playSe(sounds[1]);
			}
			this.timer = 0;
			this.ticks+=1;
			
			if(this.ticks<ticks*3) {
				AudioManager.playSe(sounds[0]);
			}
			
			if(this.ticks>=ticks*3+1) {
				this.finished=true;
				for(var i=0;i<victories.length;i++) {
					if(this.slot_id[0] == victories[i].s1 && this.slot_id[1] == victories[i].s2 && this.slot_id[2] == victories[i].s3) {
						upp_data().chips+=victories[i].win;
						this.winAmount = victories[i].win;
						this.win=true;
					}
				}
			}
		}
		this.timer+=1;
		this.contents.blt(bitmap, this.slot_id[0]*144, 0, 144, 120, 132, 252);
		this.contents.blt(bitmap, this.slot_id[1]*144, 0, 144, 120, 336, 252);
		this.contents.blt(bitmap, this.slot_id[2]*144, 0, 144, 120, 540, 252);
	});
	//}
	
	newObj("Window_SlotChoice", "Window_Command"); //{
	
	Fn("Window_SlotChoice", "initialize", function(x, y) {
		Window_Command.prototype.initialize.call(this, x, y);
		this.opacity = 0;
	});
	
	Fn("Window_SlotChoice", "makeCommandList", function() {
		var enabled = false;
		if(upp_data().chips>=slotCost) {
			enabled = true;
		}
		this.addCommand("Yes", 'yes', enabled);
		this.addCommand("No", 'no');
	});
	//}
	
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
		this.contents.drawText(upp_data().chipName, 0, 0, this.contents.width, this.lineHeight());
		this.changeTextColor(this.normalColor());
		this.contents.drawText(upp_data().chips, 0, 0, this.contents.width, this .lineHeight(), 'right');
	}
	
	Chip_Window.prototype.update = function() {
		this.refresh();
	}
	
	//}
	
	//{ Scenes
	Scene_UppSlots = function() {
		this.initialize.apply(this, arguments);
	}
	
	Scene_UppSlots.prototype = Object.create(Scene_MenuBase.prototype);
	Scene_UppSlots.prototype.constructor = Scene_UppSlots;
	
	Scene_UppSlots.prototype.initialize = function() {
		Scene_MenuBase.prototype.initialize.call(this);
		this.ready=false;
	}
	
	Scene_UppSlots.prototype.start = function() {
		
		this.dummyWindow = new Dummy_Window(0,  Graphics.boxHeight-(Window_Base.prototype.lineHeight()*3), Graphics.boxWidth, Window_Base.prototype.lineHeight()*3);
		
		this.win = new Window_SlotGraphics();
		
		this.winChoice = new Window_SlotChoice(Graphics.boxWidth-240, Graphics.boxHeight-(Window_Base.prototype.lineHeight()*3));
		
		this.winChoice.setHandler('yes', this.yes.bind(this));
		this.winChoice.setHandler('no', this.close.bind(this));
		this.winChoice.setHandler('cancel', this.close.bind(this));
		this.addChild(this.dummyWindow);
		this.addChild(this.win);
		this.addChild(this.winChoice);
		
		this.chipWindow = new Chip_Window();
		this.chipWindow.width = 240;
		this.chipWindow.height = Window_Base.prototype.lineHeight()*2;
		this.chipWindow.y=this.dummyWindow.y-this.chipWindow.height;
		this.chipWindow.x=Graphics.boxWidth-this.chipWindow.width;
		this.addChild(this.chipWindow);
	}
	
	Scene_UppSlots.prototype.close = function() {
		victories.splice(0, victories.length);
		this.popScene();
	}
	
	Scene_UppSlots.prototype.yes = function() {
		upp_data().chips-=slotCost;
		this.win.win=false;
		this.win.finished=false;
		this.win.ticks=0;
		this.win.timer=0;
		this.win.winAmount=0;
		this.win.started=true;
		this.winChoice.hide();
		this.winChoice.deactivate();
		this.dummyWindow.hide();
		this.ready=true;
	}
	
	Scene_UppSlots.prototype.update = function() {
		Scene_MenuBase.prototype.update.call(this);
		if(this.win.finished==true) {
			this.winChoice.show();
			this.winChoice.activate();
			this.dummyWindow.show();
			this.ready=false;
		}
		if(upp_data().chips<slotCost) {
			this.winChoice._list[0].enabled = false;
		} else {
			this.winChoice._list[0].enabled = true;
		}
		this.winChoice.refresh();
		
		if(this.ready==false) {
			this.chipWindow.y=this.dummyWindow.y-this.chipWindow.height;
		} else {
			this.chipWindow.y=Graphics.boxHeight-this.chipWindow.height;
		}
	}
	//}
})();