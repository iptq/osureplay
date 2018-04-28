CC := g++

# directories
SRCDIR := src
BUILDDIR := build
TARGET := bin/osureplay

SRCEXT := cc
SOURCES := $(shell find $(SRCDIR) -type f -name *.$(SRCEXT))
OBJECTS := $(patsubst $(SRCDIR)/%,$(BUILDDIR)/%,$(SOURCES:.$(SRCEXT)=.o))

LIB := `pkg-config --libs cairo libzip libavcodec libavformat libavutil`
INC := `pkg-config --cflags cairo libzip libavcodec libavformat libavutil`
CFLAGS := $(INCLUDE) -std=c++14 -static -g -Wall -Werror

$(TARGET): $(OBJECTS)
	@echo " Linking..."
	@echo " $(CC) $^ -o $(TARGET) $(LIB)"; $(CC) $^ -o $(TARGET) $(LIB)

$(BUILDDIR)/%.o: $(SRCDIR)/%.$(SRCEXT)
	@mkdir -p $(BUILDDIR)
	@echo " $(CC) $(CFLAGS) $(INC) -c -o $@ $<"; $(CC) $(CFLAGS) $(INC) -c -o $@ $<

clean:
	@echo " $(RM) -r $(BUILDDIR) $(TARGET)"
	$(RM) -r $(BUILDDIR) $(TARGET)

.PHONY: clean