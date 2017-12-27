#ifndef hit_object_h_
#define hit_object_h_

#include <stdlib.h>

#include "common.h"

typedef struct {

} hit_object_t;

typedef struct {
    int size;
    int capacity;
    hit_object_t **list;
} hit_object_list_t;

void init_hit_object_list(hit_object_list_t *objects);
void add_hit_object(hit_object_list_t *objects, hit_object_t *object);
void free_hit_object_list(hit_object_list_t *object);

#endif
