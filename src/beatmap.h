#ifndef beatmap_h_
#define beatmap_h_

typedef struct beatmap_t { char *audio_filename; } beatmap_t;

void parse_beatmap(beatmap_t *b, char *contents);
void free_beatmap(beatmap_t *b);

#endif