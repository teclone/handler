/**
 * provides us with some simple rules to start with
*/
export default function() {
    return {
        'first-name': {
            type: 'text',
            hint: 'first-name field is required',
            options: {
                min: 3,
                max: 15,
            },
        },
        'last-name': {
            type: 'text'
        },
        'middle-name': {
            required: false
        },
        'age': {
            type: 'int',
            required: false
        },
        'password1': {
            type: 'text'
        },
        'fav-negative-int': {
            type: 'negativeInteger',
        },
        'fav-positive-int': {
            type: 'pInt',
        },
        'height': {
            type: 'float',
        },
        'fav-negative-float': {
            type: 'nFloat',
        },
        'fav-positive-float': {
            type: 'pNumber',
        },
        'password2': {
            required: false,
            defaultValue: '{password1}'
        },
        'timestamp': {
            required: false,
            defaultValue: '{CURRENT_TIME}'
        },
        'date-of-birth': {
            required: false,
            type: 'date',
            defaultValue: '{CURRENT_DATE}'
        },
        'email': {
            type: 'email',
        },
        'website': {
            type: 'url',
        },
        'terms-and-condition': {
            type: 'boolean',
        },
    };
}