#include "hit_object.h"
#include <stdlib.h>

void init_hit_object_list(hit_object_list_t *hs) {
    hs->size = 0;
    hs->capacity = 40;
    hs->list = (hit_object_t **)malloc(hs->capacity * sizeof(hit_object_t *));
}

void add_hit_object(hit_object_list_t *hs, hit_object_t *h) {
    hs->list[hs->size++] = h;
    if (hs->size == hs->capacity) {
        hs->capacity *= 2;
        hs->list = (hit_object_t **)realloc(
            hs->list, hs->capacity * sizeof(hit_object_t **));
    }
}

void free_hit_object_list(hit_object_list_t *h) {
    for (int i = 0, l = h->size; i < l; ++i) {
        free(h->list[i]);
    }
    free(h->list);
    free(h);
}
