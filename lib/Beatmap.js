var fs = require("fs");
var Color = require("./Color");
var HitObject = require("./beatmap/HitObject");
var Slider = HitObject.Slider;
var TimingPoint = require("./beatmap/TimingPoint");
var Util = require("./Util");

var sectionPattern = /^\[([a-zA-Z0-9]+)\]$/,
	keyPairPattern = /^([a-zA-Z0-9]+)[ ]*:[ ]*(.+)?$/
const KEEP_THROUGH_SERIALIZATION = [
	"Bookmarks", "Tags", "FileFormat", "AudioFilename",
	"AudioLeadIn", "PreviewTime", "Countdown", "SampleSet", "StackLeniency",
	"Mode", "LetterboxInBreaks", "WidescreenStoryboard", "DistanceSpacing",
	"BeatDivisor", "GridSize", "TimelineZoom", "Title", "TitleUnicode",
	"Artist", "ArtistUnicode", "Creator", "Version", "Source", "BeatmapID",
	"BeatmapSetID", "HPDrainRate", "CircleSize", "OverallDifficulty",
	"ApproachRate", "SliderMultiplier", "SliderTickRate", "breakTimes",
	"bgFilename"
];

class Beatmap {
	constructor() { }
	static ParseFile(file) {
		return new Promise(function(resolve) {
			fs.exists(file, function (exists) {
				if (!exists) {
					callback(new Error("File doesn't exist."));
				}
				Beatmap.ParseStream(fs.createReadStream(file), function (beatmap) {
					resolve(beatmap);
				});
			});
		});
	}
	static ParseFileSync(file) {
		if (!fs.existsSync(file)) {
			return new Error("File doesn't exist.");
		}
		return Beatmap.ParseString(fs.readFileSync(file, "utf-8"));
	}
	static ParseStream(stream, callback) {
		var buffer = "";
		stream.on("data", function (chunk) {
			buffer += chunk;
		});
		stream.on("error", function (err) {
			callback(err);
		});
		stream.on("end", function () {
			callback(Beatmap.ParseString(buffer));
		});
	}
	newID() {
		var id;
		while (true) {
			id = Util.randomString();
			if (id in this.HitObjects) continue;
			if (id in this.TimingPoints) continue;
			break;
		}
		return id;
	}
	static ParseString(data) {
		var i, id;
		var beatmap = new Beatmap();
		var lines = data.split(/\r?\n/);
		var osuSection;
		var sections = {};
		beatmap.ComboColors = [];
		beatmap.Bookmarks = [];
		beatmap.Tags = [];
		var parseBookmark = function (bookmark) {
			return parseInt(bookmark); // avoid http://stackoverflow.com/questions/14528397/strange-behavior-for-map-parseint
		};
		for (i = 0; i < lines.length; i += 1) {
			var line = lines[i].trim();
			if (!line) continue;
			var match = sectionPattern.exec(line);
			if (match) {
				osuSection = match[1].toLowerCase();
				continue;
			}
			switch (osuSection) {
				case "timingpoints":
					if (!("TimingPoints" in sections))
						sections.TimingPoints = [];
					sections.TimingPoints.push(line);
					break;
				case "hitobjects":
					if (!("HitObjects" in sections))
						sections.HitObjects = [];
					sections.HitObjects.push(line);
					break;
				case "events":
					if (!("Events" in sections))
						sections.Events = [];
					sections.Events.push(line);
					break;
				default:
					if (!osuSection) {
						match = /^osu file format (v[0-9]+)$/.exec(line);
						if (match) {
							beatmap.FileFormat = match[1];
							continue;
						}
					} else {
						match = keyPairPattern.exec(line);
						if (match) {
							if (!match[2]) match[2] = '';
							if (/combo(\d+)/i.exec(match[1])) {
								beatmap.ComboColors.push(Color.fromArray(match[2].split(",")));
								continue;
							}
							switch (match[1].toLowerCase()) {
								case "tags":
									beatmap[match[1]] = match[2].split(" ");
									break;
								case "bookmarks":
									beatmap[match[1]] = match[2].split(",").map(parseBookmark);
									break;
								case "stackleniency":
								case "distancespacing":
								case "beatdivisor":
								case "gridsize":
								case "previewtime":
								case "mode":
								case "hpdrainrate":
								case "circlesize":
								case "approachrate":
								case "overalldifficulty":
								case "slidermultiplier":
								case "slidertickrate":
									beatmap[match[1]] = parseFloat(match[2]);
									break;
								default:
									beatmap[match[1]] = match[2];
									break;
							}
						}
					}
					break;
			}
		}

		beatmap.TimingPoints = [];
		beatmap.HitObjects = [];

		beatmap.BpmMin = Infinity;
		beatmap.BpmMax = 0;
		var prev = null;
		for (i = 0; i < sections.TimingPoints.length; i += 1) {
			var timingPoint = new TimingPoint(sections.TimingPoints[i]);
			if (timingPoint.bpm) {
				beatmap.BpmMin = Math.min(beatmap.BpmMin, timingPoint.bpm);
				beatmap.BpmMax = Math.max(beatmap.BpmMax, timingPoint.bpm);
				timingPoint.baseOffset = timingPoint.offset;
			} else if (prev) {
				timingPoint.beatLength = prev.beatLength;
				timingPoint.bpm = prev.bpm;
				timingPoint.baseOffset = prev.baseOffset;
			}
			prev = timingPoint;
			id = beatmap.newID();
			timingPoint.id = id;
			beatmap.TimingPoints.push(timingPoint);
		}
		beatmap.TimingPoints.sort(function (a, b) {
			return a.offset - b.offset;
		});
		for (i = 0; i < sections.HitObjects.length; i += 1) {
			var hitObject = HitObject.parse(sections.HitObjects[i]);
			hitObject.beatmap = beatmap;
			if (hitObject instanceof Slider) {
				hitObject.calculate();
			}
			id = beatmap.newID();
			hitObject.id = id;
			beatmap.HitObjects.push(hitObject);
		}
		beatmap.HitObjects.sort(function (a, b) {
			return a.startTime - b.startTime;
		});

		beatmap.breakTimes = [];
		beatmap.originalEvents = sections.Events.join('\n');
		for (i = 0; i < sections.Events.length; i += 1) {
			var members = sections.Events[i].split(',');

			if (members[0] == '0' && members[1] == '0' && members[2]) {
				var bgName = members[2].trim();

				if (bgName.charAt(0) == '"' && bgName.charAt(bgName.length - 1) == '"') {
					beatmap.bgFilename = bgName.substring(1, bgName.length - 1);
				} else {
					beatmap.bgFilename = bgName;
				}
			} else if (members[0] == '2' && /^[0-9]+$/.test(members[1]) && /^[0-9]+$/.test(members[2])) {
				beatmap.breakTimes.push({
					startTime: parseInt(members[1]),
					endTime: parseInt(members[2])
				});
			}
		}

		// console.log(sections);
		return beatmap;
	}
	serialize() {
		var osu = `osu file format ${this.FileFormat}\n`;
		osu += '\n[General]\n';
		['AudioFilename', 'AudioLeadIn', 'PreviewTime', 'Countdown', 'SampleSet',
			'StackLeniency', 'Mode', 'LetterboxInBreaks', 'WidescreenStoryboard'
		].forEach(property => {
			osu += `${property}: ${this[property]}\n`;
		});

		osu += '\n[Editor]\n';
		if (this.hasOwnProperty('Bookmarks') && this.Bookmarks.length > 0)
			osu += `Bookmarks: ${this.Bookmarks.join(',')}\n`;
		['DistanceSpacing', 'BeatDivisor', 'GridSize', 'TimelineZoom'].forEach(property => {
			osu += `${property}: ${this[property]}\n`;
		});

		osu += '\n[Metadata]\n';
		['Title', 'TitleUnicode', 'Artist', 'ArtistUnicode', 'Creator',
			'Version', 'Source', 'Tags', 'BeatmapID', 'BeatmapSetID'
		].forEach(property => {
			osu += `${property}:${property == 'Tags' ? this[property].join(' ') : this[property]}\n`;
		});

		osu += '\n[Difficulty]\n';
		['HPDrainRate', 'CircleSize', 'OverallDifficulty',
			'ApproachRate', 'SliderMultiplier', 'SliderTickRate'
		].forEach(property => {
			osu += `${property}:${this[property]}\n`;
		});

		osu += '\n[Events]\n';
		osu += this.originalEvents + '\n';

		osu += '\n[TimingPoints]\n';
		this.TimingPoints.forEach(tpt => {
			osu += tpt.serialize() + '\n';
		});

		osu += '\n';
		if (this.hasOwnProperty('ComboColors') && this.ComboColors.length > 0) {
			osu += '\n[Colours]\n';
			for (var i = 0; i < this.ComboColors.length; i++) {
				osu += `Combo${i + 1} : ${this.ComboColors[i].toArray().join(',')}\n`;
			}
		}

		osu += '\n[HitObjects]\n';
		this.HitObjects.forEach(obj => {
			osu += obj.serialize() + '\n';
		});

		return osu + '\n';
	}
	getTimingPoint(offset) {
		var left = 0,
			right = this.TimingPoints.length - 1;
		var result = 0;
		while (left <= right) {
			var midpoint = ~~((left + right) / 2);
			if (this.TimingPoints[midpoint].offset > offset) {
				right = midpoint - 1;
			} else {
				result = midpoint;
				left = midpoint + 1;
			}
		}
		return this.TimingPoints[result];
		// for (var i = this.TimingPoints.length - 1; i >= 0; i -= 1) {
		// 	if (this.TimingPoints[i].offset <= offset)
		// 		return this.TimingPoints[i];
		// }
		// return this.TimingPoints[0];
	}

