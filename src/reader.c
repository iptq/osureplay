#include "reader.h"

byte reader_read_byte(reader_t *reader) { return reader->blob[reader->pos++]; }

int reader_read_int(reader_t *reader) {
    int x;
    memcpy(&x, &reader->blob[reader->pos], sizeof(int));
    reader->pos += sizeof(int);
    return x;
}

int16_t reader_read_short(reader_t *reader) {
    int16_t x;
    memcpy(&x, &reader->blob[reader->pos], sizeof(short));
    reader->pos += sizeof(short);
    return x;
}

uint32 reader_read_uleb32(reader_t *reader) {
    uint32 x = 0;
    int i = 0;
    char c;
    while (((c = reader_read_byte(reader)) & 0x80) == 0x80) {
        x = x | ((c & 0x7f) << (i++ * 7));
    }
    x = x | ((c & 0x7f) << (i++ * 7));
    return x;
}

uint64 reader_read_uleb64(reader_t *reader) {
    uint32 x = 0;
    int i = 0;
    char c;
    while (((c = reader_read_byte(reader)) & 0x80) == 0x80) {
        x = x | ((c & 0x7f) << (i++ * 7));
    }
    x = x | ((c & 0x7f) << (i++ * 7));
    return x;
}

char *reader_read_string(reader_t *reader, int length) {
    char *x = (char *)malloc((length + 1) * sizeof(char));
    int clength = length * sizeof(char);
    strncpy(x, &reader->blob[reader->pos], clength);
    x[clength] = '\0';
    reader->pos += clength;
    return x;
}

char *reader_read_line(reader_t *reader) {
    if (reader->pos >= reader->len)
        return NULL;
    int end = reader->pos;
    while (end < reader->len && reader->blob[end] != '\n') {
        ++end;
    }
    int length = end - reader->pos;
    if (reader->blob[end - 1] == '\x0d')  // thanks windows
        length -= 1;
    char *result = (char *)malloc(sizeof(char) * (length + 1));
    strncpy(result, &reader->blob[reader->pos], length);
    result[length] = '\0';
    reader->pos = end + 1;
    return result;
}