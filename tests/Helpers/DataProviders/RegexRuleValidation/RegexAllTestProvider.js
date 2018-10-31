/**
 * provides data used for testing regexAll rule option
*/
export default function() {
    return {
        'correct data set': [
            'validateText',
            'first-name',
            ['Harrison'],
            {
                regexAll: [
                    {
                        //test that the name starts with alphabet
                        test: /^[a-z]/i,
                        err: 'first name should start with alphabet'
                    },
                    {
                        //test that the name is 3-15 characters long
                        test: /^\w{3,14}$/i,
                        err: 'first name should be 3 to 15 characters long'
                    },
                    //test that it ignores options that is not an array
                    /^[0-9]/,
                ],
            },
        ],

        'wrong data set': [
            'validateText',
            'first-name',
            ['7up', 'Ha'],
            {
                regexAll: [
                    {
                        //test that the name starts with alphabet
                        test: /^[a-z]/i,
                        err: 'first name should start with alphabet'
                    },
                    {
                        //test that the name is 3-15 characters long
                        test: /^\w{3,14}$/i,
                        err: 'first name should be 3 to 15 characters long'
                    },
                ],
            },
            [
                'first name should start with alphabet',
                'first name should be 3 to 15 characters long'
            ]
        ],
    };
}