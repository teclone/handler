/**
 * provides data used for testing regexNone rule option
*/
export default function() {
    return {
        'correct data set': [
            'validateURL',
            'website',
            ['https://www.example.com'],
            {
                regexNone: [
                    // the url should not contain the ftp protocol
                    {
                        test: /^ftp:/i,
                        err: '{this} should not contain the ftp protocol'
                    },
                    // the url should be free of queries
                    {
                        test: /\?.*/,
                        err: '{this} should be free of query string'
                    },
                    //test that it ignores options that is not an array
                    /^[0-9]/,
                ],
            },
        ],

        'wrong data set': [
            'validateURL',
            'website',
            ['ftp://www.example.com', 'https://www.example.com/index.php?call=search'],
            {
                regexNone: [
                    // the url should not contain the ftp protocol
                    {
                        test: /^ftp:/i,
                        err: '{this} should not contain the ftp protocol'
                    },
                    // the url should be free of queries
                    {
                        test: /\?.*/,
                        err: '{this} should be free of query string'
                    }
                ],
            },
            [
                '"ftp://www.example.com" should not contain the ftp protocol',
                '"https://www.example.com/index.php?call=search" should be free of query string'
            ]
        ],
    };
}