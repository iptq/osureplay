#include "playfield.h"
#include "beatmap.h"
#include "replay.h"

void init_playfield(playfield_t *p) {
    // draw anime girls
}

void free_playfield(playfield_t *p) {
    free_beatmap(p->beatmap);
    free_replay(p->replay);
    free(p);
}
