#include "beatmap.h"
#include "reader.h"
#include "timing_point.h"

void parse_beatmap(beatmap_t *b, char *contents) {
    reader_t reader = {contents, 0, strlen(contents)};
    char *line;
    char *section = NULL;

    b->timing_points =
        (timing_point_list_t *)malloc(sizeof(timing_point_list_t));
    init_timing_point_list(b->timing_points);

    b->ncombocolors = 0;
    b->combocolors = (uint *)calloc(MAXCOMBOCOLORS, sizeof(uint));

    while ((line = reader_read_line(&reader)) != NULL) {
        int length = strlen(line);
        if (length == 0) {
            free(line);
            continue;
        }
        if (line[0] == '[' && line[length - 1] == ']') {
            section = (char *)malloc(sizeof(char) * length - 1);
            strncpy(section, line + 1, length - 2);
            section[length - 2] = '\0';
        } else if (section) {
            if (!strcmp(section, "TimingPoints")) {
                timing_point_t *t =
                    (timing_point_t *)malloc(sizeof(timing_point_t));
                parse_timing_point(t, line);
                add_timing_point(b->timing_points, t);
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
        timing_point_t *obj = b->timing_points->list[i];
        if (!obj->uninherited) {
            b->timing_points->list[i]->bpm = b->timing_points->list[i - 1]->bpm;
        }
    }
}

int set_beatmap_prop(beatmap_t *b, char *key, char *value) {
    size_t vlen = strlen(value);
    if (!strcmp(key, "AudioFilename")) {
        b->audiofilename = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->audiofilename, value, vlen);
    } else if (!strcmp(key, "AudioLeadIn")) {
        b->audioleadin = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "PreviewTime")) {
        b->preview_time = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "Countdown")) {
        b->countdown = strtoul(value, NULL, 0) == 1;
    } else if (!strcmp(key, "SampleSet")) {
        b->sampleset = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->sampleset, value, vlen);
    } else if (!strcmp(key, "StackLeniency")) {
        b->stackleniency = strtold(value, NULL);
    } else if (!strcmp(key, "Mode")) {
        b->stackleniency = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "LetterboxInBreaks")) {
        b->letterboxinbreaks = strtoul(value, NULL, 0) == 1;
    } else if (!strcmp(key, "WidescreenStoryboard")) {
        b->widescreenstoryboard = strtoul(value, NULL, 0) == 1;
    } else if (!strcmp(key, "Bookmarks")) {
        // yeah fuck this
    } else if (!strcmp(key, "DistanceSpacing")) {
        b->distancespacing = strtold(value, NULL);
    } else if (!strcmp(key, "BeatDivisor")) {
        b->beatdivisor = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "GridSize")) {
        b->gridsize = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "TimelineZoom")) {
        b->timelinezoom = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "Title")) {
        b->title = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->title, value, vlen);
    } else if (!strcmp(key, "TitleUnicode")) {
        b->titleunicode = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->titleunicode, value, vlen);
    } else if (!strcmp(key, "Artist")) {
        b->artist = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->artist, value, vlen);
    } else if (!strcmp(key, "ArtistUnicode")) {
        b->artistunicode = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->artistunicode, value, vlen);
    } else if (!strcmp(key, "Creator")) {
        b->creator = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->creator, value, vlen);
    } else if (!strcmp(key, "Version")) {
        b->version = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->version, value, vlen);
    } else if (!strcmp(key, "Source")) {
        b->source = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->source, value, vlen);
    } else if (!strcmp(key, "Tags")) {
        b->tags = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(b->tags, value, vlen);
    } else if (!strcmp(key, "BeatmapID")) {
        b->beatmapid = strtol(value, NULL, 0);
    } else if (!strcmp(key, "BeatmapSetID")) {
        b->beatmapsetid = strtol(value, NULL, 0);
    } else if (!strcmp(key, "HPDrainRate")) {
        b->hpdrainrate = strtold(value, NULL);
    } else if (!strcmp(key, "CircleSize")) {
        b->circlesize = strtold(value, NULL);
    } else if (!strcmp(key, "OverallDifficulty")) {
        b->overalldifficulty = strtold(value, NULL);
    } else if (!strcmp(key, "ApproachRate")) {
        b->approachrate = strtold(value, NULL);
    } else if (!strcmp(key, "SliderMultiplier")) {
        b->slidermultiplier = strtold(value, NULL);
    } else if (!strcmp(key, "SliderTickRate")) {
        b->slidertickrate = strtold(value, NULL);
    } else if (!strncmp(key, "Combo", 5)) {
        b->combocolors[b->ncombocolors++] = strtoul(value, NULL, 0);
    } else {
        return 1;
    }
    return 0;
}

void free_beatmap(beatmap_t *b) {
    free(b->audiofilename);
    free(b->sampleset);
    free(b->title);
    free(b->titleunicode);
    free(b->artist);
    free(b->artistunicode);
    free(b->creator);
    free(b->version);
    free(b->source);
    free(b->tags);
    free(b->combocolors);
    free_timing_point_list(b->timing_points);
    free(b);
}