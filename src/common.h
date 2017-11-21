#ifndef common_h_
#define common_h_

#include <stdbool.h>

#define MAXCOMBOCOLORS 8

typedef unsigned char byte;
typedef unsigned int uint;
typedef long int int32;
typedef unsigned long int uint32;
typedef long long int int64;
typedef unsigned long long int uint64;

typedef enum GameMode {
    STANDARD = 0,
    TAIKO = 1,
    CATCH = 2,
    MANIA = 3
} GameMode;

#endif