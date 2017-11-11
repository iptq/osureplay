#include "playfield.h"
#include "beatmap.h"
#include "replay.h"

void free_playfield(playfield_t *p) {
    free_beatmap(p->beatmap);
    free_replay(p->replay);
    free(p);
}