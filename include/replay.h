#ifndef replay_h_
#define replay_h_

#include <assert.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "common.h"

typedef struct replay {
    GameMode game_mode;
    int game_version;
    char *beatmap_hash;
    char *username;
    char *replay_hash;
    int16_t hit300;
    int16_t hit100;
    int16_t hit50;
    int16_t gekis;
    int16_t katus;
    int16_t misses;
    int score;
    int16_t maxcombo;
    bool fc;
    int mods;
    bool has_lifebar;
    char *lifebar;
} replay_t;

void parse_replay(replay_t *r, char *contents);
void free_replay(replay_t *r);

#endif