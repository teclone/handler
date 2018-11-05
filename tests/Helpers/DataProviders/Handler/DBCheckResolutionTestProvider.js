export default function() {
    return {
        'exists resolution set': [

            //data
            {
                'id': '2',
                'country': ''
            },

            //rules
            {
                'id': {
                    'type': 'positiveInt',
                    'check': {
                        'if': 'exists',
                        'entity': 'users',
                        'query': 'SELECT 1 FROM products WHERE {_this} = {_index}',
                        'err': 'product with id {this} already exists'
                    },
                },
            },

            //expected resolutions
            {
                'id': 'exist'
            },
        ],

        'does not/doesnt exists resolution set': [
            //data
            {
                'id': '2',
                'email': 'Harrisonifeanyichukwu@gmail.com',
                'languages': ['php', 'javascript']
            },

            //rules
            {
                'id': {
                    'check': {
                        'if': 'doesNotExists',
                        'table': 'products',
                        'err': 'product with id {this} does not exist'
                    },
                },
                'email': {
                    'type': 'email',
                    'checks': [
                        {
                            'table': 'users',
                            'if': 'doesntExist',
                            'entity': 'users',
                            'err': 'user with email "{this}" not found'
                        },
                    ],
                },
                'country': {
                    'required': false,
                    //if it is supplied, check if the country is in our database list
                    'check': {
                        'collection': 'countries',
                        'if': 'notExists',
                        'err': '{this} is not a recognised country',
                        'query': 'SELECT 1 FROM countries WHERE value = ?',
                        'params': ['{this}'],
                    },
                },
                'languages': {
                    'required': false,
                    //if it is supplied, check if the language is in our database list
                    'check': {
                        'entity': 'languages',
                        'if': 'notExists',
                        'err': '{this} is not a recognised language',
                        'query': 'SELECT 1 FROM languages WHERE value = ?',
                        'params': ['{this}'],
                    }
                }
            },

            //expected resolutions
            {
                'id': 'notexist',
                'email': 'notexist'
            }
        ],
    };
}