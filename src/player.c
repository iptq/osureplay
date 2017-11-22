#include "player.h"
#include "playfield.h"
#include <GL/freeglut.h>
#include <GL/gl.h>
#include <stdio.h>
#include <time.h>

playfield_t *playfield;
time_t timestart;

void frameupdate(int framecount) {
    time_t timenow = time(NULL), elapsed = timenow - timestart;
    printf("%ld\n", elapsed);
    glutTimerFunc(1000 / playfield->fps, frameupdate, framecount + 1);
}

void framerender() {
    // todo
}

void player_main(playfield_t *playfield_, int argc, char **argv) {
    playfield = playfield_;

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE);
    glutInitWindowSize(playfield->width, playfield->height);
    glutCreateWindow("osu!replay");

    glutDisplayFunc(framerender);
    glutTimerFunc(1000 / playfield->fps, frameupdate, 0);

    timestart = time(NULL);
    glutMainLoop();
}