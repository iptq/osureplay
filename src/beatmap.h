#ifndef beatmap_h_
#define beatmap_h_

#include "timing_point.h"

typedef struct beatmap_t {
    // General
    char *audiofilename;
    uint audioleadin;
    uint preview_time;
    bool countdown;
    char *sampleset;
    double stackleniency;
    EGameMode mode;
    bool letterboxinbreaks;
    bool widescreenstoryboard;

    // Editor
    double distancespacing;
    byte beatdivisor;
    byte gridsize;
    byte timelinezoom;

    // Metadata
    char *title;
    char *titleunicode;
    char *artist;
    char *artistunicode;
    char *creator;
    char *version;
    char *source;
    char *tags;
    int beatmapid;
    int beatmapsetid;

    // Difficulty
    double hpdrainrate;
    double circlesize;
    double overalldifficulty;
    double approachrate;
    double slidermultiplier;
    double slidertickrate;

    // Colours
    int ncombocolors;
    uint *combocolors;

    timing_point_list_t *timing_points;
} beatmap_t;

void parse_beatmap(beatmap_t *b, char *contents);
int set_beatmap_prop(beatmap_t *b, char *key, char *value);
void free_beatmap(beatmap_t *b);

#endif