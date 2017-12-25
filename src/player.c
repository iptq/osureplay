#include "player.h"
#include "common.h"
#include "playfield.h"
#include "utils.h"

playfield_t *playfield;
uint64 timestart;

void frameupdate(int framecount) { printf("%lld\n", timestart); }

void framerender() {
    // todo
}

void player_main(playfield_t *playfield_, int argc, char **argv) {
    playfield = playfield_;
    glfwInit();
}