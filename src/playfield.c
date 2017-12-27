#include "playfield.h"
#include "beatmap.h"
#include "replay.h"

void draw_playfield(playfield_t *playfield) {
    glClear(GL_COLOR_BUFFER_BIT);
    glDisable(GL_DEPTH_TEST);
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    glOrtho(0, playfield->width, playfield->height, 0, 0, 1);
    glMatrixMode(GL_MODELVIEW);

    glBegin(GL_LINE_LOOP);
    glColor3f(0.5, 0.5, 1);
    for (double i = 0; i < 2 * M_PI; i = i + ((2 * M_PI) / 128)) {
        glVertex2f(50 + 20 * cos(i), 50 + 20 * sin(i));
    }
    glEnd();
}

void playfield_load_assets(playfield_t *playfield) {
    // load audio file
}

void render_playfield(playfield_t *playfield) {}

void free_playfield(playfield_t *playfield) {
    free_beatmap(playfield->beatmap);
    free_replay(playfield->replay);
    free_skin(playfield->skin);
    free(playfield);
}
