import fs from 'fs';
import path from 'path';

/**
 * returns a test file details located in the test Helpers directory
 *
 *@return {Object}
*/
export const getTestFileDetails = function(filename, type)
{
    const fileLocation = path.join(__dirname, 'Files/' + filename),
        stats = fs.statSync(fileLocation);

    return {
        name: filename,
        tmpName: filename,
        path: fileLocation,
        size: stats.size,
        type
    };
};


/**
 * returns a object of test files details located in the test Helpers directory
 *
 *@return {Object}
*/
export const getTestMultiFileDetails = function(filenames, types)
{
    return filenames.reduce((result, filename, index) => {
        const {name, tmpName, path, size, type} = getTestFileDetails(filename, types[index]);

        return {
            name: [...result.name, name],
            tmpName: [...result.tmpName, tmpName],
            path: [...result.path, path],
            size: [...result.size, size],
            type: [...result.type, type]
        };
    }, {name: [], tmpName: [], path: [], size: [], type: []});
};