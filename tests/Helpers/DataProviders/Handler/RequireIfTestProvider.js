/**
 * provides data to be used in testing require if conditional rules
*/
export default function() {
    return {
        //test not checked condition
        'notChecked first test set': [
            //data section
            {
                'is-current-work': 'on',
                'work-end-month': '',
                'work-end-year': '',
            },

            //files section
            {},

            //rules section
            {
                'is-current-work': {
                    'type': 'boolean',
                },
                'work-end-month': {
                    'type': 'range',
                    'requiredIf': {
                        'condition': 'notChecked',
                        'field': 'is-current-work'
                    },
                    'options': {
                        'from': 1,
                        'to': 12
                    },
                },
                'work-end-year': {
                    'requiredIf': {
                        'condition': 'notChecked',
                        'field': 'is-current-work'
                    },
                    'type': 'range',
                    'options': {
                        'from': 1920,
                        'to': '{CURRENT_YEAR}',
                    },
                },
            },

            //is erronous
            false,

            //expected
            {
                'is-current-work': true,
                'work-end-month': null,
                'work-end-year': null,
            }
        ],

        'notChecked second test set': [
            //data
            {
                'work-end-month': '',
                'work-end-year': '',
            },

            //files section
            {},

            //rules
            {
                'is-current-work': {
                    'type': 'checkbox',
                },
                'work-end-month': {
                    'type': 'range',
                    'options': {
                        'from': 1,
                        'to': 12
                    },
                    'requiredIf': {
                        'condition': 'notChecked',
                        'field': 'is-current-work'
                    },
                },
                'work-end-year': {
                    'type': 'range',
                    'options': {
                        'from': 1920,
                        'to': '{CURRENT_YEAR}',
                    },
                    'requiredIf': {
                        'condition': 'notChecked',
                        'field': 'is-current-work'
                    },
                },
            },

            //is erronous
            true,

            //expected
            {
                'work-end-month': 'work-end-month is required',
                'work-end-year': 'work-end-year is required',
            }
        ],

        //test checked condition
        'checked first test set': [
            //data
            {
                'join-newsletter': 'on',
                'email': 'Harrisonifeanyichukwu@gmail.com',
            },

            //files section
            {},

            //rules
            {
                'join-newsletter': {
                    'type': 'boolean',
                },
                'email': {
                    'type': 'email',
                    'requiredIf': {
                        'condition': 'checked',
                        'field': 'join-newsletter'
                    },
                },
            },

            //is erronous
            false,

            //expected
            {
                'join-newsletter': true,
                'email': 'Harrisonifeanyichukwu@gmail.com',
            }
        ],

        'checked second test set': [
            //data
            {
                'join-newsletter': 'on',
                'email': '',
            },

            //files section
            {},

            //rules
            {
                'join-newsletter': {
                    'type': 'boolean',
                },
                'email': {
                    'type': 'email',
                    'requiredIf': {
                        'condition': 'checked',
                        'field': 'join-newsletter'
                    },
                    'hint': 'you must enter your email to join'
                },
            },

            //is erronous
            true,

            //expected
            {
                'email': 'you must enter your email to join',
            }
        ],

        'checked third test set': [
            //data
            {
                'email': '',
            },

            //files section
            {},

            //rules
            {
                'join-newsletter': {
                    'type': 'checkbox',
                },
                'email': {
                    'type': 'email',
                    'requiredIf': {
                        'condition': 'checked',
                        'field': 'join-newsletter'
                    },
                    'hint': 'you must enter your email to join',
                    'default': ''
                },
            },

            //is erronous
            false,

            //expected
            {
                'join-newsletter': false,
                'email': '',
            }
        ],

        //test not equals condition
        'notEqual/notEquals first set': [
            //data
            {
                'country': 'ng',
                'calling-code': '',
            },

            //files section
            {},

            //rules
            {
                'country': {
                    'required': true,
                    'type': 'choice',
                    'options': {
                        'choices': ['ng', 'gb', 'us', 'gh']
                    },
                },

                //tell us your country code if you are not in nigeria, nigerians do not need to
                'calling-code': {
                    'requiredIf': {
                        'condition': 'notEquals',
                        'field': 'country',
                        'value': 'ng'
                    },
                }
            },

            //is erronous
            false,

            //expected
            {
                'country': 'ng',
                'calling-code': null,
            }
        ],

        'notEquals/notEqual second test set': [
            //data
            {
                'country': 'gb',
                'calling-code': '',
            },

            //files
            {},

            //rules
            {
                'country': {
                    'required': true,
                    'type': 'choice',
                    'options': {
                        'choices': ['ng', 'gb', 'us', 'gh']
                    },
                },
                //tell us your country code if you are not in nigeria, nigerians do not need to
                'calling-code': {
                    'requiredIf': {
                        'condition': 'notEqual',
                        'field': 'country',
                        'value': 'ng'
                    },
                    'hint': 'tell us your country calling code'
                }
            },

            //is erronous
            true,

            //expected error
            {
                'calling-code': 'tell us your country calling code',
            }
        ],

        //test equals condition
        'equals/equal first test set': [
            //data
            {
                'country': 'gb',
            },

            //files
            {},

            //rules
            {
                'country': {
                    'required': true,
                    'type': 'choice',
                    'options': {
                        'choices': ['ng', 'gb', 'us', 'gh']
                    },
                },

                //tell us your salary demand if you are in nigeria, other countries
                //are paid equal amount of $50,000 yearly
                'salary-demand': {
                    'requiredIf': {
                        'condition': 'equal',
                        'field': 'country',
                        'value': 'ng'
                    },
                    'hint': 'tell us your salary demand'
                },
            },

            //is erronous
            false,

            //expected data
            {
                'salary-demand': null,
            }
        ],

        'equal/equals second test set': [
            //data
            {
                'country': 'ng',
                'salary-demand': '100000',
            },

            // files
            {},

            //rules
            {
                'country': {
                    'required': true,
                    'type': 'choice',
                    'options': {
                        'choices': ['ng', 'gb', 'us', 'gh']
                    }
                },

                //tell us your salary demand if you are in nigeria, other countries
                //are paid equal amount of $50,000 yearly
                'salary-demand': {
                    'requiredIf': {
                        'condition': 'equals',
                        'field': 'country',
                        'value': 'ng'
                    },
                    'type': 'money',
                    'hint': 'tell us your salary demand'
                }
            },

            //is erronous
            false,

            //expected data
            {
                'salary-demand': 100000,
            }
        ],

        'tenth set': [
            //data
            {
                'country': 'ng',
                'salary-demand': '',
            },

            // files
            {},

            //rules
            {
                'country': {
                    'required': true,
                    'type': 'choice',
                    'options': {
                        'choices': ['ng', 'gb', 'us', 'gh']
                    }
                },

                //tell us your salary demand if you are in nigeria, other countries
                //are paid equal amount of $50,000 yearly
                'salary-demand': {
                    'requiredIf': {
                        'condition': 'Equal',
                        'field': 'country',
                        'value': 'ng'
                    },
                    'type': 'money',
                    'hint': 'tell us your salary demand'
                }
            },

            //is erronous
            true,

            //expected error
            {
                'salary-demand': 'tell us your salary demand',
            }
        ],
    };
}