#ifndef reader_h_
#define reader_h_

#include "common.h"

typedef struct reader_t {
    char *blob;
    int pos;
} reader_t;

byte reader_read_byte(reader_t *r);
int reader_read_int(reader_t *r);
short reader_read_short(reader_t *r);
uint32 reader_read_uleb32(reader_t *r);
uint64 reader_read_uleb64(reader_t *r);
char *reader_read_string(reader_t *r, int length);

#endif