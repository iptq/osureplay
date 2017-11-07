#include "replay.h"
#include "common.h"
#include "reader.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

void parse_replay(replay_t *r, char *contents) {
    reader_t reader = {contents, 0, strlen(contents)};
    int length;

    r->game_mode = reader_read_byte(&reader);
    r->game_version = reader_read_int(&reader);
    assert(reader_read_byte(&reader) == 0x0b);
    length = reader_read_uleb32(&reader);
    r->beatmap_hash = reader_read_string(&reader, length);
    assert(reader_read_byte(&reader) == 0x0b);
    length = reader_read_uleb32(&reader);
    r->username = reader_read_string(&reader, length);
    assert(reader_read_byte(&reader) == 0x0b);
    length = reader_read_uleb32(&reader);
    r->replay_hash = reader_read_string(&reader, length);

    r->hit300 = reader_read_short(&reader);
    r->hit100 = reader_read_short(&reader);
    r->hit50 = reader_read_short(&reader);
    r->gekis = reader_read_short(&reader);
    r->katus = reader_read_short(&reader);
    r->misses = reader_read_short(&reader);
    r->score = reader_read_int(&reader);
    r->maxCombo = reader_read_short(&reader);
    r->fc = reader_read_byte(&reader);

    if (reader_read_byte(&reader)) {
        length = reader_read_uleb32(&reader);
        r->has_lifebar = true;
        r->lifebar = reader_read_string(&reader, length);
    }
    // fuck timestamp
    reader_read_int(&reader);
    reader_read_int(&reader);
    length = reader_read_int(&reader);
    char *compressed_movement_data = reader_read_string(&reader, length);
    free(compressed_movement_data);
}

void free_replay(replay_t *r) {
    free(r->beatmap_hash);
    free(r->username);
    free(r->replay_hash);
    if (r->has_lifebar)
        free(r->lifebar);
}