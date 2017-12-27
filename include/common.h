#ifndef common_h_
#define common_h_

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#define FRAMESPERSECOND 60
#define MAXCOMBOCOLORS 8
#define MAXTEXTURES 200
#define MILLION 1000000

#define UNUSED(x) (void)(x)

typedef unsigned char byte;
typedef unsigned int uint;
typedef long int int32;
typedef unsigned long int uint32;
typedef long long int int64;
typedef unsigned long long int uint64;

typedef enum {
    STANDARD = 0,
    TAIKO = 1,
    CATCH = 2,
    MANIA = 3,
} GameMode;

#endif