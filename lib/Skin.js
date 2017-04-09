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
	"sliderb0"
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
	}
};

module.exports = Skin;
