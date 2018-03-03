#ifndef src_beatmap_h
#define src_beatmap_h

namespace osureplay {

enum GameMode {
    Standard, Taiko, Catch, Mania
};

struct Difficulty {
    double ApproachRate;
    double CircleSize;
    double HPDrainRate;
    double OverallDifficulty;
};

class Beatmap {
    enum GameMode mode;
    struct Difficulty difficultyOriginal;
    struct Difficulty difficultyModified;
};

} // namespace osureplay

#endif