SRCDIR = src
BUILDDIR = buildma
OBJDIR = $(BUILDDIR)/obj/src
EXEFILE = osureplay

SRCFILES = $(wildcard $(SRCDIR)/*.c)
OBJFILES = $(notdir $(patsubst %.c,%.o,$(SRCFILES)))

INCLUDEDIRS = -I$(SRCDIR)
LIBDIRS =
LIBS = -lavcodec -lavformat -lavutil -lcairo -lcrypto -lssl

CC = gcc
CFLAGS = -g -Wall -Os -fdce -fdata-sections -ffunction-sections -std=c11 -c $(INCLUDEDIRS)
LDFLAGS = $(LIBDIRS)
LDLIBS = $(LIBS)

.PHONY: clean all $(OBJDIR)

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
	rm -rf osureplay build
	rm -f *.o
