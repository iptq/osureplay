#include "skin.h"

static const char *required_textures[] = {
    "scorebar-bg", 0,
};

static const char *search_patterns[] = {
    "%s@2x.png", "%s.png", "%s@2x.jpg", "%s.jpg", 0,
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
    for (const char **name = required_textures; *name != 0; ++name) {
        printf("'%s'\n", *name);
        texture_t *t = (texture_t *)malloc(sizeof(texture_t));
        t->name = *name;

        char path[1024];
        for (const char **pattern = search_patterns; *pattern != 0; ++pattern) {
            char filename[1024];
            snprintf(filename, 1024, *pattern, *name);
            snprintf(path, 1024, "%s/%s", dirname, filename);
            // printf("checking '%s'\n", path);
            if (access(path, F_OK) != -1) {
                load_texture(t, path);
                break;
            }
        }
        skin_add_texture(s, t);
    }
    exit(1);  // not implemented
}

void load_texture(texture_t *t, char *filename) {
    printf("loading texture '%s' from '%s'\n", t->name, filename);
    int n = SOIL_load_OGL_texture(filename, SOIL_LOAD_AUTO, SOIL_CREATE_NEW_ID,
                                  SOIL_FLAG_MIPMAPS | SOIL_FLAG_INVERT_Y |
                                      SOIL_FLAG_NTSC_SAFE_RGB |
                                      SOIL_FLAG_COMPRESS_TO_DXT);
    printf("n = %d\n", n);
    if (0 == n) {
        printf("SOIL loading error: '%s'\n", SOIL_last_result());
    }
}

void skin_add_texture(skin_t *skin, texture_t *texture) {}