/**
 * returns data used in validating limiting rule unit value resolutions such as the use
 * of the following units, mb, kb, gb, tb and bytes
*/
export default function() {
    return {
        'kb resolution test set': [
            'validateText',
            'first-name',
            ['Harrison'],
            {
                min: '2kb',
            },
            [
                'first-name should not be less than 2,000 characters'
            ]
        ],
        'mb resolution test set': [
            'validateText',
            'first-name',
            ['Harrison'],
            {
                min: '2.5mb'
            },
            [
                'first-name should not be less than 2,500,000 characters'
            ]
        ],
        'gb resolution test set': [
            'validateText',
            'first-name',
            ['Harrison'],
            {
                min: '0.5gb'
            },
            [
                'first-name should not be less than 500,000,000 characters'
            ]
        ],
    };
}