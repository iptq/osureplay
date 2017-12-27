#ifndef skin_h_
#define skin_h_

#include "SOIL.h"
#include <string.h>

#include "common.h"

typedef struct texture_t {
    const char *name;
    int handle;
    struct texture_t *next;
} texture_t;

typedef struct {
    int n_loaded;
    texture_t **textures;
} skin_t;

void free_skin(skin_t *skin);
void free_texture(texture_t *texture);
uint hash_string(const char *skin);
void load_skin(skin_t *skin, char *dirname);
void load_texture(texture_t *texture, char *filename);
void skin_add_texture(skin_t *skin, texture_t *texture);
int skin_get_texture(skin_t *skin, const char *name);

#endif