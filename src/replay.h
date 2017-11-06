#ifndef replay_h_
#define replay_h_

#include "common.h"

typedef struct replay_t {
    EGameMode game_mode;
    int game_version;
    char *beatmap_hash;
    char *username;
    char *replay_hash;
    short hit300;
    short hit100;
    short hit50;
    short gekis;
    short katus;
    short misses;
    int score;
    short maxCombo;
    bool fc;
    int mods;
    bool has_lifebar;
    char *lifebar;
} replay_t;

void parse_replay(replay_t *r, char *contents);
void free_replay(replay_t *r);

#endif