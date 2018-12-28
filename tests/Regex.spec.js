import InvalidParameterException from '../src/Exceptions/InvalidParameterException';
import Regex from '../src/Regex';

describe('Regex Module', function() {

    describe('.replace(patterns, replacements, string, caseSensitive=false, replaceCount?)', function() {
        it(`should replace all occurrence of patterns with the associated replacement text
            in the given string and return the result`, function() {
            expect(
                Regex.replace(/girl/i, 'boy', 'I am a girl')
            ).toEqual('I am a boy');
            expect(
                Regex.replace([/is/, 'man'], 'wow', 'Obi is a man')
            ).toEqual('Obi wow a wow');
        });

        it(`should auto fill the replacements array with the given replacement text if
            patterns size exceeds replacements size`, function() {
            expect(Regex.replace(
                [/is/, /man/], 'wow', 'Obi is a man'
            )).toEqual('Obi wow a wow');
        });

        it(`should return the given string argument as it is if it is undefined or null`, function() {
            expect(Regex.replace(
                [/is/, 'man'], 'wow'
            )).toBeUndefined();

            expect(Regex.replace(
                [/is/, 'man'], 'wow', null
            )).toBeNull();
        });
    });

    describe('.replaceCallback(patterns, callback, string, caseSensitive=false, replaceCount?)', function() {

        it(`should throw InvalidParameterException if callback is
            not a callable`, function() {
            expect(function() {
                Regex.replaceCallback(/something/, null, 'something is not right here');
            }).toThrow(InvalidParameterException);
        });

        it(`should call the callback function with two arguments. The first should be an
            array containing captured sections, the second should be an integer that denotes the
            replacement count`, function() {
            let count = 0;
            Regex.replaceCallback(/\d/, function(matches, replaceCount) {
                expect(matches[0]).toEqual('1');
                expect(replaceCount - count).toEqual(1);
                count++;
            }, 1111);

            count = 0;
            Regex.replaceCallback(1, function(matches, replaceCount) {
                expect(matches[0]).toEqual('1');
                expect(replaceCount - count).toEqual(1);
                count++;
            }, 1111);
        });

        it(`should replace all matching text with the callback return value`, function() {
            expect(Regex.replaceCallback(/\d/, function(matches, replaceCount) {
                return replaceCount;
            }, 1111)).toEqual('1234');

            expect(Regex.replaceCallback(1, function(matches, replaceCount) {
                return replaceCount;
            }, 1111)).toEqual('1234');

            expect(Regex.replaceCallback(/[a-z]/i, function(matches) {
                return matches[0].toUpperCase();
            }, 'aAaA')).toEqual('AAAA');
        });

        it(`should take array of regex expressions and run callback on each regex`, function() {
            expect(Regex.replaceCallback(/[A-Z]/, function(matches) {
                return matches[0].toUpperCase();
            }, 'aAaA')).toEqual('aAaA');

            expect(Regex.replaceCallback([/[a-z]/, /[A-Z]/], function(matches) {
                return matches[0].toUpperCase();
            }, 'aAaA')).toEqual('AAAA');
        });

        it(`should perform string pattern replacement ignoring case, unless the fourth
        caseSensitive argument is set to true`, function() {
            expect(Regex.replaceCallback('a', function() {
                return 'b';
            }, 'aAaA')).toEqual('bbbb');

            expect(Regex.replaceCallback('a', function() {
                return 'b';
            }, 'aAaA', true)).toEqual('bAbA');
        });

        it(`should accept a fifth argument that indicates the maximum number of times to run
            replacements call for each pattern. true should be same as 1, negative numbers should
            run as many replacements as possible`, function() {
            expect(Regex.replaceCallback(/[A-Z]/, function(matches) {
                return matches[0].toLowerCase();
            }, 'aAaA', true, true)).toEqual('aaaA');

            expect(Regex.replaceCallback('A', function(matches) {
                return matches[0].toLowerCase();
            }, 'aAaA', true, true)).toEqual('aaaA');


            expect(Regex.replaceCallback(/[A-Z]/, function(matches) {
                return matches[0].toLowerCase();
            }, 'aAaA', false, 1)).toEqual('aaaA');

            expect(Regex.replaceCallback('A', function(matches) {
                return matches[0].toLowerCase();
            }, 'aAaA', true, 1)).toEqual('aaaA');


            expect(Regex.replaceCallback(/[A-Z]/, function(matches) {
                return matches[0].toLowerCase();
            }, 'aAaA', true, -1)).toEqual('aaaa');

            expect(Regex.replaceCallback('A', function(matches) {
                return matches[0].toLowerCase();
            }, 'aAaA', true, -1)).toEqual('aaaa');
        });

        it(`should return the given string argument as it is if it is undefined or null`, function() {
            expect(Regex.replaceCallback(
                [/is/, 'man'], function() {}
            )).toBeUndefined();

            expect(Regex.replace(
                [/is/, 'man'], function() {}, null
            )).toBeNull();
        });
    });
});