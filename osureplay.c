#include "playfield.h"
#include <dirent.h>
#include <libavcodec/avcodec.h>
#include <libavutil/frame.h>
#include <openssl/sha.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int checkexists(char *filename) { return access(filename, F_OK) != -1; }

void createifnotexists(char *dirname) {
    DIR *dummy;
    if ((dummy = opendir(dirname)) == NULL) {
        mkdir(dirname, 0700);
    } else {
        closedir(dummy);
    }
}

// https://stackoverflow.com/a/10324904
int hashfile(char *h, char *filename) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        fprintf(stderr, "Could not open file %s.\n", filename);
        return 0;
    }
    SHA256_CTX ctx;
    int bytes;
    unsigned char buf[1024];
    unsigned char c[SHA256_DIGEST_LENGTH];
    SHA256_Init(&ctx);
    while ((bytes = fread(buf, 1, 1024, fp)) != 0) {
        SHA256_Update(&ctx, buf, bytes);
    }
    SHA256_Final(c, &ctx);
    fclose(fp);
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i, h += 2)
        sprintf(h, "%02x", c[i]);
    return 1;
}

int main(int argc, char **argv) {
    // TODO: an actual argument parser
    if (argc < 4) {
        printf("Usage: %s [.osr] [.osz] [.mp4]\n", argv[0]);
        exit(1);
    }

    // check to make sure the files exist
    char *osrfilename = argv[1];
    if (!checkexists(osrfilename)) {
        fprintf(stderr, "Could not locate *.osr file.\n");
        exit(1);
    }
    char *oszfilename = argv[1];
    if (!checkexists(oszfilename)) {
        fprintf(stderr, "Could not locate *.osz file.\n");
        exit(1);
    }
    char *mp4filename = argv[2];
    // don't really care if this exists, overwrite if necessary

    // make sure base folder exists
    createifnotexists("maps");

    // create map folders
    char filehash[SHA256_DIGEST_LENGTH * 2];
    if (!hashfile(filehash, oszfilename)) {
        fprintf(stderr, "Could not determine hash of *.osz.\n");
    }
    char mapdir[5 + strlen(filehash)];
    strcat(mapdir, "maps/");
    strncat(mapdir, filehash, strlen(filehash));
    createifnotexists(mapdir);

    // making the dump directory

    // create a playfield object to hold gameplay vars
    playfield_t p = {60, 0, 1366, 768};

    // prepare video
    AVCodec *codec;
    AVCodecContext *ctx = NULL;
    AVFrame *picture;
    FILE *vidfile;

    codec = avcodec_find_encoder(AV_CODEC_ID_MPEG4);
    picture = av_frame_alloc();

    ctx->bit_rate = 400000;
    ctx->width = p.width;
    ctx->height = p.height;
    ctx->time_base = (AVRational){1, p.fps};

    if (avcodec_open2(ctx, codec, NULL) < 0) {
        fprintf(stderr, "Could not open codec.\n");
        exit(1);
    }

    vidfile = fopen(mp4filename, "wb");
    if (!vidfile) {
        fprintf(stderr, "Could not open output file for writing.\n");
        exit(1);
    }

    // begin encoding

    // close everything
    fclose(vidfile);
    avcodec_close(ctx);
    av_free(ctx);
    av_free(picture);

    return 0;
}