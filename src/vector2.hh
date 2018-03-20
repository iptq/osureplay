#ifndef src_vector2_h
#define src_vector2_h

#include <type_traits>

namespace osureplay {

class Vector2 {
  public:
    Vector2(double x, double y) : x_(x), y_(y) {}
    Vector2() : x_(0), y_(0) {}

  private:
    double x_, y_;
};

} // namespace osureplay

#endif