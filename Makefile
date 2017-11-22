.PHONY: all clean

all:
	$(MAKE) -C src all

player:
	$(MAKE) -C src all PLAYER=1

clean:
	$(MAKE) -C src clean