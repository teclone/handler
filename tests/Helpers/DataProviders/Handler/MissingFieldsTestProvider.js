/**
 * provides data used in testing missing field detection and handling
*/
export default function() {
    return {
        'first set': [
            //data section
            {
                'first_name': 'Harrison',
                'languages': [],
                'hobbies': ['programming', 'teaching', 'footballing']
            },

            //files
            {},

            //rules section
            {
                'first_name': {
                    'type': 'text',
                    'hint': '{_this} is required'
                },
                'last_name': {
                    'type': 'text',
                    'hint': '{_this} is required'
                },
                'languages': {
                    'type': 'text',
                    'hint': '{_this} field is required'
                },
                'hobbies': {
                    'type': 'text',
                },
                'profile-picture': {
                    'type': 'file'
                }
            },

            // is erronous
            true,

            //missing fields section
            {
                'last_name': 'last_name is required',
                'languages': 'languages field is required',
                'profile-picture': 'profile-picture is required'
            }
        ],
    };
}