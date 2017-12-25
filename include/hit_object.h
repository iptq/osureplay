#ifndef hit_object_h_
#define hit_object_h_

#include <stdlib.h>

#include "common.h"

typedef struct hit_object {

} hit_object_t;

typedef struct hit_object_list {
    int size;
    int capacity;
    hit_object_t **list;
} hit_object_list_t;

void init_hit_object_list(hit_object_list_t *hs);
void add_hit_object(hit_object_list_t *hs, hit_object_t *h);
void free_hit_object_list(hit_object_list_t *h);

#endif
