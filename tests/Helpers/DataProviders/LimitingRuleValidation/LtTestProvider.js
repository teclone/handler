/**
 * provides data for testing lt limiting rule options
*/
export default function() {
    return {
        'set 1': [
            'validateText',
            'first_name',
            ['Harrison'],
            {
                'lt': 8,
                'ltErr': '{_this} should be less than 8 characters'
            },
            [
                'first_name should be less than 8 characters',
            ]
        ],
        'set 2': [
            'validateDate',
            'start_date',
            ['2018-01-01'],
            {
                'lt': '2018-01-01',
            },
            [
                'start_date should be less than 2018-01-01',
            ]
        ],
        'set 3': [
            'validateDate',
            'start_date',
            ['2017-01-02'],
            {
                'lt': '2018-01-01',
            },
        ],
    };
}