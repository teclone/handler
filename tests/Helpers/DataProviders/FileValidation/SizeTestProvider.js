import { getTestFileDetails } from '../../bootstrap';

/**
 * provides data used in testing file size validation
*/
export default function() {
    let fileDetails = getTestFileDetails('file1.jpg', 'image/jpeg'),
        min = fileDetails.size + 1,
        max = fileDetails.size - 1,
        gt = fileDetails.size,
        lt = fileDetails.size,

        minErr = 'Picture should be at least ' + min + 'bytes',
        maxErr = 'Picture should be at max ' + max + 'bytes';

    return {
        'min error test': [
            'validateFile',
            'file1.jpg',
            'image/jpeg',
            {
                min,
                minErr
            },
            minErr
        ],
        'max error test': [
            'validateFile',
            'file1.jpg',
            'image/jpeg',
            {
                max,
                maxErr
            },
            maxErr
        ],
        'gt error test': [
            'validateFile',
            'file1.jpg',
            'image/jpeg',
            {
                gt,
            },
            'file should be greater than 19.56kb'
        ],
        'lt error test': [
            'validateFile',
            'file1.jpg',
            'image/jpeg',
            {
                lt,
            },
            'file should be less than 19.56kb'
        ]
    };
}