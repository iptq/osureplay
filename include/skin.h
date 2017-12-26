#ifndef skin_h_
#define skin_h_

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
uint hash_string(char *s);
texture_t *load_texture(char *filename);
skin_t *load_skin(char *filename);
void skin_add_texture(skin_t *skin, char *name, texture_t *texture);

#endif