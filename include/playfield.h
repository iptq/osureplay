#ifndef playfield_h_
#define playfield_h_

#include <GL/glew.h>
#include <libavcodec/avcodec.h>

#include "beatmap.h"
#include "replay.h"

typedef struct playfield {
    int fps;
    int tick;
    int width;
    int height;

    beatmap_t *beatmap;
    replay_t *replay;
    skin_t *skin;

    uint mp3_length;  // in milliseconds
} playfield_t;

void draw_playfield(playfield_t *p);
void init_playfield(playfield_t *p);
void render_playfield();
void free_playfield(playfield_t *p);

#endif