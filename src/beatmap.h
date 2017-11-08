#ifndef beatmap_h_
#define beatmap_h_

#include "timing_point.h"

typedef struct beatmap_t {
    char *audio_filename;
    timing_point_list_t *timing_points;
} beatmap_t;

void parse_beatmap(beatmap_t *b, char *contents);
void free_beatmap(beatmap_t *b);

#endif