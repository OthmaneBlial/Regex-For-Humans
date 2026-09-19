// Created by Othmane Blial

export const positionMatching = {
    "at the beginning of a line": "^",
    "end of the line": "$"
};

export const characterMatching = {
    "any character": ".",
    "alphanumeric character": "\\w",
    "non-alphanumeric character": "\\W",
    "digit character": "\\d",
    "non-digit character": "\\D",
    "any whitespace": "\\s",
    "non-whitespace character": "\\S"
};

export const repetitionFactors = {
    "any number of times": "*",
    "at least one time": "+",
    "at most one time": "?"
};
