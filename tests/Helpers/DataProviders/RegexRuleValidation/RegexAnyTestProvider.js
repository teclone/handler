/**
 * returns data used for testing regexAny rule option
*/
export default function() {
    return {
        'correct data set': [
            'validateURL',
            'website',
            ['https://www.example.com'],
            {
                regexAny: {
                    //test that the website url starts with https or ftp
                    tests: [/^https/, /^ftp/],
                    err: 'Website url should start with https or ftp protocols',
                },
            },
        ],

        'wrong data set': [
            'validateURL',
            'website',
            ['http://www.example.com'],
            {
                regexAny: {
                    //test that the website url starts with https or ftp
                    tests: [/^https/, /^ftp/],
                    err: 'Website url should start with https or ftp protocols',
                },
            },
            [
                'Website url should start with https or ftp protocols',
            ],
        ],
    };
}