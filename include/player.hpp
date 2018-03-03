#ifndef src_player_h
#define src_player_h

#include "beatmap.hpp"

namespace osureplay {

class Player {
  public:

    // getters and setters
    Beatmap beatmap() { return beatmap_; }

  private:
    Beatmap beatmap_;
};

} // namespace osureplay

#endif