#include "beatmap.h"
#include "reader.h"
#include "timing_point.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void parse_beatmap(beatmap_t *b, char *contents) {
    reader_t reader = {contents, 0, strlen(contents)};
    char *line;
    char *section = NULL;

    init_timing_point_list(b->timing_points);

    while ((line = reader_read_line(&reader)) != NULL) {
        int length = strlen(line);
        if (line[0] == '[' && line[length - 1] == ']') {
            section = (char *)malloc(sizeof(char) * length - 1);
            strncpy(section, line + 1, length - 2);
            section[length - 2] = '\0';
        } else {
            if (!strcmp(section, "TimingPoints")) {
            }
        }
        free(line);
    }

    for (int i = 0, l = b->timing_points->size; i < l; ++i) {
        if (b->timing_points->list[i]->inherited) {
        } else {
            printf("at point %d in time, map is %lf bpm.\n",
                   b->timing_points->list[i]->offset,
                   b->timing_points->list[i]->bpm);
        }
    }
}

void free_beatmap(beatmap_t *b) {
    free(b->audio_filename);
    free_timing_point_list(b->timing_points);
    free(b->timing_points);
    free(b);
}