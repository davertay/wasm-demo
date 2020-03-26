#ifndef DEMO_H
#define DEMO_H

#include <stddef.h>

extern void demo_hello(const char *msg);
extern int demo_add(int a, int b);
extern char *demo_string_double(const char *str);
extern void demo_rot13(char *dst, const char *src, size_t len);

#endif /* DEMO_H */
