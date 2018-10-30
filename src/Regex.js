import Util from './Util';
import InvalidParameterException from './Exceptions/InvalidParameterException';

let replacementText = '';

/**
 * returns the replacement text
 *@private
*/
const callback = function() {
        return replacementText;
    },

    /**
     * runs the regex replace algorithm
     *@private
     *@param {RegExp} pattern - the regex pattern
     *@param {Callable} callback - replacement callback
     *@param {string} string - the string
     *@param {integer} replaceCount - number of times to perform replacement
     *@return {string}
    */
    runRegex = function(pattern, callback, string, replaceCount) {

        let status = true,
            result = '',
            start = 0,
            counts = 0;

        while (status && ++counts && (replaceCount === -1 || counts <= replaceCount)) {
            let matches = pattern.exec(string);
            if (matches) {
                const index = matches.index,
                    len = matches[0].length;

                result += string.slice(start, index) + callback(matches, counts);
                start = index + len;
            }
            else {
                status = false;
            }
        }

        result += string.slice(start);
        return result;
    },

    /**
     *@private
     * resolves the regex pattern and returns a new RegExp instance or null
     *@param {RegExp} pattern - the regex pattern
     *@return {RegExp|null}
    */
    resolveRegexPattern = function(pattern) {
        if(Util.isRegex(pattern)) {
            let modifiers = 'gm';

            if (pattern.ignoreCase)
                modifiers += 'i';

            return new RegExp(pattern.source, modifiers);
        }
        return null;
    },

    /**
     *@private
     * resolves the replacement count and returns an integer
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
     *@private
     * it synchronizes the patterns size and the replacements size
     *
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

export default {

    /**
     * iteratively replace every occurence of patterns with the given replacement value
     *
     *@param {RegExp|...RegExp} patterns - array of regex patterns or a single regex pattern
     *@param {string|string[]} replacements - replacement text or array of replacement text
     *@param {string} string - the string to work on.
     *@param {boolean|integer} replaceCount - number of times to replace occurrence. if true,
     * it is replaced only once, if false or not given, every occurence is replaced
     *@returns {string}
    */
    replace(patterns, replacements, string, replaceCount) {
        string = string.toString();

        patterns = Util.makeArray(patterns);
        replacements = fillReplacements(patterns, Util.makeArray(replacements));
        replaceCount = resolveReplaceCount(replaceCount);

        return patterns.reduce((result, pattern, index) => {

            pattern = resolveRegexPattern(pattern);
            if (pattern !== null) {
                replacementText = replacements[index];
                result = runRegex(pattern, callback, result, replaceCount);
            }

            return result;
        }, string);
    },

    /**
     * iteratively replace every occurence of pattern with return value from callback
     *
     *@param {RegExp|...RegExp} patterns - the regex pattern
     *@param {Callable} callback - a callback function
     *@param {string} string - the string to work on.
     *@param {boolean|integer} replaceCount - number of times to replace occurrence. if true,
     * it is replaced only once, if false or not given, every occurence is replaced
     *@returns {string}
    */
    replaceCallback(patterns, callback, string, replaceCount) {

        if (!Util.isCallable(callback))
            throw new InvalidParameterException('argument two is not a callback function');

        string = string.toString();
        replaceCount = resolveReplaceCount(replaceCount);

        return Util.makeArray(patterns).reduce((result, pattern) => {
            pattern = resolveRegexPattern(pattern);
            if (pattern !== null)
                result = runRegex(pattern, callback, result, replaceCount);

            return result;
        }, string);
    },
};