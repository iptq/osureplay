#ifndef src_player_h
#define src_player_h

#include "beatmap.hpp"
#include "replay.hpp"

namespace osureplay {

class Player {
  public:
    void LoadReplay(std::string path);

    // getters and setters
    Beatmap beatmap() { return beatmap_; }

  private:
    Beatmap beatmap_;
    Replay replay_;
};

} // namespace osureplay

#endif