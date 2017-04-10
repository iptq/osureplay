const async = require("asyncawait/async");
const await = require("asyncawait/await");
const bluebird = require("bluebird");
const Image = require("canvas").Image;
const fs = bluebird.promisifyAll(require("fs"));

const names = [
	"approachcircle",
	"cursor",
	"cursortrail",
	"default-0",
	"default-1",
	"default-2",
	"default-3",
	"default-4",
	"default-5",
	"default-6",
	"default-7",
	"default-8",
	"default-9",
	"hitcircle",
	"hitcircleoverlay",
	"reversearrow",
	"sliderb0",
	"sliderfollowcircle",
];

let Skin = {
	resources: { },
	loadImages: async(function() {
		for (let i = 0; i < names.length; ++i) {
			Skin.resources[names[i]] = new Image();
			Skin.resources[names[i]].src = await(fs.readFileAsync("skin/cookie/" + names[i] + ".png"));
			process.stdout.write("\rLoading images... (" + Math.round((i + 1) * 10000.0 / names.length) / 100 + "%)");
		}
		console.log();
	}),
	addImage: function(name, image) {
		this.resources[name] = image;
	},
	options: { },
	ParseIni: async(function(skinname) {
		let content = await(fs.readFileAsync(`skin/${skinname}/skin.ini`));
	    var skin = {};
	    var keyValReg = /^([a-zA-Z0-9]+)[ ]*:[ ]*(.+)$/;
	    content.toString().split(/[\n\r]+/).forEach(function (line) {
	        line = line.toString().trim();
	        if (!line) {
	            return;
	        }
	        var match = keyValReg.exec(line);
	        if (match) { skin[match[1]] = match[2]; }
	    });

	    return skin;
	})
};

module.exports = Skin;
