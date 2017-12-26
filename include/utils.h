#ifndef utils_h_
#define utils_h_

#include <errno.h>
#include <libavformat/avformat.h>
#include <openssl/md5.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <unistd.h>
#include <zip.h>

#include "common.h"

int checkexists(char *filename);
uint64 curtime();
char *extractandfind(char *srcfile, char *destdir, char *maphash);
uint getmp3length(char *filename);
int hashfile(char *h, char *filename);
void safemkdir(const char *dir);

#endif