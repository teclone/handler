/**
 * provides data to be used in testing override if conditional rules
*/
export default function() {
    return {
        //test not checked condition
        'checked first test set': [
            //data section
            {
                'is-current-work': 'on',
                'work-end-month': '2',
                'work-end-year': '2018',
            },

            //files section
            {},

            //rules section
            {
                'is-current-work': {
                    'type': 'boolean',
                },
                'work-end-month': {
                    overrideIf: {
                        type: 'month',
                        condition: 'checked',
                        field: 'is-current-work',
                        with: '4'
                    },
                },
                'work-end-year': {
                    overrideIf: {
                        type: 'year',
                        condition: 'checked',
                        field: 'is-current-work',
                        with: '2019'
                    },
                },
            },

            //is erronous
            false,

            //expected
            {
                'is-current-work': true,
                'work-end-month': '4',
                'work-end-year': '2019',
            }
        ],
    };
}