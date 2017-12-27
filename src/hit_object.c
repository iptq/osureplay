#include "hit_object.h"

void init_hit_object_list(hit_object_list_t *objects) {
    objects->size = 0;
    objects->capacity = 40;
    objects->list =
        (hit_object_t **)malloc(objects->capacity * sizeof(hit_object_t *));
}

void add_hit_object(hit_object_list_t *objects, hit_object_t *object) {
    objects->list[objects->size++] = object;
    if (objects->size == objects->capacity) {
        objects->capacity *= 2;
        objects->list = (hit_object_t **)realloc(
            objects->list, objects->capacity * sizeof(hit_object_t **));
    }
}

void free_hit_object_list(hit_object_list_t *objects) {
    for (int i = 0, l = objects->size; i < l; ++i) {
        free(objects->list[i]);
    }
    free(objects->list);
    free(objects);
}
