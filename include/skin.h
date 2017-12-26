#ifndef skin_h_
#define skin_h_

#include <stdlib.h>

#include "common.h"

typedef struct texture_t {
    char *name;
    int handle;
    struct texture_t *next;
} texture_t;

typedef struct {
    int n_loaded;
    texture_t **textures;
} skin_t;

void free_skin(skin_t *s);
void free_texture(texture_t *t);
uint hash_string(char *s);
void load_skin(skin_t *s, char *dirname);
void load_texture(texture_t *t, char *filename);
void skin_add_texture(skin_t *skin, texture_t *texture);

#endif