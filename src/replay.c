#include "replay.h"
#include "common.h"
#include "reader.h"

void parse_replay(replay_t *replay, char *contents) {
    reader_t reader = {contents, 0, strlen(contents)};
    int length;

    replay->game_mode = reader_read_byte(&reader);
    replay->game_version = reader_read_int(&reader);
    assert(reader_read_byte(&reader) == 0x0b);
    length = reader_read_uleb32(&reader);
    replay->beatmap_hash = reader_read_string(&reader, length);
    assert(reader_read_byte(&reader) == 0x0b);
    length = reader_read_uleb32(&reader);
    replay->username = reader_read_string(&reader, length);
    assert(reader_read_byte(&reader) == 0x0b);
    length = reader_read_uleb32(&reader);
    replay->replay_hash = reader_read_string(&reader, length);

    replay->hit300 = reader_read_short(&reader);
    replay->hit100 = reader_read_short(&reader);
    replay->hit50 = reader_read_short(&reader);
    replay->gekis = reader_read_short(&reader);
    replay->katus = reader_read_short(&reader);
    replay->misses = reader_read_short(&reader);
    replay->score = reader_read_int(&reader);
    replay->maxcombo = reader_read_short(&reader);
    replay->fc = reader_read_byte(&reader);

    if (reader_read_byte(&reader)) {
        length = reader_read_uleb32(&reader);
        replay->has_lifebar = true;
        replay->lifebar = reader_read_string(&reader, length);
    }
    // fuck timestamp
    reader_read_int(&reader);
    reader_read_int(&reader);
    length = reader_read_int(&reader);
    char *compressed_movement_data = reader_read_string(&reader, length);
    free(compressed_movement_data);
}

void free_replay(replay_t *replay) {
    free(replay->beatmap_hash);
    free(replay->username);
    free(replay->replay_hash);
    if (replay->has_lifebar)
        free(replay->lifebar);
    free(replay);
}