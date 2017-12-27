#ifndef timing_point_h_
#define timing_point_h_

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "common.h"

typedef struct {
    int offset;
    bool uninherited;
    double bpm;
    int meter;
    int sampletype;
    int sampleset;
    int volume;
    bool kiai;
} timing_point_t;

typedef struct {
    int size;
    int capacity;
    timing_point_t **list;
} timing_point_list_t;

void parse_timing_point(timing_point_t *point, char *line);

void init_timing_point_list(timing_point_list_t *point);
void add_timing_point(timing_point_list_t *points, timing_point_t *point);
void free_timing_point_list(timing_point_list_t *point);

#endif
