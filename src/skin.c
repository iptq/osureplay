#include "skin.h"

void free_skin(skin_t *s) {
    for (int i = 0; i < s->n_loaded; ++i) {
        free_texture(s->textures[i]);
    }
    free(s);
}

uint hash_string(char *s) {
    uint h = 0;
    for (char *p = s; *p != '\0'; ++p)
        h = *s + 31 * h;
    return h;
}

skin_t *load_skin(char *filename) {}

void skin_add_texture(skin_t *skin, char *name, texture_t *texture) {}