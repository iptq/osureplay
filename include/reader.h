#ifndef reader_h_
#define reader_h_

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#include "common.h"

typedef struct {
    char *blob;
    int pos;
    int len;
} reader_t;

byte reader_read_byte(reader_t *reader);
int reader_read_int(reader_t *reader);
short reader_read_short(reader_t *reader);
uint32 reader_read_uleb32(reader_t *reader);
uint64 reader_read_uleb64(reader_t *reader);
char *reader_read_string(reader_t *reader, int length);
char *reader_read_line(reader_t *reader);

#endif