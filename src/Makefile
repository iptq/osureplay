SRCDIR = .
BUILDDIR = ../build
OBJDIR = $(BUILDDIR)/obj/src
EXEFILE = ../osureplay

SRCFILES = $(wildcard $(SRCDIR)/*.c)
OBJFILES = $(notdir $(patsubst %.c,%.o,$(SRCFILES)))

INCLUDEDIRS = -I../include -I../ext/nanovg/src -I/usr/local/lib/libzip/include
LIBDIRS = -L../ext/nanovg/src
LIBS = -lavcodec -lavformat -lavutil -lcrypto -lssl `pkg-config --static --libs libzip glfw3`

CC = gcc
CFLAGS = -g -Werror -Wall -Og -fdce -fdata-sections -ffunction-sections -std=c11 -Wno-error=maybe-uninitialized -c $(INCLUDEDIRS)

ifeq ($(PLAYER), 1)
	CFLAGS += -DGUI_PLAYER
endif

LDFLAGS = $(LIBDIRS)
LDLIBS = $(LIBS)

.PHONY: clean all lint $(OBJDIR)

all: $(EXEFILE)

$(addprefix $(OBJDIR)/, $(OBJFILES)): | $(OBJDIR)

$(OBJDIR) $(BUILDDIR):
	@mkdir -p $@

$(OBJDIR)/%.o: $(SRCDIR)/%.c
	$(call make-depend,$<,$@,$(subst .o,.d,$@))
	$(CC) $(CFLAGS) $(LDFLAGS) -c -o $@ $<

make-depend=$(CC) -MM -MF $3 -MP -MT $2 $(CFLAGS) $1

$(EXEFILE): $(addprefix $(OBJDIR)/, $(OBJFILES))
	$(CC) $(LDFLAGS) $(addprefix $(OBJDIR)/, $(OBJFILES)) -o $@ $(LDLIBS)

clean:
	rm -rf $(EXEFILE) $(BUILDDIR)
	rm -f *.o
