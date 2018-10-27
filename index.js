// Created by Othmane Blial

const positionMatching = {
'at the beginning of a line': '^',
'end of the line': '$'
}

const characterMatching = {
'any character': '.',
'alphanumeric character': '\\w',
'non-alphanumeric character': '\\W',
'digit character': '\\d',
'non-digit character': '\\D',
'any whitespace': '\\s',
'non-whitespace character': '\\S',
}

const repetitionFactors = {
'any number of times': '*',
'at least one time': '+',
'at most one time': '?',
}


const nTimes = (string) =>  string.match(/([\d]+) times/) && 
							string.match(/([\d]+) times/)[1].replace(/\b/, '{').concat('}')
const betweenTimes = (string) => string.match(/between ([\d]+) and ([\d]+) times/) && 
								 "{" + string.match(/between ([\d]+) and ([\d]+) times/g)[1] + "," + 
								 + string.match(/between ([\d]+) and ([\d]+) times/g)[2] + "}"
const atLeastNTimes = (string) => string.match(/at least ([\d]+) times/) && 
									string.match(/at least ([\d]+) times/)[1].replace(/\b/, '{').concat(',}')

const Times  = (string) => nTimes(string) || betweenTimes(string) || atLeastNTimes(string);

const followingCharacters = (string) => string.match(/any of the following characters: (.*)/) && 
string.match(/any of the following characters: (.*)/)[1]
.replace(/ /g,'').split(',').join('').replace(/\b/, "[").concat(']')

const notFollowingCharacters = (string) => string.match(/anything except the following characters: (.*)/) && 
string.match(/anything except the following characters: (.*)/)[1]
.replace(/ /g,'').split(',').join('').replace(/\b/, "[^").concat(']')

const lookingForASomething = (string) => string.match(/an? \"(.+)"/) && string.match(/an? \"(.+)"/)[1];

const bracketsMatcher = (string) => followingCharacters(string) || notFollowingCharacters(string);

const findingMatchingRegex = (rules, string) => {
	return Object.values(rules).filter(value => 
		value === rules[
		Object.keys(rules).find(key => string.includes(key))
		]
	)[0]
}
	

const buildingTheRegexMatcher = (str) => {
	const matchingArray = []
	const string = str.replace(/\s{2,}/g, ' ');

	//positionMatcher
	const positionMatcher = findingMatchingRegex(positionMatching, string);
	if (positionMatcher) matchingArray.push(positionMatcher);

	//characterMatcher
	const characterMatcher = findingMatchingRegex(characterMatching, string)
	if (characterMatcher) matchingArray.push(characterMatcher);

	if(bracketsMatcher(string)) matchingArray.push(bracketsMatcher(string));
	if(lookingForASomething(string)) matchingArray.push(lookingForASomething(string));

	//repetitionFactor
	if(Times(string)) matchingArray.push(Times(string));

	const repetitionFactor = findingMatchingRegex(repetitionFactors, string)
	if (repetitionFactor) matchingArray.push(repetitionFactor);


	return matchingArray.join('');

}



const regexMatchingThroughLines = (lines)  => {
	regexResultList = []
	lines.split('\n').filter(Boolean).map(el => regexResultList.push(buildingTheRegexMatcher(el)));
	return regexResultList.join('');
} 
