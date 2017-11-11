#include "playfield.h"
#include "beatmap.h"
#include "replay.h"

void init_playfield(playfield_t *p) {
    // draw anime girls
}

void write_frame(playfield_t *p, AVFrame *frame) {}

void free_playfield(playfield_t *p) {
    free_beatmap(p->beatmap);
    free_replay(p->replay);
    cairo_destroy(p->cr);
    cairo_surface_destroy(p->surface);
    free(p);
}
