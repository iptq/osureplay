#ifndef playfield_h_
#define playfield_h_

#include <GL/glew.h>
#include <libavcodec/avcodec.h>

#include "beatmap.h"
#include "replay.h"
#include "skin.h"

typedef struct {
    int fps;
    int tick;
    int width;
    int height;

    beatmap_t *beatmap;
    replay_t *replay;
    skin_t *skin;

    uint mp3_length;  // in milliseconds
} playfield_t;

void draw_playfield(playfield_t *playfield);
void init_playfield(playfield_t *playfield);
void render_playfield(playfield_t *playfield);
void free_playfield(playfield_t *playfield);

#endif