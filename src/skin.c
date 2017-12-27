#include "skin.h"

static const char *required_textures[] = {
    "hitcircle", "scorebar-bg", 0,
};

static const char *search_patterns[] = {
    "%s@2x.png", "%s.png", "%s@2x.jpg", "%s.jpg", 0,
};

void free_skin(skin_t *skin) {
    for (int i = 0; i < skin->n_loaded; ++i) {
        free_texture(skin->textures[i]);
    }
    free(skin->textures);
    free(skin);
}

void free_texture(texture_t *texture) { free(texture); }

uint hash_string(const char *string) {
    uint h = 0;
    for (const char *p = string; *p != '\0'; ++p)
        h = *p + 31 * h;
    return h % MAXTEXTURES;
}

void load_skin(skin_t *skin, char *dirname) {
    skin->n_loaded = 0;
    skin->textures = (texture_t **)calloc(MAXTEXTURES, sizeof(texture_t *));

    for (const char **name = required_textures; *name != 0; ++name) {
        printf("'%s'\n", *name);
        texture_t *texture = (texture_t *)malloc(sizeof(texture_t));
        texture->name = *name;
        texture->next = NULL;

        char path[1024];
        for (const char **pattern = search_patterns; *pattern != 0; ++pattern) {
            char filename[1024];
            snprintf(filename, 1024, *pattern, *name);
            snprintf(path, 1024, "%s/%s", dirname, filename);
            // printf("checking '%s'\n", path);
            if (access(path, F_OK) != -1) {
                load_texture(texture, path);
                break;
            }
        }
        skin_add_texture(skin, texture);
    }

    for (const char **name = required_textures; *name != 0; ++name) {
        int handle = skin_get_texture(skin, *name);
        printf("handle for '%s' is '%d'\n", *name, handle);
    }
    exit(1);  // not implemented
}

void load_texture(texture_t *texture, char *filename) {
    printf("loading texture '%s' from '%s'\n", texture->name, filename);
    int handle = SOIL_load_OGL_texture(
        filename, SOIL_LOAD_AUTO, SOIL_CREATE_NEW_ID,
        SOIL_FLAG_MIPMAPS | SOIL_FLAG_INVERT_Y | SOIL_FLAG_NTSC_SAFE_RGB |
            SOIL_FLAG_COMPRESS_TO_DXT);
    if (!handle) {
        fprintf(stderr, "SOIL loading error: '%s'\n", SOIL_last_result());
        exit(1);
    }
    texture->handle = handle;
}

void skin_add_texture(skin_t *skin, texture_t *texture) {
    texture_t *cand;
    int hash = hash_string(texture->name);

    cand = skin->textures[hash];
    if (!cand) {
        skin->textures[hash] = texture;
        return;
    }

    while (cand->next != NULL)
        cand = cand->next;
    cand->next = texture;
}

int skin_get_texture(skin_t *skin, const char *name) {
    texture_t *cand;
    int hash = hash_string(name);

    cand = skin->textures[hash];
    while (cand != NULL && strcmp(name, cand->name))
        cand = cand->next;

    if (cand == NULL)
        return -1;
    return cand->handle;
}