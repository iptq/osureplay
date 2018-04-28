#ifndef src_recorder_h
#define src_recorder_h

#include <libavcodec/codec.h>

namespace osureplay {

class Recorder {
  public:
    Recorder();

    const AVCodec *codec;
};
} // namespace osureplay

#endif