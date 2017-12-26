#include "utils.h"
#include "common.h"

int checkexists(char *filename) { return access(filename, F_OK) != -1; }

uint64 curtime() {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (tv.tv_sec * 1000) + (tv.tv_usec / 1000);
}

char *extractandfind(char *srcfile, char *destdir, char *maphash) {
    char errbuf[100], zipbuf[100], fullname[1024], *beatmapfilename;
    FILE *fp;
    struct zip *za;
    struct zip_file *zf;
    struct zip_stat sb;
    int err, len, sum;
    bool found = false;
    size_t bytes_read;

    if ((za = zip_open(srcfile, 0, &err)) == NULL) {
        zip_error_to_str(errbuf, sizeof(errbuf), err, errno);
        fprintf(stderr, "Cannot open zip file '%s': %s\n", srcfile, errbuf);
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
                sprintf(fullname, "%s/%s", destdir, sb.name);
                fp = fopen(fullname, "w");
                if (fp == NULL) {
                    fprintf(stderr, "Could not open file '%s' (err: %s)\n",
                            sb.name, strerror(errno));
                    exit(1);
                }
                sum = 0;
                while (sum != sb.size) {
                    len = zip_fread(zf, zipbuf, 100);
                    if (len < 0) {
                        fprintf(stderr, "the fuck?\n");
                        exit(1);
                    }
                    bytes_read = fwrite(zipbuf, len, 1, fp);
                    if (bytes_read < 0) {
                        fprintf(stderr, "the fuck?\n");
                        exit(1);
                    }
                    sum += len;
                }
                fclose(fp);
                char checksum[MD5_DIGEST_LENGTH * 2];
                hashfile(checksum, fullname);
                zip_fclose(zf);

                // read file again if it matches
                if (!strcmp(checksum, maphash)) {
                    found = true;
                    beatmapfilename =
                        (char *)malloc(sizeof(char) * (strlen(fullname) + 1));
                    strncpy(beatmapfilename, fullname, strlen(fullname));
                }
            }
        }
    }
    if (zip_close(za) == -1) {
        fprintf(stderr, "Can't close the osz.\n");
        exit(1);
    }
    if (!found) {
        return NULL;
    }
    return beatmapfilename;
}

// https://stackoverflow.com/a/6452150
uint getmp3length(char *filename) {
    av_register_all();

    AVFormatContext *fctx = avformat_alloc_context();
    avformat_open_input(&fctx, filename, NULL, NULL);
    avformat_find_stream_info(fctx, NULL);
    int64_t duration = fctx->duration;
    avformat_close_input(&fctx);
    avformat_free_context(fctx);
    return duration / 1000;
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

void safemkdir(const char *dir) {
    if (mkdir(dir, 0700)) {
        if (errno != EEXIST) {
            fprintf(stderr, "Error creating directory '%s' (err: %s)\n", dir,
                    strerror(errno));
            exit(1);
        }
    }
}