	getIndexAt(offset) {
		for (var i = 0; i < this.HitObjects.length; i++) {
			var obj = this.HitObjects[i];
			if (obj instanceof Slider || obj instanceof Spinner) {
				if (offset < obj.endTime) {
					return i;
				}
			} else {
				if (offset <= obj.startTime) {
					return i;
				}
			}
		}
		return i - 1;
	}

	matchObj(id) {
		for (var i = 0; i < this.HitObjects.length; i++) {
			if (this.HitObjects[i].hasOwnProperty('id') && this.HitObjects[i].id == id) return this.HitObjects[i];
		}
	}

	static unjson(object) {
		var beatmap = new Beatmap();
		for (var key of KEEP_THROUGH_SERIALIZATION) {
			if (object.hasOwnProperty(key)) {
				beatmap[key] = object[key];
			}
		}
		if (object.hasOwnProperty("ComboColors")) {
			beatmap.ComboColors = object.ComboColors.map(function (color) {
				return Color.fromArray(color);
			});
		}
		if (object.hasOwnProperty("TimingPoints")) {
			var prev;
			beatmap.TimingPoints = object.TimingPoints.map(function (data) {
				var point = new TimingPoint(data.serialized);
				if (point.bpm) {
					beatmap.BpmMin = Math.min(beatmap.BpmMin, point.bpm);
					beatmap.BpmMax = Math.max(beatmap.BpmMax, point.bpm);
					point.baseOffset = point.offset;
				} else if (prev) {
					point.beatLength = prev.beatLength;
					point.bpm = prev.bpm;
					point.baseOffset = prev.baseOffset;
				}
				prev = point;
				point.id = data.id;
				return point;
			});
			beatmap.TimingPoints.sort(function (a, b) {
				return a.offset - b.offset;
			});
		}
		if (object.hasOwnProperty("HitObjects")) {
			beatmap.HitObjects = object.HitObjects.map(function (data) {
				var object = HitObject.parse(data.serialized);
				object.id = data.id;
				object.beatmap = beatmap;
				if (object instanceof Slider) {
					object.calculate();
				}
				return object;
			});
			beatmap.HitObjects.sort(function (a, b) {
				return a.startTime - b.startTime;
			});
		}
		return beatmap;
	}

	json() {
		var obj = {};
		for (var key of KEEP_THROUGH_SERIALIZATION) {
			obj[key] = this[key];
		}
		obj.ComboColors = this.ComboColors.map(function (color) {
			return color.toArray();
		});
		obj.TimingPoints = this.TimingPoints.map(function (point) {
			return {
				id: point.id,
				serialized: point.serialize()
			};
		});
		obj.HitObjects = this.HitObjects.map(function (object) {
			return {
				id: object.id,
				serialized: object.serialize()
			};
		});
		return obj;
	}
}

module.exports = Beatmap;
