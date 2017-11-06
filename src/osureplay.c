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
    playfield_t p = {45, 0, 1366, 768};

    // prepare video
    AVCodec *codec;
    AVCodecContext *ctx = NULL;
    AVFrame *picture;
    AVPacket pkt;
    FILE *vidfile;
    int outbuf_size, size, ret, got_output;
    uint8_t *outbuf, *picture_buf;

    codec = avcodec_find_encoder(AV_CODEC_ID_MPEG4);
    picture = av_frame_alloc();

    ctx = avcodec_alloc_context3(codec);
    ctx->bit_rate = 400000;
    ctx->width = p.width;
    ctx->height = p.height;
    ctx->time_base = (AVRational){1, p.fps};
    ctx->pix_fmt = PIX_FMT_YUV420P9;

    if (avcodec_open2(ctx, codec, NULL) < 0) {
        fprintf(stderr, "Could not open codec.\n");
        exit(1);
    }

    vidfile = fopen(mp4filename, "wb");
    if (!vidfile) {
        fprintf(stderr, "Could not open output file for writing.\n");
        exit(1);
    }

    outbuf_size = 100000;
    outbuf = malloc(outbuf_size);
    size = ctx->width * ctx->height;
    picture_buf = malloc((size * 3) / 2);

    // begin encoding
    for (int i = 0; i < 100; ++i) {
        av_init_packet(&pkt);
        pkt.data = NULL;
        pkt.size = 0;

        fflush(stdout);
        ret = avcodec_encode_video2(ctx, &pkt, picture, &got_output);
        if (ret < 0) {
            fprintf(stderr, "Error encoding frame.\n");
            exit(1);
        }
        if (got_output) {
            printf("Write frame %3d (size=%5d)\n", i, pkt.size);
            fwrite(pkt.data, 1, pkt.size, vidfile);
            av_free_packet(&pkt);
        }
    }

    // close everything
    outbuf[0] = 0x00;
    outbuf[1] = 0x00;
    outbuf[2] = 0x01;
    outbuf[3] = 0xb7;
    fwrite(outbuf, 1, 4, vidfile);

    fclose(vidfile);
    free(picture_buf);
    free(outbuf);
    avcodec_close(ctx);
    av_free(ctx);
    av_free(picture);

    return 0;
}