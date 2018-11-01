/**
 * provides data used in testing filter applications
*/
export default function() {
    return {
        'first set': [
            //data
            {
                'ages': ['22yrs', '22.5years'],
                'last-name': '',
                'remember-me': 'off',
                'terms-and-conditions': 'on',
                'fav-numbers': ['4', '7', '10', '11'],
                'height': '5.4ft',
                'email': '(Harrisonifeanyichukwu@gmail.com)',
                'website': 'http://www.fjsfoundations.com',
                'alpha-one': 'a',
                'alpha-two': 'Z',
                'money': '500',
            },

            //files
            {},

            //rules
            {
                'ages': {
                    type: 'positiveFloat',
                },
                'last-name': {
                    'required': false,
                },
                'remember-me': {
                    type: 'boolean'
                },
                'terms-and-conditions': {
                    type: 'boolean'
                },
                'fav-numbers': {
                    type: 'int'
                },
                'height': {
                    type: 'float'
                },
                'email': {
                    type: 'email'
                },
                'website': {
                    type: 'url'
                },
                'alpha-one': {
                    filters: {
                        'toUpper': true
                    },
                },
                'alpha-two': {
                    filters: {
                        'toLower': true
                    },
                },
                'money': {
                    filters: {
                        'numeric': true,
                    },
                },
            },

            //is erronous
            false,

            //expected
            {
                'ages': [22, 22.5],
                'last-name': null,
                'remember-me': false,
                'terms-and-conditions': true,
                'fav-numbers': [4, 7, 10, 11],
                'height': 5.4,
                'email': 'Harrisonifeanyichukwu@gmail.com',
                'website': 'http://www.fjsfoundations.com',
                'alpha-one': 'A',
                'alpha-two': 'z',
                'money': 500
            }
        ],
    };
}