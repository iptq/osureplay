#ifndef playfield_h_
#define playfield_h_

#include "beatmap.h"
#include "replay.h"
#include <libavcodec/avcodec.h>

typedef struct playfield {
    int fps;
    int tick;
    int width;
    int height;

    beatmap_t *beatmap;
    replay_t *replay;
    uint mp3_length;  // in milliseconds
} playfield_t;

void init_playfield(playfield_t *p);
void render_playfield();
void free_playfield(playfield_t *p);

#endif