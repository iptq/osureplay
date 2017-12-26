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

void error_callback(int error, const char *description) {
    printf("ERROR: %s\n", description);
}

void player_main(playfield_t *playfield_, int argc, char **argv) {
    playfield = playfield_;
    glfwSetErrorCallback(error_callback);

    if (!glfwInit()) {
        fprintf(stderr, "Failed to initialize GLFW.\n");
        exit(1);
    }

    GLFWwindow *window;
    if (!(window = glfwCreateWindow(1024, 768, "osu!replay", NULL, NULL))) {
    }

    uint64 start_time = curtime();
    int sleep_by = 1000000 / FRAMESPERSECOND;

    while (!glfwWindowShouldClose(window)) {
        uint64 now_time = curtime(), elapsed_time = now_time - start_time;
        printf("mseconds : %llu\n", elapsed_time);

        if (elapsed_time > playfield->mp3_length)
            break;

        draw_playfield(playfield);

        glfwSwapBuffers(window);
        glfwPollEvents();
        usleep(sleep_by);
    }

    glfwDestroyWindow(window);
    glfwTerminate();
}