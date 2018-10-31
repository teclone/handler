/**
 * provides data for testing gt limiting rule options
*/
export default function() {
    return {
        'correct gt test set 1': [
            'validateText',
            'first_name',
            ['Harrison'],
            {
                gt: 4,
                gtErr: '{_this} should be greater than 4 characters'
            },
        ],
        'correct gt test set 2': [
            'validateDate',
            'start_date',
            ['2018-01-01'],
            {
                gt: '2017-01-01',
            },
        ],
        'wrong gt test set 1': [
            'validateText',
            'first_name',
            ['Harrison'],
            {
                gt: 8,
                gtErr: '{_this} should be greater than 8 characters'
            },
            [
                'first_name should be greater than 8 characters',
            ]
        ],
        'wrong gt test set 2': [
            'validateDate',
            'start_date',
            ['2018-01-01'],
            {
                gt: '2018-01-01',
            },
            [
                'start_date should be greater than 2018-01-01',
            ]
        ],
    };
}