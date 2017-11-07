#include "reader.h"
#include <stdlib.h>
#include <string.h>

byte reader_read_byte(reader_t *r) { return r->blob[r->pos++]; }

int reader_read_int(reader_t *r) {
    int x;
    memcpy(&x, &r->blob[r->pos], sizeof(int));
    r->pos += sizeof(int);
    return x;
}

short reader_read_short(reader_t *r) {
    short x;
    memcpy(&x, &r->blob[r->pos], sizeof(short));
    r->pos += sizeof(short);
    return x;
}

uint32 reader_read_uleb32(reader_t *r) {
    uint32 x = 0;
    int i = 0;
    char c;
    while (((c = reader_read_byte(r)) & 0x80) == 0x80) {
        x = x | ((c & 0x7f) << (i++ * 7));
    }
    x = x | ((c & 0x7f) << (i++ * 7));
    return x;
}

uint64 reader_read_uleb64(reader_t *r) {
    uint32 x = 0;
    int i = 0;
    char c;
    while (((c = reader_read_byte(r)) & 0x80) == 0x80) {
        x = x | ((c & 0x7f) << (i++ * 7));
    }
    x = x | ((c & 0x7f) << (i++ * 7));
    return x;
}

char *reader_read_string(reader_t *r, int length) {
    char *x = (char *)malloc((length + 1) * sizeof(char));
    int clength = length * sizeof(char);
    strncpy(x, &r->blob[r->pos], clength);
    x[clength] = '\0';
    r->pos += clength;
    return x;
}

char *reader_read_line(reader_t *r) {
    if (r->pos >= r->len)
        return NULL;
    int end = r->pos;
    while (end < r->len && r->blob[end] != '\n') {
        ++end;
    }
    int length = end - r->pos;
    if (r->blob[end - 1] == '\x0d') // thanks windows
        length -= 1;
    char *result = (char *)malloc(sizeof(char) * (length + 1));
    strncpy(result, &r->blob[r->pos], length);
    result[length] = '\0';
    r->pos = end + 1;
    return result;
}