import CustomDate from '../CustomDate';
import { BooleanRule, CheckboxRule } from './rules/BooleanRules';
import { TextRule, EmailRule, URLRule, PasswordRule, TextOptions } from './rules/TextRules';
import {
    IntegerRule, NIntegerRule, PIntegerRule, NumberRule, NNumberRule, PNumberRule,
    DateRule, NumberOptions
} from './rules/NumberRules';
import RangeRule, { RangeOptions } from './rules/RangeRule';
import ChoiceRule, { ChoiceOptions } from './rules/ChoiceRule';
import BaseRule, { BaseOptions } from './rules/BaseRule';
import {
    FileRule, ImageFileRule, AudioFileRule, VideoFileRule, MediaFileRule,
    DocumentFileRule, ArchiveFileRule
} from './rules/FilesRule';

export declare type RawData = string | string[];

export declare type DataSource = {
    [field: string]: RawData;
}

export declare type DataValue = string | number | boolean | string[] | number[] | boolean[];

export declare type Data<F extends string> = {
    [P in F]: DataValue;
}

export declare interface CustomData {
    [P: string]: any;
}

export declare type ErrorBag<F extends string> = {
    [P in F]: string;
}


export declare interface File {
    name: string;
    tmpName: string;
    path: string;
    size: number;
    type: string;
}
export declare interface FileCollection {
    name: string[];
    tmpName: string[];
    path: string[];
    size: number[];
    type: string[];
}
export declare interface FilesSource {
    [fieldName: string]: File | FileCollection
}


export declare type Unit = 'character' | 'number' | 'date' | 'file';


export declare interface Regex {
    pattern: RegExp;
    err?: string;
}


export declare type DataType = 'checkbox' | 'boolean' | 'text' | 'email' | 'url' | 'password' |
    'int' | 'pInt' | 'nInt' | 'number' | 'pNumber' | 'nNumber' | 'money' | 'date' | 'range' |
    'choice' | 'file' | 'image' | 'audio' | 'video' | 'media' | 'document' | 'archive';


export declare type DBCheckType = 'exists' | 'notExists';


export declare type RequiredIf = {
    if: 'checked' | 'notChecked',
    field: string;
} | {
    if: 'equals' | 'notEquals',
    field: string;
    value: string | boolean | number;
}

export declare type OverrideIf = {
    if: 'checked' | 'notChecked',
    field: string;
    with: RawData;
} | {
    if: 'equals' | 'notEquals',
    field: string;
    value: string | boolean | number;
    with: RawData;
}

export declare type FilterCallback = (value: string) => string | number | boolean;

export declare interface Filters {
    decode?: boolean;
    stripTags?: boolean;
    stripTagsIgnore?: string | string[];
    minimize?: boolean;
    trim?: boolean;
    toNumeric?: boolean;
    toUpper?: boolean;
    toLower?: boolean;
    capitalize?: boolean;
    callback?: FilterCallback
}

export declare type Options = BaseOptions | NumberOptions | TextOptions | RangeOptions | ChoiceOptions;


export declare interface ModelDBCheck {
    if: DBCheckType;
    model: object;
    field?: string;
    query?: object;
    err?: string;
}
export declare interface CallbackDBCheck {
    if: DBCheckType;
    callback: (fieldName: string, fieldValue: DataValue, fieldIndex: number) => Promise<boolean>;
    err?: string;
}
export declare type DBCheck = CallbackDBCheck | ModelDBCheck;


export declare type Rule<F extends string> = BooleanRule<F> | CheckboxRule<F> | TextRule<F>
    | EmailRule<F> | URLRule<F> | PasswordRule<F> | IntegerRule<F> | NIntegerRule<F>
    | PIntegerRule<F> | NumberRule<F> | NNumberRule<F> | PNumberRule<F> | DateRule<F>
    | RangeRule<F> | ChoiceRule<F> | FileRule<F> | ImageFileRule<F> | AudioFileRule<F>
    | VideoFileRule<F> | MediaFileRule<F> | DocumentFileRule<F> | ArchiveFileRule<F>;

export declare type Rules<F extends string> = {
    [P in F]: DataType | Rule<F>;
}


export declare interface ResolvedRule<F extends string> {

    type: DataType;

    required: boolean;

    hint: string;

    defaultValue: RawData | undefined;

    requiredIf?: RequiredIf;

    overrideIf?: OverrideIf;

    options: Options;

    filters: Filters;

    checks: DBCheck[];

    /**
     * computes and return a new value for the field. it accepts two arguments
     * field value, and data object
     */
    postCompute?: (value: DataValue, data: Data<F>) => Promise<DataValue>;

    /**
     * runs a post validation process on the field. returns true if validation succeeds or returns
     * error message if validation fails
     */
    postValidate?: (value: DataValue, data: Data<F>) => Promise<true | string>;
}
export declare type ResolvedRules<F extends string> = {
    [P in F]: ResolvedRule<F>;
}


export declare type DateConverter = (value: string) => CustomDate;