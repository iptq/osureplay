class TimingPoint {
  constructor(line) {
    let parts = line.split(",");

    this.offset = parseInt(parts[0]);
    this.velocity = 1;
    this.beatLength = parseFloat(parts[1]);
    this.timingSignature = parseInt(parts[2]);
    this.sampleSetId = parseInt(parts[3]);
    this.customSampleIndex = parseInt(parts[4]);
    this.sampleVolume = parseInt(parts[5]);
    this.timingChange = (parts[6] == 1);
    this.kiaiTimeActive = (parts[7] == 1);

    if (!isNaN(this.beatLength) && this.beatLength !== 0) {
      if (this.beatLength > 0) {
        this.bpm = Math.round(60000 / this.beatLength);
        this.baseOffset = this.offset;
      } else {
        this.velocity = Math.abs(100 / this.beatLength);
      }
    }
  }
  serialize() {
    let parts = [];
    parts.push(this.offset);
    parts.push(this.timingChange ? this.beatLength : -100 / this.velocity);
    parts.push(this.timingSignature);
    parts.push(this.sampleSetId);
    parts.push(this.customSampleIndex);
    parts.push(this.sampleVolume);
    parts.push(this.timingChange ? "1" : "0");
    parts.push(this.kiaiTimeActive ? "1" : "0");
    return parts.join(",");
  }
}

module.exports = TimingPoint;
