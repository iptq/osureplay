#ifndef color_h_
#define color_h_

// all the magic is defined here:
// https://en.wikipedia.org/wiki/YUV#Conversion_to.2Ffrom_RGB

typedef struct {
    double a;
    double r;
    double g;
    double b;
} rgb_t;

typedef struct {
    double y;
    double u;
    double v;
} yuv_t;

rgb_t yuvtorgb(yuv_t c);
yuv_t rgbtoyuv(rgb_t c);

#endif