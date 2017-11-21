#ifndef timing_point_h_
#define timing_point_h_

#include "common.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct timing_point {
    int offset;
    bool uninherited;
    double bpm;
    int meter;
    int sampletype;
    int sampleset;
    int volume;
    bool kiai;
} timing_point_t;

typedef struct timing_point_list {
    int size;
    int capacity;
    timing_point_t **list;
} timing_point_list_t;

void parse_timing_point(timing_point_t *t, char *line);

void init_timing_point_list(timing_point_list_t *t);
void add_timing_point(timing_point_list_t *ts, timing_point_t *t);
void free_timing_point_list(timing_point_list_t *t);

#endif
