#include "player.h"
#include "common.h"
#include "playfield.h"
#include "utils.h"
#include <GL/freeglut.h>
#include <GL/gl.h>
#include <stdio.h>

playfield_t *playfield;
uint64 timestart;

void frameupdate(int framecount) {
    printf("%lld\n", timestart);
    glutTimerFunc(1000 / playfield->fps, frameupdate, framecount + 1);
}

void framerender() {
    // todo
}

void player_main(playfield_t *playfield_, int argc, char **argv) {
    playfield = playfield_;

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE);
    glutInitWindowSize(playfield->width, playfield->height);
    glutCreateWindow("osu!replay");

    glutDisplayFunc(framerender);
    glutTimerFunc(1000 / playfield->fps, frameupdate, 0);

    timestart = curtime();
    glutMainLoop();
}