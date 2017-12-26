#ifndef player_h_
#define player_h_

#define _BSD_SOURCE
#define NANOVG_GL3_IMPLEMENTATION

#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <unistd.h>

#include "common.h"
#include "playfield.h"

void player_main(playfield_t *playfield, int argc, char **argv);

#endif