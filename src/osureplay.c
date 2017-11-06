#include "beatmap.h"
#include "playfield.h"
#include <dirent.h>
#include <fcntl.h>
#include <libavcodec/avcodec.h>
#include <libavutil/frame.h>
#include <openssl/md5.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#include <zip.h>

int checkexists(char *filename) { return access(filename, F_OK) != -1; }

static void safemkdir(const char *dir) {
    mkdir(dir, 0700);
    // if (mkdir(dir, 0700) < 0 && errno != EEXIST) {
    //     perror(dir);
    //     exit(1);
    // }
}

// https://stackoverflow.com/a/10324904
int hashfile(char *h, char *filename) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        fprintf(stderr, "Could not open file %s.\n", filename);
        return 0;
    }
    MD5_CTX ctx;
    int bytes;
    unsigned char buf[1024];
    unsigned char c[MD5_DIGEST_LENGTH];
    MD5_Init(&ctx);
    while ((bytes = fread(buf, 1, 1024, fp)) != 0) {
        MD5_Update(&ctx, buf, bytes);
    }
    MD5_Final(c, &ctx);
    fclose(fp);
    char *p = h;
    for (int i = 0; i < MD5_DIGEST_LENGTH; ++i, p += 2)
        sprintf(p, "%02x", c[i]);
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
    char *oszfilename = argv[2];
    if (!checkexists(oszfilename)) {
        fprintf(stderr, "Could not locate *.osz file.\n");
        exit(1);
    }
    char *mp4filename = argv[3];
    // don't really care if this exists, overwrite if necessary

    // make sure base folder exists
    safemkdir("maps");

    // create map folders
    char filehash[MD5_DIGEST_LENGTH * 2];
    if (!hashfile(filehash, oszfilename)) {
        fprintf(stderr, "Could not determine hash of *.osz.\n");
    }
    char mapdir[5 + strlen(filehash)];
    strcpy(mapdir, "maps/");
    strncat(mapdir, filehash, strlen(filehash));
    safemkdir(mapdir);

    // making the dump directory
    char oszdir[strlen(mapdir) + 6];
    strncpy(oszdir, mapdir, strlen(mapdir));
    strcat(oszdir, "/files");
    safemkdir(oszdir);

    // extract files from osz
    // https://gist.github.com/mobius/1759816
    struct zip *za;
    struct zip_file *zf;
    struct zip_stat sb;
    int err, len, fd, sum;
    char errbuf[100], zipbuf[100], fullname[1024];
    if ((za = zip_open(oszfilename, 0, &err)) == NULL) {
        zip_error_to_str(errbuf, sizeof(errbuf), err, errno);
        fprintf(stderr, "Cannot open zip file '%s': %s\n", oszfilename, errbuf);
        exit(1);
    }
    for (int i = 0, l = zip_get_num_entries(za, ZIP_FL_UNCHANGED); i < l; ++i) {
        if (zip_stat_index(za, i, 0, &sb) == 0) {
            len = strlen(sb.name);
            if (sb.name[len - 1] == '/') {
                safemkdir(sb.name);
            } else {
                zf = zip_fopen_index(za, i, 0);
                if (!zf) {
                    fprintf(stderr, "Error opening '%s' from zip archive.\n",
                            sb.name);
                    exit(1);
                }
                fullname[0] = '\0';
                strncat(fullname, oszdir, strlen(oszdir));
                strcat(fullname, "/");
                strncat(fullname, sb.name, len);
                fd = open(fullname, O_RDWR | O_TRUNC | O_CREAT, 0644);
                if (fd < 0) {
                    fprintf(stderr, "Invalid file descriptor for '%s'\n",
                            sb.name);
                    exit(1);
                }
                sum = 0;
                while (sum != sb.size) {
                    len = zip_fread(zf, zipbuf, 100);
                    if (len < 0) {
                        fprintf(stderr, "the fuck?\n");
                        exit(1);
                    }
                    ssize_t b = write(fd, zipbuf, len);
                    if (b < 0) {
                        fprintf(stderr, "the fuck?\n");
                        exit(1);
                    }
                    sum += len;
                }
                close(fd);
                zip_fclose(zf);
            }
        }
    }
    if (zip_close(za) == -1) {
        fprintf(stderr, "Can't close the osz.\n");
        exit(1);
    }

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