#include "timing_point.h"

void parse_timing_point(timing_point_t *t, char *line) {
    char *token;
    double second;
    for (int i = 0; i < 8; ++i) {
        token = strtok(line, ",");
        if (token == NULL) {
            fprintf(stderr, "Error when parsing timing point: '%s'\n", line);
            exit(1);
        }
        switch (i) {
        case 0:
            sscanf(token, "%d", &t->offset);
            break;
        case 1:
            sscanf(token, "%lf", &second);
            if (second >= 0) {
                // it's bpm!
                t->inherited = true;
                t->bpm = second / 1000 * 60;
            } else {
                t->inherited = false;
            }
            break;
        default:
            fprintf(stderr, "really strange error..\n");
            exit(1);
        }
    }
}

void init_timing_point_list(timing_point_list_t *ts) {
    ts = (timing_point_list_t *)malloc(sizeof(timing_point_list_t));
    ts->size = 0;
    ts->capacity = 40;
    ts->list =
        (timing_point_t **)malloc(ts->capacity * sizeof(timing_point_t *));
}

void add_timing_point(timing_point_list_t *ts, timing_point_t *t) {
    ts->list[ts->size] = t;
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