import { NumberOptions } from './NumberRules';
import BaseRule from './BaseRule';

export declare interface FileOptions extends NumberOptions {
    /**
     * defines the list of accepted file extensions. defaults to empty list. file extensions
     * should not include the dot character
     */
    exts?: string | string[];
    /**
     * optional error message if file extension is not allowed
     */
    extErr?: string;

    moveTo?: string;
}

export declare interface BaseFileRule extends BaseRule {
    /**
     * defines validation options to be used for file related field type validations
     * such as file, image, audio, video, media, archive, and document
     */
    options?: FileOptions;
}

//file rules
export declare interface FileRule extends BaseFileRule {
    type: 'file';
}

export declare interface ImageFileRule extends BaseFileRule {
    type: 'image';
}

export declare interface AudioFileRule extends BaseFileRule {
    type: 'audio';
}

export declare interface VideoFileRule extends BaseFileRule {
    type: 'video';
}

export declare interface MediaFileRule extends BaseFileRule {
    type: 'media';
}

export declare interface DocumentFileRule extends BaseFileRule {
    type: 'document';
}

export declare interface ArchiveFileRule extends BaseFileRule {
    type: 'archive';
}