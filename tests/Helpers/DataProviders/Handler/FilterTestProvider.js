/**
 * provides data used in testing filter applications
*/
export default function() {
    return {
        //test trim filter
        'trim filter test': [
            //data
            {
                'last-name': '        Harrison        ',
                'middle-name': '        Ifeanyichukwu        ',
            },
            //files
            {},

            //rules
            {
                'last-name': {
                    'filters': {
                        'trim': false //do not trim
                    }
                },
                'middle-name':  {
                    filters: {
                        trim: true //trim
                    }
                },
            },

            //is erronous
            false,

            //expected
            {
                'last-name': '        Harrison        ',
                'middle-name': 'Ifeanyichukwu',
            }
        ],

        //test int cast filter
        'int cast test': [
            //data
            {
                'fav-numbers': ['4', '7', '10', '11'],
            },
            //files
            {},

            //rules
            {
                'fav-numbers': 'int',
            },

            //is erronous
            false,

            //expected
            {
                'fav-numbers': [4, 7, 10, 11]
            }
        ],

        //test float cast filter
        'float cast test': [
            //data
            {
                'ages': ['22yrs', '22.5years'],
            },

            //files
            {},

            //rules
            {
                ages: 'positiveFloat',
            },

            //is erronous
            false,

            //expected
            {
                ages: [22, 22.5]
            }
        ],

        //test boolean type cast
        'boolean cast test': [
            //data
            {
                'roles.isAdmin': true,
                'roles.isOwner': '0'
            },

            //files
            {},

            //rules
            {
                'roles.isAdmin': 'boolean',
                'roles.isOwner': 'boolean'
            },

            //is erronous
            false,

            //expected
            {
                'roles.isAdmin': true,
                'roles.isOwner': false
            }
        ],

        //test checkbox type cast
        'checkbox filter test': [
            //data
            {
                'subscribe-newsletter': 'checked',
            },

            //files
            {},

            //rules
            {
                'subscribe-newsletter': 'checkbox',
                'terms-and-condition': 'checkbox'
            },

            //is erronous
            false,

            //expected
            {
                'subscribe-newsletter': true,
                'terms-and-condition': false
            }
        ],

        //test email type cast
        'email filter test': [
            //data
            {
                'email': '(Harrisonifeanyichukwu@gmail.com)',
            },

            //files
            {},

            //rules
            {
                email: 'email',
            },

            //is erronous
            false,

            //expected
            {
                email: 'Harrisonifeanyichukwu@gmail.com'
            }
        ],

        //test url type cast
        'url filter test': [
            //data
            {
                'website': 'http://www.fjsfoundations.com',
            },

            //files
            {},

            //rules
            {
                website: 'url',
            },

            //is erronous
            false,

            //expected
            {
                website: 'http://www.fjsfoundations.com'
            }
        ],

        'case filter test': [
            //data
            {
                field1: 'a',
                field2: 'Z',
                field3: 'hArrison'
            },

            //files
            {},

            //rules
            {
                field1: {
                    filters: {
                        toUpper: true,
                        decode: false
                    }
                },
                field2: {
                    filters: {
                        toLower: true,
                    }
                },
                field3: {
                    filters: {
                        capitalize: true,
                    }
                }
            },

            //is erronous
            false,

            //expected
            {

                field1: 'A',
                field2: 'z',
                field3: 'Harrison'
            }
        ],

        'numeric cast filter': [
            //data
            {
                amount: '500',
                age: 'nonsense'
            },

            //files
            {},

            //rules
            {
                amount: {
                    filters: {
                        'numeric': true
                    }
                },

                age: {
                    filters: {
                        'numeric': true
                    }
                }
            },

            //is errornous
            false,

            //expected result
            {
                amount: 500,
                age: 0
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

        'callback filter test': [
            //data
            {
                name: 'HARRISON'
            },

            //files
            {},

            //rules
            {
                name: {
                    filters: {
                        callback: value => value.charAt(0).toUpperCase() + value.substring(1).toLowerCase()
                    }
                }
            },

            //is errornous
            false,

            //expected value
            {
                name: 'Harrison'
            }
        ]
    };
}