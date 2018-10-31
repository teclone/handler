/**
 * provides data for testing min limiting rule options
*/
import CustomDate from '../../../../src/CustomDate';

export default function() {
    return {
        'set 1': [
            'validateText',
            'first_name',
            ['Harrison'],
            {
                min: 10,
                minErr: '{_this} should be at least 10 characters long'
            },
            [
                'first_name should be at least 10 characters long',
            ],
        ],
        'set 2': [
            'validateDate',
            'start_date',
            ['2018-01-01'],
            {
                min: '' + new CustomDate(),
            },
            [
                'start_date should not be less than ' + new CustomDate(),
            ],
        ],
    };
}