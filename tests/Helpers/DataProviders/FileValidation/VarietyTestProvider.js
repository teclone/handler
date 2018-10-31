/**
 * provides data used in all file methods validation
*/
export default function() {
    return {
        //image file validation method
        'image file validation': [
            'validateImage',
            'file1.jpg',
            'image/jpeg',
        ],

        //audio file validation method
        'audio file validation': [
            'validateAudio',
            'file1.jpg',
            'image/jpeg',
            {},
            '".jpg" file extension not accepted'
        ],

        //video file validation method
        'video file validation': [
            'validateVideo',
            'file1.jpg',
            'image/jpeg',
            {},
            '".jpg" file extension not accepted'
        ],

        //media file validation method
        'media file validation': [
            'validateMedia',
            'file1.jpg',
            'image/jpeg',
        ],

        //document file validation method
        'document file validation': [
            'validateDocument',
            'file2.txt',
            'text/plain',
            {},
            '".txt" file extension not accepted'
        ],

        //document file validation method
        'archive file validation': [
            'validateArchive',
            'file2.txt',
            'text/plain',
            {},
            '".txt" file extension not accepted'
        ],
    };
}