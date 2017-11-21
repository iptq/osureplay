#include "beatmap.h"
#include "playfield.h"
#include "replay.h"
#include "utils.h"
#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>
#include <openssl/md5.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int checkexists(char *filename);
uint getmp3length(char *filename);

int main(int argc, char **argv) {
    beatmap_t *beatmap;
    playfield_t *playfield;
    replay_t *replay;

    av_register_all();
    avcodec_register_all();

    // TODO: an actual argument parser
    if (argc < 4) {
        fprintf(stderr, "Usage: %s [.osr] [.osz] [.mp4]\n", argv[0]);
        exit(1);
    }

    playfield = (playfield_t *)malloc(sizeof(playfield_t));
    playfield->width = 1366;
    playfield->height = 768;
    playfield->fps = 30;
    playfield->surface = cairo_image_surface_create(
        CAIRO_FORMAT_ARGB32, playfield->width, playfield->height);
    playfield->cr = cairo_create(playfield->surface);

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

    // read and parse replay file
    replay = (replay_t *)malloc(sizeof(replay_t));
    FILE *fp = fopen(osrfilename, "rb");
    int osrsize, result;
    char *osrbuf;

    fseek(fp, 0, SEEK_END);
    osrsize = ftell(fp);
    rewind(fp);

    osrbuf = (char *)malloc(sizeof(char) * (osrsize + 1));
    if (osrbuf == NULL) {
        fprintf(stderr,
                "Could not allocate enough memory for the replay file.\n");
        exit(1);
    }
    result = fread(osrbuf, 1, osrsize, fp);
    if (result != osrsize) {
        fprintf(stderr, "Could not read the entire replay file.\n");
        exit(1);
    }
    fclose(fp);
    osrbuf[osrsize] = '\0';
    parse_replay(replay, osrbuf);
    free(osrbuf);
    playfield->replay = replay;

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
    sprintf(oszdir, "%s/files", mapdir);
    safemkdir(oszdir);

    // extract files from osz
    // https://gist.github.com/mobius/1759816
    // TODO: beatmap names larger than 1024
    char *beatmapfilename =
        extractandfind(oszfilename, oszdir, replay->beatmap_hash);
    if (beatmapfilename == NULL) {
        fprintf(stderr, "None of the maps in this set match the replay.\n");
        exit(1);
    }

    // read and parse the beatmap file
    beatmap = (beatmap_t *)malloc(sizeof(beatmap_t));
    fp = fopen(beatmapfilename, "rb");
    free(beatmapfilename);
    int mapsize;
    char *mapbuf;

    fseek(fp, 0, SEEK_END);
    mapsize = ftell(fp);
    rewind(fp);

    mapbuf = (char *)malloc(sizeof(char) * mapsize);
    if (mapbuf == NULL) {
        fprintf(stderr,
                "Could not allocate enough memory for the replay file.\n");
        exit(1);
    }
    result = fread(mapbuf, 1, mapsize, fp);
    if (result != mapsize) {
        fprintf(stderr, "Could not read the entire replay file.\n");
        exit(1);
    }
    fclose(fp);
    mapbuf[mapsize] = '\0';
    parse_beatmap(beatmap, mapbuf);
    free(mapbuf);
    playfield->beatmap = beatmap;

    char mp3filename[1024];
    sprintf(mp3filename, "%s/%s", oszdir, beatmap->audiofilename);
    uint mp3length_usec = getmp3length(mp3filename);
    uint nframes = playfield->fps * mp3length_usec / 1000000;

    // prepare video
    AVCodec *codec;
    AVCodecContext *ctx = NULL;
    AVFrame *picture;
    AVPacket pkt;
    FILE *vidfile;
    int outbuf_size, size, ret, got_output;
    uint8_t *outbuf, *picture_buf;

    playfield->tick = 0;

    codec = avcodec_find_encoder(AV_CODEC_ID_MPEG1VIDEO);
    ctx = avcodec_alloc_context3(codec);
    ctx->bit_rate = 400000;
    ctx->width = playfield->width;
    ctx->height = playfield->height;
    ctx->time_base = (AVRational){1, playfield->fps};
    ctx->gop_size = 0;
    ctx->max_b_frames = 1;
    ctx->pix_fmt = PIX_FMT_YUV420P;

    picture = av_frame_alloc();
    if (!picture) {
        fprintf(stderr, "Could not allocate the frame.\n");
        exit(1);
    }
    picture->format = ctx->pix_fmt;
    picture->width = playfield->width;
    picture->height = playfield->height;

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

    ret = av_image_alloc(picture->data, picture->linesize, ctx->width,
                         ctx->height, ctx->pix_fmt, 32);
    if (ret < 0) {
        fprintf(stderr, "Could not allocate raw picture buffer.\n");
        exit(1);
    }
    avcodec_align_dimensions2(ctx, &ctx->width, &ctx->height,
                              &picture->linesize[0]);

    // begin encoding
    int width = ctx->width, height = ctx->height, x, y;

    // DEBUG
    if (nframes > 500)
        nframes = 500;
    for (int i = 0; i < nframes; ++i) {
        av_init_packet(&pkt);
        pkt.data = NULL;
        pkt.size = 0;

        fflush(stdout);
        /* prepare a dummy image */
        /* Y */
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                picture->data[0][y * picture->linesize[0] + x] = x + y + i * 3;
            }
        }

        /* Cb and Cr */
        for (y = 0; y < height / 2; y++) {
            for (x = 0; x < width / 2; x++) {
                picture->data[1][y * picture->linesize[1] + x] =
                    128 + y + i * 2;
                picture->data[2][y * picture->linesize[2] + x] = 64 + x + i * 5;
            }
        }
        picture->pts = i;

        ret = avcodec_encode_video2(ctx, &pkt, picture, &got_output);
        if (ret < 0) {
            fprintf(stderr, "Error encoding frame.\n");
            exit(1);
        }
        if (got_output) {
            printf("Write frame %3d (size=%5d)\r", i, pkt.size);
            fwrite(pkt.data, 1, pkt.size, vidfile);
            av_free_packet(&pkt);
        }
    }
    printf("\033[KDone!\n");

    // end the mpg file
    outbuf[0] = 0x00;
    outbuf[1] = 0x00;
    outbuf[2] = 0x01;
    outbuf[3] = 0xb7;
    fwrite(outbuf, 1, 4, vidfile);

    // close everything
    fclose(vidfile);
    free(picture_buf);
    free(outbuf);
    avcodec_close(ctx);
    av_free(ctx);
    av_free(picture);

    free_playfield(playfield);

    return 0;
}

int checkexists(char *filename) { return access(filename, F_OK) != -1; }

// https://stackoverflow.com/a/6452150
uint getmp3length(char *filename) {
    AVFormatContext *fctx = avformat_alloc_context();
    avformat_open_input(&fctx, filename, NULL, NULL);
    avformat_find_stream_info(fctx, NULL);
    int duration = fctx->duration;
    avformat_close_input(&fctx);
    avformat_free_context(fctx);
    return duration;
}
