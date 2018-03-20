#include <stdio.h>

#include <string>

#include "player.hpp"

int main(int argc, char **argv) {
    osureplay::Player player;

    // check args
    if (argc < 4) {
        printf("Usage: %s [osr] [osz] [output]", argv[0]);
        return 1;
    }

    // get the necessary components
    std::string replay_file(argv[1]);
    player.LoadReplay(replay_file);

    return 0;
}