#include "renderer.h"
#include "playfield.h"
#include "utils.h"
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>

void renderer_main(playfield_t *playfield, char *mp4filename) {
    av_register_all();
    avcodec_register_all();

    // prepare video
    uint nframes;
    AVCodec *codec;
    AVCodecContext *ctx = NULL;
    AVFrame *picture;
    AVPacket pkt;
    FILE *vidfile;
    int outbuf_size, size, ret, got_output;
    uint8_t *outbuf, *picture_buf;

    nframes = playfield->fps * playfield->mp3_length / 1000000;

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
}