#ifndef src_beatmap_h
#define src_beatmap_h

namespace osureplay {

struct Difficulty {
    double ApproachRate;
    double CircleSize;
    double HPDrainRate;
    double OverallDifficulty;
};

class Beatmap {
    struct Difficulty difficultyOriginal;
    struct Difficulty difficultyModified;
};

} // namespace osureplay

#endif