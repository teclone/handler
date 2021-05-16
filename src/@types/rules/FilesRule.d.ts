import { NumberOptions } from './NumberRules';
import BaseRule, { SuccessOrErrorMessage } from './BaseRule';
import { Data } from '..';
import Handler from '../../Handler';
import { FileEntry, FileEntryCollection } from '@teclone/r-server/lib/@types';

/**
 * @param file the file object
 */
type MoveToCallback = (
  file: FileEntry
) => Promise<SuccessOrErrorMessage> | SuccessOrErrorMessage;

export interface FileOptions<F extends string> extends NumberOptions<F> {
  /**
   * defines the list of accepted file extensions. defaults to empty list. file extensions
   * should not include the dot character
   */
  exts?: string | string[];
  /**
   * optional error message if file extension is not allowed
   */
  extErr?: string;

  /**
   * move to destination or a callback function that takes the object and uploads the file to somewhere, the function should set the file.path
   * and file.key values respectively if the upload succeeds
   */
  moveTo?: string | MoveToCallback;
}

export interface FileRule<F extends string> extends BaseRule<F> {
  type: 'file' | 'image' | 'audio' | 'video' | 'media' | 'document' | 'archive';

  /**
   * defines validation options to be used for file related field type validations
   * such as file, image, audio, video, media, archive, and document
   */
  options?: FileOptions<F>;

  defaultValue?: FileEntry | FileEntryCollection;
}
