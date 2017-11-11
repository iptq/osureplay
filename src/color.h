#ifndef color_h_
#define color_h_

// all the magic is defined here:
// https://en.wikipedia.org/wiki/YUV#Conversion_to.2Ffrom_RGB

typedef struct rgb_t {
    double a;
    double r;
    double g;
    double b;
} rgb_t;

typedef struct yuv_t {
    double y;
    double u;
    double v;
} yuv_t;

rgb_t yuvtorgb(yuv_t c) {
    rgb_t r;
    r.r = c.y + 1.13983 * c.v;
    r.g = c.y - 0.39465 * c.u - 0.58060 * c.v;
    r.b = c.y + 2.03211 * c.u;
    return r;
}

yuv_t rgbtoyuv(rgb_t c) {
    yuv_t r;
    r.y = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    r.u = -0.14713 * c.r - 0.28886 * c.g + 0.436 * c.b;
    r.v = 0.615 * c.r - 0.51499 * c.g - 0.10001 * c.b;
    return r;
}

#endif