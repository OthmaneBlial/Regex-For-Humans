# REGEX FOR HUMANS

![alt text](https://github.com/OthmaneBlial/Regex-For-Humans/blob/master/Regex-logo.png)

REGEX SYNTAX IS VERY CHALLENGING AND UNREADABLE!!! what if you can write the requirement you are looking for and just have the
the whole regex generated for you, likewise, if you look up at you project you have just to look up at some lines in plain English instead of reading a bunch of characters and symbols that are not making any sense for many people. This why I thought about creating such a tool, which will help you learn regex and generate your own at the same time.

N.B: this not a final version, I am still building the tool, also I am adding more features like groups capturing, looking around and other stuff.


### Example 1:

```js
const lines= `
at the beginning of a line, I am looking for any character, any number of times
I am looking for a digit character 3 times
end of the line
`

//result is: ^.*\d{3}$

```


### Example 2:

```js
const lines= `
at the beginning of a line, I am looking for any character, any number of times
I am looking for a digit character 3 times
end of the line
`

regexMatchingThroughLines(lines)

//result is: ^ABC\w+$

```

### Example 3:

```js
const lines= `
at the beginning of a line, I am looking for any whitespace at most one time
I am looking for any number of times for anything except the following characters: a, b, c, d
end of the line
`

regexMatchingThroughLines(lines)

//result is: ^\s?[^abcd]*$

```

## The syntax you should use to build the regex


Character matching |
---------- |
any character |
any characteralphanumeric character |
non-alphanumeric character |
decimal digit character |
non-digit character |
any whitespace |
non-whitespace character |
any of the following character |
anything except any of the following characters: ., ., . |

Repetition factors |
---------- |
0 or more times - any number of times |
1 or more times - at least one time |
0 or 1 - at most one time |
n times |
between n and m times |
at least n times |

Position matching |
---------- |
at the beginning of a line |
end of the line |



### Development

```bash
#TODO
```

### Contributing

//TODO
