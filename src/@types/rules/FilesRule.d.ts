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

export declare interface BaseFileRule<F extends string> extends BaseRule<F> {
  /**
   * defines validation options to be used for file related field type validations
   * such as file, image, audio, video, media, archive, and document
   */
  options?: FileOptions;
}

//file rules
export declare interface FileRule<F extends string> extends BaseFileRule<F> {
  type: 'file';
}

export declare interface ImageFileRule<F extends string> extends BaseFileRule<F> {
  type: 'image';
}

export declare interface AudioFileRule<F extends string> extends BaseFileRule<F> {
  type: 'audio';
}

export declare interface VideoFileRule<F extends string> extends BaseFileRule<F> {
  type: 'video';
}

export declare interface MediaFileRule<F extends string> extends BaseFileRule<F> {
  type: 'media';
}

export declare interface DocumentFileRule<F extends string> extends BaseFileRule<F> {
  type: 'document';
}

export declare interface ArchiveFileRule<F extends string> extends BaseFileRule<F> {
  type: 'archive';
}
