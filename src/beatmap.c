#include "beatmap.h"
#include "reader.h"
#include <stdio.h>
#include <stdlib.h>

void parse_beatmap(beatmap_t *b, char *contents) {
    reader_t reader = {contents, 0, strlen(contents)};
    char *line;
    char *section;

    while ((line = reader_read_line(&reader)) != NULL) {
        printf("line: %s (length=%d)\n", line, strlen(line));
        free(line);
    }
}

void free_beatmap(beatmap_t *b) { free(b->audio_filename); }