#ifndef playfield_h_
#define playfield_h_

#include "beatmap.h"
#include <libavcodec/avcodec.h>

typedef struct playfield_t {
    int fps;
    int tick;
    int width;
    int height;
    beatmap_t beatmap;
} playfield_t;

void write_frame(playfield_t *p, AVFrame *frame);

#endif