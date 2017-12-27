#define _POSIX_SOURCE

#include "timing_point.h"

void parse_timing_point(timing_point_t *point, char *line) {
    // TODO check if maybe-uninitialized warning is a gcc bug

    char *token, *saveptr = line;
    double second;
    int tmp, i = 0;

    while ((token = strtok_r(saveptr, ",", &saveptr))) {
        switch (i) {
        case 0:
            sscanf(token, "%d", &point->offset);
            break;
        case 1:
            sscanf(token, "%lf", &second);
            if (second >= 0)
                point->bpm = 1000.0 * 60 / second;
            break;
        case 2:
            sscanf(token, "%d", &point->meter);
            break;
        case 3:
            sscanf(token, "%d", &point->sampletype);
            break;
        case 4:
            sscanf(token, "%d", &point->sampleset);
            break;
        case 5:
            sscanf(token, "%d", &point->volume);
            break;
        case 6:
            sscanf(token, "%d", &tmp);
            point->uninherited = tmp;
            break;
        case 7:
            sscanf(token, "%d", &tmp);
            point->kiai = tmp;
            break;
        default:
            fprintf(stderr, "Too many tokens in timing point (i=%d)..\n", i);
            exit(1);
        }
        ++i;
    }
}

void init_timing_point_list(timing_point_list_t *points) {
    points->size = 0;
    points->capacity = 40;
    points->list =
        (timing_point_t **)malloc(points->capacity * sizeof(timing_point_t *));
}

void add_timing_point(timing_point_list_t *points, timing_point_t *point) {
    points->list[points->size++] = point;
    if (points->size == points->capacity) {
        points->capacity *= 2;
        points->list = (timing_point_t **)realloc(
            points->list, points->capacity * sizeof(timing_point_t **));
    }
}

void free_timing_point_list(timing_point_list_t *points) {
    for (int i = 0, l = points->size; i < l; ++i) {
        free(points->list[i]);
    }
    free(points->list);
    free(points);
}