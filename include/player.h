#ifndef player_h_
#define player_h_

#define _BSD_SOURCE

#include <GLFW/glfw3.h>
#include <stdio.h>
#include <unistd.h>

#include "playfield.h"

void player_main(playfield_t *playfield, int argc, char **argv);

#endif