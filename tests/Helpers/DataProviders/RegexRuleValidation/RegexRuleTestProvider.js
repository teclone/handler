/**
 * provides data used for testing regex rule options
*/
export default function() {
    return {
        'correct data set': [
            'validateText',
            'color',
            ['white', 'green', 'red'],
            {
                regex: {
                    test: /^(orange|white|red|black|green|purple|voilet)$/,
                    err: '{this} is not a valid color',
                },
            },
        ],

        'wrong data set': [
            'validateText',
            'color',
            ['london', 'nigeria', '2222'],
            {
                regex: {
                    test: /^(orange|white|red|black|green|purple|voilet)$/,
                    err: '{this} is not a valid color',
                },
            },
            [
                '"london" is not a valid color',
                '"nigeria" is not a valid color',
                '2222 is not a valid color'
            ]
        ],
    };
}