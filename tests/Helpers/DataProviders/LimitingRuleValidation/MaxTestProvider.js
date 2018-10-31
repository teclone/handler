/**
 * provides data for testing max limiting rule options
*/
export default function() {
    return {
        'set 1': [
            'validateInteger',
            'favorite_number',
            [100],
            {
                max: 50,
            },
            [
                'favorite_number should not be greater than 50',
            ]
        ],
        'set 2': [
            'validateDate',
            'start_date',
            ['2018-01-01'],
            {
                max: '2017-12-31',
            },
            [
                'start_date should not be greater than 2017-12-31',
            ]
        ],
    };
}