#define _POSIX_SOURCE

#include "timing_point.h"

void parse_timing_point(timing_point_t *t, char *line) {
    // TODO check if maybe-uninitialized warning is a gcc bug

    char *token, *saveptr = line;
    double second;
    int tmp, i = 0;

    while ((token = strtok_r(saveptr, ",", &saveptr))) {
        switch (i) {
        case 0:
            sscanf(token, "%d", &t->offset);
            break;
        case 1:
            sscanf(token, "%lf", &second);
            if (second >= 0)
                t->bpm = 1000.0 * 60 / second;
            break;
        case 2:
            sscanf(token, "%d", &t->meter);
            break;
        case 3:
            sscanf(token, "%d", &t->sampletype);
            break;
        case 4:
            sscanf(token, "%d", &t->sampleset);
            break;
        case 5:
            sscanf(token, "%d", &t->volume);
            break;
        case 6:
            sscanf(token, "%d", &tmp);
            t->uninherited = tmp;
            break;
        case 7:
            sscanf(token, "%d", &tmp);
            t->kiai = tmp;
            break;
        default:
            fprintf(stderr, "Too many tokens in timing point (i=%d)..\n", i);
            exit(1);
        }
        ++i;
    }
}

void init_timing_point_list(timing_point_list_t *ts) {
    ts->size = 0;
    ts->capacity = 40;
    ts->list =
        (timing_point_t **)malloc(ts->capacity * sizeof(timing_point_t *));
}

void add_timing_point(timing_point_list_t *ts, timing_point_t *t) {
    ts->list[ts->size++] = t;
    if (ts->size == ts->capacity) {
        ts->capacity *= 2;
        ts->list = (timing_point_t **)realloc(
            ts->list, ts->capacity * sizeof(timing_point_t **));
    }
}

void free_timing_point_list(timing_point_list_t *t) {
    for (int i = 0, l = t->size; i < l; ++i) {
        free(t->list[i]);
    }
    free(t->list);
    free(t);
}