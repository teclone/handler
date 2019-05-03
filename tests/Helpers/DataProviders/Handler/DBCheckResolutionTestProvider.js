import model from '../../model';

export default function() {
    return {
        'exists resolution set': [

            //data
            {
                'id': '2',
                'email': 'harrisonifeanyichukwu@gmail.com',
                'name': 'Harrison'
            },

            //rules
            {
                'id': {
                    'type': 'positiveInt',
                    'check': {
                        'if': 'exists',
                        'entity': 'users',
                        'query': 'SELECT 1 FROM products WHERE {_this} = {_index}',
                        'err': 'product with id {this} already exists',
                        model: model
                    },
                },
                'email': {
                    type: 'email',
                    checks: [
                        {
                            $if: 'exist',
                            entity: 'users',
                            query: 'SELECT 1 FROM users where email = ?',
                            params: ['{this}'],
                            model: model
                        }
                    ]
                },
                'country': {
                    'required': false,
                    //if it is supplied, check if the country is in our database list
                    'check': {
                        'collection': 'countries',
                        'if': 'exists',
                        'err': '{this} is already registered',
                        'query': 'SELECT 1 FROM countries WHERE value = ?',
                        'params': ['{this}'],
                        model: model
                    },
                },
                'name': {
                    required: true,
                    check: {
                        if: 'exists',
                        collection: 'Users',
                        query: {
                            $or: [
                                {firstName: '{this}'},
                                {lastName: '{this}'}
                            ]
                        },
                        model: model
                    }
                }
            },

            //expected resolutions
            {
                'id': 'exist',
                'email': 'exist'
            },
        ],

        'does not/doesnt exists resolution set': [
            //data
            {
                'id': '2',
                'email': 'Harrisonifeanyichukwu@gmail.com',
                'languages': ['php', 'javascript'],
            },

            //rules
            {
                'id': {
                    'check': {
                        'if': 'doesNotExists',
                        'table': 'products',
                        'err': 'product with id {this} does not exist',
                        model: model
                    },
                },
                'email': {
                    'type': 'email',
                    'checks': [
                        {
                            'table': 'users',
                            'if': 'doesntExist',
                            'entity': 'users',
                            'field': 'email',
                            'err': 'user with email "{this}" not found',
                            model: model
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
                        model: model
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
                        'params': ['{_index}'],
                        model: model
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