#include "player.h"
#include <GL/freeglut.h>
#include <GL/gl.h>

void player_main(playfield_t *playfield, int argc, char **argv) {
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE);
    glutInitWindowSize(playfield->width, playfield->height);
    glutCreateWindow("osu!replay");
    // glutDisplayFunc(drawTriangle);
    glutMainLoop();
}