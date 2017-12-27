#define NANOVG_GL3_IMPLEMENTATION
#define GLFW_INCLUDE_GLEXT

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
    NVGcontext *ctx;

    playfield = playfield_;
    glfwSetErrorCallback(error_callback);

    if (!glfwInit()) {
        fprintf(stderr, "Failed to initialize GLFW.\n");
        exit(1);
    }

    GLFWwindow *window;
    if (!(window = glfwCreateWindow(playfield->width, playfield->height,
                                    "osu!replay", NULL, NULL))) {
        fprintf(stderr, "Failed to create window.\n");
        exit(1);
    }

    ctx = nvgCreateGL3(NVG_ANTIALIAS | NVG_STENCIL_STROKES | NVG_DEBUG);

    uint64 start_time = curtime();
    int sleep_by = MILLION / FRAMESPERSECOND;

    glfwMakeContextCurrent(window);
    load_skin(ctx, playfield->skin, "skin");

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