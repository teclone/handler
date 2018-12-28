import InvalidParameterException from './Exceptions/InvalidParameterException';
import Util from './Util';

let replacementText = '';

/**
 * returns the replacement text
 *
 *@private
*/
const callback = function() {
        return replacementText;
    },

    /**
     * runs the string replace algorithm
     *
     *@private
     *@param {string} pattern - the string pattern
     *@param {Callable} callback - replacement callback
     *@param {string} string - the string
     *@param {boolean} caseSensitive - boolean indicating if the operation should be case
     * sensitive
     *@param {integer} replaceCount - number of times to perform replacement
     *@return {string}
    */
    runString = function(pattern, callback, string, caseSensitive, replaceCount) {

        let result = '',
            start = 0,
            counts = 0;

        const searchFor = caseSensitive? pattern : pattern.toLowerCase(),
            searchFrom = caseSensitive? string : string.toLowerCase(),
            len = pattern.length;

        while (++counts && (replaceCount === -1 || counts <= replaceCount)) {
            const index = searchFrom.indexOf(searchFor, start);
            if (index > -1) {
                result += string.slice(start, index) + callback([pattern], counts);
                start = index + len;
                continue;
            }
            break;
        }

        result += string.slice(start);
        return result;
    },

    /**
     * runs the regex replace algorithm
     *
     *@private
     *@param {RegExp} pattern - the regex pattern
     *@param {Callable} callback - replacement callback
     *@param {string} string - the string
     *@param {integer} replaceCount - number of times to perform replacement
     *@return {string}
    */
    runRegex = function(pattern, callback, string, replaceCount) {

        let result = '',
            start = 0,
            counts = 0;

        while (++counts && (replaceCount === -1 || counts <= replaceCount)) {
            let matches = pattern.exec(string);
            if (matches) {
                const index = matches.index,
                    len = matches[0].length;

                result += string.slice(start, index) + callback(matches, counts);
                start = index + len;
                continue;
            }
            break;
        }

        result += string.slice(start);
        return result;
    },

    /**
     * resolves the given regex pattern and returns a RegExp instance
     *
     *@private
     *@param {RegExp} pattern - the regex pattern
     *@return {RegExp}
    */
    resolveRegexPattern = function(pattern) {
        let modifiers = 'gm';

        if (pattern.ignoreCase)
            modifiers += 'i';

        return new RegExp(pattern.source, modifiers);
    },

    /**
     * cordinates the replacement operation
     *
     *@private
     *@param {mixed} pattern - the pattern
     *@param {Callable} callback - replacement callback
     *@param {string} string - the string
     *@param {boolean} caseSensitive - boolean indicating if the operation should be case sensitive
     *@param {integer} replaceCount - number of times to perform replacement
     *@return {string}
    */
    cordinateReplacement = function(pattern, callback, string, caseSensitive, replaceCount) {
        if (Util.isRegex(pattern))
            return runRegex(resolveRegexPattern(pattern), callback, string, replaceCount);
        else
            return runString(pattern.toString(), callback, string, caseSensitive, replaceCount);
    },

    /**
     * resolves the replacement count and returns an integer
     *
     *@private
     *@param {boolean|number} [replaceCount] - the replacement count to be resolved
     *@returns {number}
    */
    resolveReplaceCount = function(replaceCount) {
        if (replaceCount === true)
            return 1;
        else
            return Util.isInt(replaceCount)? parseInt(replaceCount) : -1;
    },

    /**
     * it synchronizes the patterns size and the replacements size
     *
     *@private
     *@param {Array} patterns - patterns array
     *@param {Array} replacements - replacements array
     *@returns {Array}
    */
    fillReplacements = function(patterns, replacements) {
        const patternsCount = patterns.length,
            replacementsCount = replacements.length,
            difference = patternsCount - replacementsCount;

        if (difference <= 0)
            return replacements;

        const fillWith = replacements[replacementsCount - 1];
        return [...replacements, Array(difference).fill(fillWith)];
    };

/**
 * Regex module
 *@module Regex
*/
export default {

    /**
     * iteratively replace every occurence of patterns with the given replacement value
     *
     *@param {string|RegExp|(string|RegExp)[]} patterns - string or regex pattern or array of
     * such combinations
     *@param {string|string[]} replacements - replacement text or array of replacement text
     *@param {string} string - the string to work on.
     *@param {boolean} [caseSensitive=false] - boolean indicating if the operation should be case
     * sensitive
     *@param {boolean|number} replaceCount - number of times to replace occurrence. if true,
     * it is replaced only once, if false or not given, every occurence is replaced
     *@returns {string}
    */
    replace(patterns, replacements, string, caseSensitive, replaceCount) {
        if (string === null || string === undefined)
            return string;

        string = string.toString();

        patterns = Util.makeArray(patterns);
        replacements = fillReplacements(patterns, Util.makeArray(replacements));
        replaceCount = resolveReplaceCount(replaceCount);

        return patterns.reduce((result, pattern, index) => {
            replacementText = replacements[index];
            return cordinateReplacement(pattern, callback, result, caseSensitive, replaceCount);
        }, string);
    },

    /**
     * iteratively replace every occurence of pattern with return value from callback
     *
     *@param {string|RegExp|(string|RegExp)[]} patterns - string or regex pattern or array of
     * such combinations
     *@param {Callable} callback - a callback function
     *@param {string} string - the string to work on.
     *@param {boolean} [caseSensitive=false] - boolean indicating if the operation should be case
     * sensitive
     *@param {boolean|integer} replaceCount - number of times to replace occurrence. if true,
     * it is replaced only once, if false or not given, every occurence is replaced
     *@returns {string}
    */
    replaceCallback(patterns, callback, string, caseSensitive, replaceCount) {

        if (!Util.isCallable(callback))
            throw new InvalidParameterException('argument two is not a callback function');

        if (string === null || string === undefined)
            return string;

        string = string.toString();
        replaceCount = resolveReplaceCount(replaceCount);

        return Util.makeArray(patterns).reduce((result, pattern) => {
            return cordinateReplacement(pattern, callback, result, caseSensitive, replaceCount);
        }, string);
    },
};