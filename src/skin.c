#include "skin.h"

static char *required_textures[] = {
    "scorebar-bg", 0,
};

void free_skin(skin_t *s) {
    for (int i = 0; i < s->n_loaded; ++i) {
        free_texture(s->textures[i]);
    }
    free(s);
}

void free_texture(texture_t *t) { free(t); }

uint hash_string(char *s) {
    uint h = 0;
    for (char *p = s; *p != '\0'; ++p)
        h = *s + 31 * h;
    return h % 211;
}

void load_skin(skin_t *s, char *dirname) {
    s->n_loaded = 0;
    for (char **name = required_textures; *name != 0; ++name) {
        printf("'%s'\n", *name);
        texture_t *t = (texture_t *)malloc(sizeof(texture_t));
        t->name = *name;

        char filename[1024];
        snprintf(filename, 1024, "%s/%s", dirname);
        load_texture(t, filename);
        skin_add_texture(s, t);
    }
    exit(1);  // not implemented
}

void load_texture(texture_t *t, char *filename) {}

void skin_add_texture(skin_t *skin, texture_t *texture) {}