#include <stdio.h>
#include <string.h>
#include <stdlib.h>

void demo_hello(const char *msg)
{
    printf("Demo says '%s'\n", msg);
}

// Returns the sum of two integers
int demo_add(int a, int b)
{
    return a + b;
}

// Doubles a string by concatenating with itself
// Returns a newly allocated string
// Caller is responsible for freeing the new string
char *demo_string_double(const char *str)
{
    size_t len = strlen(str);
    char *result = malloc(len * 2 + 1);
    memcpy(result, str, len);
    memcpy(result + len, str, len);
    result[len * 2] = '\0';
    return result;
}


// Simple rot13 of just the alphabet
static char chrot13(char c)
{
    // [A:M] -> [N:Z], [a:m] -> [n:z]
    if (('A' <= c && c <= 'M') || ('a' <= c && c <= 'm'))
    {
        return c + 13;
    }
    // [N:Z] -> [A:M], [n:z] -> [a:m]
    else if (('N' <= c && c <= 'Z') || ('n' <= c && c <= 'z'))
    {
        return c - 13;
    }
    return c;
}

// Copy from src to dst translating characters in rot13
// Assumes src and dst are len bytes in size
void demo_rot13(char *dst, const char *src, size_t len)
{
    while (len-- > 0)
    {
        *dst++ = chrot13(*src++);
    }
}
