/**
 * provides data used in testing file extension validation
*/
export default function() {
    return {
        'spoofed extension test': [
            'validateFile',
            'spoofed.png',
            'image/png',
            {},
            'File extension spoofing detected',
        ],
        'txt extension test': [
            'validateFile',
            'file2.txt',
            'text/plain',
            {},
            '',
        ],
        'binary file extension test': [
            'validateFile',
            'file1.jpg',
            'imag/jpeg',
            {},
            '',
        ],
        'binary file without extension test': [
            'validateFile',
            'file3',
            'imag/jpeg',
            {},
            '',
        ],
        'mimes test': [
            'validateFile',
            'file2.txt',
            'text/plain',
            {
                'mimes': ['jpeg', 'png', 'gif']
            },
            '".txt" file extension not accepted',
        ],
    };
}