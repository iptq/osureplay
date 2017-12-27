#include "beatmap.h"
#include "reader.h"
#include "timing_point.h"

void parse_beatmap(beatmap_t *beatmap, char *contents) {
    reader_t reader = {contents, 0, strlen(contents)};
    char *line;
    char *section = NULL;

    beatmap->timing_points =
        (timing_point_list_t *)malloc(sizeof(timing_point_list_t));
    init_timing_point_list(beatmap->timing_points);

    beatmap->ncombocolors = 0;
    beatmap->combocolors = (uint *)calloc(MAXCOMBOCOLORS, sizeof(uint));

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
                add_timing_point(beatmap->timing_points, t);
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

                    if (set_beatmap_prop(beatmap, key, val)) {
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

    for (int i = 0, l = beatmap->timing_points->size; i < l; ++i) {
        timing_point_t *obj = beatmap->timing_points->list[i];
        if (!obj->uninherited) {
            beatmap->timing_points->list[i]->bpm =
                beatmap->timing_points->list[i - 1]->bpm;
        }
    }
}

int set_beatmap_prop(beatmap_t *beatmap, char *key, char *value) {
    size_t vlen = strlen(value);
    if (!strcmp(key, "AudioFilename")) {
        beatmap->audiofilename = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->audiofilename, value, vlen);
    } else if (!strcmp(key, "AudioLeadIn")) {
        beatmap->audioleadin = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "PreviewTime")) {
        beatmap->preview_time = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "Countdown")) {
        beatmap->countdown = strtoul(value, NULL, 0) == 1;
    } else if (!strcmp(key, "SampleSet")) {
        beatmap->sampleset = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->sampleset, value, vlen);
    } else if (!strcmp(key, "StackLeniency")) {
        beatmap->stackleniency = strtold(value, NULL);
    } else if (!strcmp(key, "Mode")) {
        beatmap->stackleniency = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "LetterboxInBreaks")) {
        beatmap->letterboxinbreaks = strtoul(value, NULL, 0) == 1;
    } else if (!strcmp(key, "WidescreenStoryboard")) {
        beatmap->widescreenstoryboard = strtoul(value, NULL, 0) == 1;
    } else if (!strcmp(key, "Bookmarks")) {
        // yeah fuck this
    } else if (!strcmp(key, "DistanceSpacing")) {
        beatmap->distancespacing = strtold(value, NULL);
    } else if (!strcmp(key, "BeatDivisor")) {
        beatmap->beatdivisor = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "GridSize")) {
        beatmap->gridsize = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "TimelineZoom")) {
        beatmap->timelinezoom = strtoul(value, NULL, 0);
    } else if (!strcmp(key, "Title")) {
        beatmap->title = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->title, value, vlen);
    } else if (!strcmp(key, "TitleUnicode")) {
        beatmap->titleunicode = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->titleunicode, value, vlen);
    } else if (!strcmp(key, "Artist")) {
        beatmap->artist = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->artist, value, vlen);
    } else if (!strcmp(key, "ArtistUnicode")) {
        beatmap->artistunicode = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->artistunicode, value, vlen);
    } else if (!strcmp(key, "Creator")) {
        beatmap->creator = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->creator, value, vlen);
    } else if (!strcmp(key, "Version")) {
        beatmap->version = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->version, value, vlen);
    } else if (!strcmp(key, "Source")) {
        beatmap->source = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->source, value, vlen);
    } else if (!strcmp(key, "Tags")) {
        beatmap->tags = (char *)malloc(sizeof(char) * (vlen + 1));
        strncpy(beatmap->tags, value, vlen);
    } else if (!strcmp(key, "BeatmapID")) {
        beatmap->beatmapid = strtol(value, NULL, 0);
    } else if (!strcmp(key, "BeatmapSetID")) {
        beatmap->beatmapsetid = strtol(value, NULL, 0);
    } else if (!strcmp(key, "HPDrainRate")) {
        beatmap->hpdrainrate = strtold(value, NULL);
    } else if (!strcmp(key, "CircleSize")) {
        beatmap->circlesize = strtold(value, NULL);
    } else if (!strcmp(key, "OverallDifficulty")) {
        beatmap->overalldifficulty = strtold(value, NULL);
    } else if (!strcmp(key, "ApproachRate")) {
        beatmap->approachrate = strtold(value, NULL);
    } else if (!strcmp(key, "SliderMultiplier")) {
        beatmap->slidermultiplier = strtold(value, NULL);
    } else if (!strcmp(key, "SliderTickRate")) {
        beatmap->slidertickrate = strtold(value, NULL);
    } else if (!strncmp(key, "Combo", 5)) {
        beatmap->combocolors[beatmap->ncombocolors++] = strtoul(value, NULL, 0);
    } else {
        return 1;
    }
    return 0;
}

void free_beatmap(beatmap_t *beatmap) {
    free(beatmap->audiofilename);
    free(beatmap->sampleset);
    free(beatmap->title);
    free(beatmap->titleunicode);
    free(beatmap->artist);
    free(beatmap->artistunicode);
    free(beatmap->creator);
    free(beatmap->version);
    free(beatmap->source);
    free(beatmap->tags);
    free(beatmap->combocolors);

    free_timing_point_list(beatmap->timing_points);
    free(beatmap);
}