/**
 * provides data used in testing filter applications
*/
export default function() {
    return {
        'first set': [
            //data
            {
                'last-name': '        Harrison        ',
                'middle-name': '        Ifeanyichukwu        ',

                'ages': ['22yrs', '22.5years'],
                'fav-numbers': ['4', '7', '10', '11'],

                //'remember-me': 'off', not supplied is the same as false for boolean fields
                'terms-and-conditions': 'on',

                'email': '(Harrisonifeanyichukwu@gmail.com)',
                'website': 'http://www.fjsfoundations.com',

                'alpha-one': 'a',
                'alpha-two': 'Z',

                'money': 'not-money',
                'cool-money': '500$'
            },

            //files
            {},

            //rules
            {
                //test do not trim and trim field filters
                'last-name': {
                    'filters': {
                        'trim': false
                    }
                },
                'middle-name':  {
                    filters: {
                        trim: true
                    }
                },

                //test float and interger cast filter
                'ages': {
                    type: 'positiveFloat',
                },
                'fav-numbers': {
                    type: 'int'
                },

                //boolean field cast
                'remember-me': {
                    type: 'boolean'
                },
                'terms-and-conditions': {
                    type: 'boolean'
                },

                //test email filter
                'email': {
                    type: 'email'
                },

                //test url filter
                'website': {
                    type: 'url'
                },

                //lower case and upper case filter
                'alpha-one': {
                    filters: {
                        'toUpper': true,
                        'decode': false
                    },
                },
                'alpha-two': {
                    filters: {
                        'toLower': true
                    },
                },

                //valid numeric and non valid numeric field cast.
                'money': {
                    filters: {
                        'numeric': true,
                    },
                },
                'cool-money': {
                    filters: {
                        'numeric': true,
                    },
                },
            },

            //is erronous
            false,

            //expected
            {
                'last-name': '        Harrison        ',
                'middle-name': 'Ifeanyichukwu',

                'ages': [22, 22.5, ],
                'fav-numbers': [4, 7, 10, 11],

                'remember-me': false,
                'terms-and-conditions': true,

                'email': 'Harrisonifeanyichukwu@gmail.com',

                'website': 'http://www.fjsfoundations.com',

                'alpha-one': 'A',
                'alpha-two': 'z',

                'money': 0,
                'cool-money': 500
            }
        ],

        'strip tags test set': [
            //data
            {
                description: `
                    <section>
                        <header>
                            <h1>Hello World</h1>
                        </header>
                        <div>
                            <p style="font-size: 12px">My name is harrison ifeanyichukwu<p>
                        </div>
                    </section>
                `,
                location: `<br>No.10 <b onClick="(event) => {console.log('clicked')}">VI Lagos<b>`,

                action: '<button type="submit" value="" autofocus>Submit',

                comment: '<p>nothing to comment</p>'
            },

            //files
            {},

            //rules
            {
                description: {
                    filters: {
                        compact: true,
                        stripTagsIgnore: ['<div>', '<p>']
                    }
                },
                location: {
                    filters: {
                        stripTagsIgnore: '<br>'
                    }
                },
                action: 'text',
                comment: {
                    filters: {
                        compact: true,
                        stripTags: false
                    }
                }
            },

            //is erronous
            false,

            //expected
            {
                description: `Hello World<div><p style="font-size: 12px">My name is harrison ifeanyichukwu<p></div>`,
                location: '<br>No.10 VI Lagos',
                action: 'Submit',
                comment: '<p>nothing to comment</p>'
            }
        ],
    };
}