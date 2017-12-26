#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <openssl/md5.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

#include "beatmap.h"
#include "player.h"
#include "playfield.h"
#include "renderer.h"
#include "replay.h"
#include "skin.h"
#include "utils.h"

int main(int argc, char **argv) {
    beatmap_t *beatmap;
    playfield_t *playfield;
    replay_t *replay;
    skin_t *skin;

    // TODO: an actual argument parser
    if (argc < 4) {
        fprintf(stderr, "Usage: %s [.osr] [.osz] [.mp4]\n", argv[0]);
        exit(1);
    }

    playfield = (playfield_t *)malloc(sizeof(playfield_t));
    playfield->width = 1366;
    playfield->height = 768;
    playfield->fps = 30;
    playfield->tick = 0;

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
    playfield->mp3_length = getmp3length(mp3filename);

#ifdef GUI_PLAYER
    UNUSED(mp4filename);
    player_main(playfield, argc, argv);
#else
    renderer_main(playfield, mp4filename);
#endif

    free_playfield(playfield);

    return 0;
}
