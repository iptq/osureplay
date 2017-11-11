#include "beatmap.h"
#include "reader.h"
#include "timing_point.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void parse_beatmap(beatmap_t *b, char *contents) {
    reader_t reader = {contents, 0, strlen(contents)};
    char *line;
    char *section = NULL;

    b->timing_points =
        (timing_point_list_t *)malloc(sizeof(timing_point_list_t));
    init_timing_point_list(b->timing_points);

    while ((line = reader_read_line(&reader)) != NULL) {
        int length = strlen(line);
        if (line[0] == '[' && line[length - 1] == ']') {
            section = (char *)malloc(sizeof(char) * length - 1);
            strncpy(section, line + 1, length - 2);
            section[length - 2] = '\0';
        } else if (section) {
            if (!strcmp(section, "TimingPoints")) {
            } else if (!strcmp(section, "HitObjects")) {
            } else {
                char *c, *key, *val;
                size_t keylen, vallen;
                if ((c = strchr(line, ':'))) {
                    keylen = c - line;
                    if (line[keylen - 1] == ' ')
                        keylen -= 1;
                    key = (char *)malloc(sizeof(char) * (keylen + 1));
                    strncpy(key, line, keylen);
                    key[keylen] = '\0';

                    if (*(++c) == ' ')
                        ++c;
                    vallen = (line + length) - c;
                    val = (char *)malloc(sizeof(char) * (vallen + 1));
                    strncpy(val, c, vallen);
                    val[vallen] = '\0';

                    if (set_beatmap_prop(b, key, val)) {
                        fprintf(stderr, "Could not handle key '%s'\n", key);
                        exit(1);
                    }
                    free(key);
                    free(val);
                }
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

int set_beatmap_prop(beatmap_t *b, char *key, char *value) {
    size_t vlen = strlen(value);
    if (!strcmp(key, "AudioFilename")) {
        b->audiofilename = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->audiofilename, value, vlen);
        return 0;
    } else if (!strcmp(key, "AudioLeadIn")) {
        b->audioleadin = strtoul(value, NULL, 0);
        return 0;
    }
    return 1;
}

void free_beatmap(beatmap_t *b) {
    free(b->audiofilename);
    free(b->sampleset);
    free(b->bookmarks);
    free(b->title);
    free(b->titleunicode);
    free(b->artist);
    free(b->artistunicode);
    free(b->creator);
    free(b->version);
    free(b->source);
    free(b->tags);
    free_timing_point_list(b->timing_points);
    free(b->timing_points);
    free(b);
}