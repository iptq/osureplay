CC=gcc

CAIRO_FLAGS=-lcairo
FFMPEG_FLAGS=-lavcodec -lavformat -lavutil
LIBZIP_FLAGS=-lzip
OPENSSL_FLAGS=-lssl -lcrypto
LIB_FLAGS=$(CAIRO_FLAGS) $(FFMPEG_FLAGS) $(OPENSSL_FLAGS) $(LIBZIP_FLAGS)
CFLAGS=-g -Wall -Os -fdce -fdata-sections -ffunction-sections

.PHONY: clean

all: osureplay.o playfield.o
	$(CC) $(CFLAGS) -o osureplay $< $(LIB_FLAGS)

osureplay.o: osureplay.c
	$(CC) $(CFLAGS) -c $<

playfield.o: playfield.c
	$(CC) $(CFLAGS) -c $<

clean:
	rm -rf osureplay *.o
