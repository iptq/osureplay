#include "playfield.h"
#include "beatmap.h"
#include "replay.h"

void free_playfield(playfield_t *p) {
    // TODO: dunno why this coredumps
    // free_beatmap(p->beatmap);
    free(p->beatmap);
    free_replay(p->replay);
    free(p);
}