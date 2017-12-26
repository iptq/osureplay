#include "playfield.h"
#include "beatmap.h"
#include "replay.h"

void draw_playfield(playfield_t *p) { printf("nice\n"); }

void playfield_load_assets(playfield_t *p) {
    // load audio file
}

void render_playfield() {}

void free_playfield(playfield_t *p) {
    free_beatmap(p->beatmap);
    free_replay(p->replay);
    free(p);
}
