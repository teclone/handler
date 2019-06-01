import * as path from 'path';
import { File, FileCollection } from '../../src/@types';
import * as fs from 'fs';

export const getFilesDirectory = () => {
    return path.resolve(__dirname, 'files');
};

export const createFile = (filename: string = 'test.pdf'): File => {
    const link = path.resolve(__dirname, 'files', filename);
    const size = fs.statSync(link).size;

    return {
        name: filename,
        path: link,
        tmpName: filename,
        size,
        type: 'application/pdf'
    };
};

export const createFileCollection = (filenames: string[] = ['test.pdf']): FileCollection => {
    const template: FileCollection = {
        name: [],
        path: [],
        tmpName: [],
        size: [],
        type: []
    };
    return filenames.reduce((result, filename) => {
        const link = path.resolve(__dirname, 'files', filename);
        const stat = fs.statSync(link);

        result.name.push(filename);
        result.path.push(link);
        result.tmpName.push(filename);
        result.size.push(stat.size);
        result.type.push('application/octet-stream');

        return result;
    }, template);
};