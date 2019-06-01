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
export declare interface DataSource {
    [field: string]: RawData;
}


export declare type DataValue = string | number | boolean | string[] | number[] | boolean[];
export declare interface Data {
    [field: string]: DataValue;
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

export declare interface ErrorBag {
    [field: string]: string;
}


export declare interface DataTypeMethodMap {

    // boolean rules
    checkbox: string;
    boolean: string;

    //text rules
    text: string;
    email: string;
    url: string;
    password: string;

    //number rules
    int: string;
    pInt: string;
    nInt: string;
    number: string;
    nNumber: string;
    pNumber: string;
    money: string;
    date: string;

    //choice rules
    range: string;
    choice: string;

    //file rules
    file: string;
    image: string;
    audio: string;
    video: string;
    media: string;
    document: string;
    archive: string;
}
export declare type DataType = keyof DataTypeMethodMap;


export declare type RequiredIf = {
    if: 'checked' | 'notChecked',
    field: string;
} | {
    if: 'equals' | 'notEquals',
    field: string;
    value: string | boolean | number;
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

export declare type Options = BaseOptions | NumberOptions | TextOptions | RangeOptions
    | ChoiceOptions;
export declare interface DBCheck {}


export declare type Rule = BooleanRule | CheckboxRule | TextRule | EmailRule | URLRule
    | PasswordRule | IntegerRule | NIntegerRule | PIntegerRule | NumberRule | NNumberRule
    | PNumberRule | DateRule | RangeRule | ChoiceRule | FileRule | ImageFileRule | AudioFileRule
    | VideoFileRule | MediaFileRule | DocumentFileRule | ArchiveFileRule;
export declare interface Rules {
    [field: string]: DataType | Rule
}


export declare interface ResolvedRule {

    type: DataType;

    required: boolean;

    hint: string;

    defaultValue: RawData | undefined;

    requiredIf?: RequiredIf;

    options: Options;

    filters: Filters;

    checks: DBCheck[];
}
export declare interface ResolvedRules {
    [field: string]: ResolvedRule;
}


export declare type DateConverter = (value: string) => CustomDate;