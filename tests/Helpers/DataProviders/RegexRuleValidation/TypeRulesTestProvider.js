/**
 * provides test data used for testing all the validation rule types/methods
*/
export default function() {
    return {
        //date type validation
        'correct date test set': [
            'validateDate',
            'date-of-birth',
            ['2018-01-04', '20180104', '2018\t01\t04'],
        ],
        'wrong date test set': [
            'validateDate',
            'date-of-birth',
            ['01-04-2018', '2018-01-32'],
            {},
            [
                '01-04-2018 is not a valid date format',
                '2018-01-32 is not a valid date',
            ],
        ],

        //integer type validation
        'correct integer test set': [
            'validateInteger',
            'product-number',
            ['12', 12],
        ],
        'wrong integer test set': [
            'validateInteger',
            'product-number',
            ['a22'],
            {},
            [
                '"a22" is not a valid integer',
            ],
        ],

        //negative integer validation
        'correct negative integer set': [
            'validateNInteger',
            'product-number',
            ['-12', -12],
        ],
        'wrong negative integer set': [
            'validateNInteger',
            'product-number',
            ['22',],
            {},
            [
                '22 is not a valid negative integer'
            ],
        ],

        //positive integer validation
        'correct positive integer set': [
            'validatePInteger',
            'product-number',
            ['12', 12, 1],
        ],
        'wrong positive integer set': [
            'validatePInteger',
            'product-number',
            ['-22',],
            {},
            [
                '-22 is not a valid positive integer'
            ],
        ],

        //float validation
        'correct float set': [
            'validateFloat',
            'product-number',
            ['12.22', 0.22, '0.2333'],
        ],
        'wrong float set': [
            'validateFloat',
            'product-number',
            ['-aaa222',],
            {},
            [
                '"-aaa222" is not a valid number'
            ],
        ],

        //positive float validation
        'correct positive float set': [
            'validatePFloat',
            'product-number',
            ['12.22', 0.22, '0.2333'],
        ],
        'wrong positive float set': [
            'validatePFloat',
            'product-number',
            ['-0.222',],
            {},
            [
                '-0.222 is not a valid positive number'
            ],
        ],

        //negative float validation
        'correct negative float set': [
            'validateNFloat',
            'product-number',
            ['-12.22', -0.22, '-0.2333'],
        ],
        'wrong negative float set': [
            'validateNFloat',
            'product-number',
            ['0.222',],
            {},
            [
                '0.222 is not a valid negative number'
            ],
        ],

        //email validation
        'correct email set': [
            'validateEmail',
            'email',
            ['Harrisonifeanyichukwu@gmail.com', 'harrisonifeanyichukwu@yahoo.com']
        ],
        'wrong email set': [
            'validateEmail',
            'email',
            [
                'Harrisonifeanyichukwu@gmail',
                'harrisonifeanyichukwu@yahoo.',
                'Harrisonifeanyichukwu@.yahoo.com',
                'Harrisonifeanyichukwu@-yahoo.com'
            ],
            {},
            [
                '"Harrisonifeanyichukwu@gmail" is not a valid email address',
                '"harrisonifeanyichukwu@yahoo." is not a valid email address',
                '"Harrisonifeanyichukwu@.yahoo.com" is not a valid email address',
                '"Harrisonifeanyichukwu@-yahoo.com" is not a valid email address'
            ],
        ],

        //url validation
        'correct url set': [
            'validateURL',
            'website',
            ['example.com', 'www.example.com']
        ],
        'wrong url set': [
            'validateURL',
            'website',
            ['example', 'example-.com', 'example..edu.com'],
            {},
            [
                '"example" is not a valid url',
                '"example-.com" is not a valid url',
                '"example..edu.com" is not a valid url'
            ]
        ],

        //choice validation
        'correct choice set': [
            'validateChoice',
            'language',
            ['eu', 'en'],
            {
                choices: ['eu', 'en']
            }
        ],
        'wrong choice set': [
            'validateChoice',
            'language',
            ['du', 'fr'],
            {
                choices: ['eu', 'en'],
                err: '{this} is not a valid language code'
            },
            [
                '"du" is not a valid language code',
                '"fr" is not a valid language code',
            ]
        ],

        //range validation
        'correct range set': [
            'validateRange',
            'year',
            ['1996', 2000],
            {
                from: 1990,
                to: 2018
            }
        ],
        'correct range set 2': [
            'validateRange',
            'alphabet',
            ['a', 'c'],
            {
                from: 'a',
                to: 'z'
            }
        ],
        'wrong range set': [
            'validateRange',
            'year',
            [1978, '2019'],
            {
                from: 1990,
                to: 2018,
                err: '{this} is not a valid year'
            },
            [
                '1978 is not a valid year',
                '2019 is not a valid year',
            ]
        ],
        'wrong range set 2': [
            'validateRange',
            'alphabet',
            ['b', 'd'],
            {
                from:'a',
                to: 'z',
                step: 2
            },
            [
                '"b" is not an acceptable choice',
                '"d" is not an acceptable choice'
            ]
        ],

        //password validation
        'correct password validation': [
            'validatePassword',
            'password1',
            ['random_21', 'random21'],
        ],
        'correct password validation with matchWith option': [
            'validatePassword',
            'password1',
            ['random_21'],
            {
                matchWith: {
                    value: 'random_21',
                },
            },
        ],
        'incorrect password validation': [
            'validatePassword',
            'password1',
            ['random', '21222222', 'randomNumber'],
            {},
            [
                'Password should not be less than 8 characters',
                'Password must contain at least two letter alphabets',
                'Password must contain at least two non letter alphabets'
            ]
        ],
        'incorrect match with password validation': [
            'validatePassword',
            'password1',
            ['random_2'],
            {
                matchWith: {
                    value: 'random_21'
                }
            },
            [
                'Passwords did not match',
            ]
        ],
    };
}