# Handler

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Handler is a **NodeJS** package that sits independently between the controller and the model, and asynchronously performs request data validation, conversion, serialization and integrity checks. It is easy to use and is independent of any framework or ORMs.

It makes the validation process easy and requires you to just define the data validation rules which are written in plain **JavaScript** objects.

The most interesting part is how easy it is to validate object of field data and files and the wide range of validation rule types that it affords by default. It is also extensible so that you can define more custom validation rules and types if the need be. See [How to Write Your Custom Validation Types](#how-to-write-your-custom-validation-types) for instructions.

Regarding database integrity checks, It supports both **NOSQL** and **Relational Databases**, at least, it is tested on **MongoDB** and **Mysql**, it is extensible enough to leave the DBChecker implementation up to you by defining an abstract `DBChecker` class. This makes it not tied to any framework, database ORMs. See [How To Implement the DBChecker Interface](#how-to-implement-the-dbchecker-interface) for instructions.

By default, it supports mongoose models when performing database integrity checks.

## Getting Started

**Install via npm**:

```bash
npm install --save forensic-handler
```

## Usage Example

**The Handler**:

```javascript
/* file UserHandler.js */
import Handler from 'forensic-handler';
import UserModel from '../models/UserModel.js';
import bcrypt from 'bcrypt';

export default class UserHandler extends Handler {

    async createUser() {
        /* define validation rules */
        const rules = {

            email: {
                type: 'email',

                hint: 'Enter account email address',

                filters: {
                    toLower: true,
                },

                check: {
                    if: 'exists',
                    model: UserModel,
                    err: '{this} is already registered. Please login instead'
                }
            },

            password1: 'password',

            password2: {
                type: 'password',
                matchWith: {
                    value: '{password1}',
                    err: 'Passwords did not match'
                },
            }
        };

        /* return immediately if error is found */
        if (!(await this.execute()))
            return false;

        //proceed to create user account and return true
        const password = await bcrypt.hash(
            this.data.password1,
            Number.parseInt(process.env.SALT_ROUNDS)
        );
        this.setData('password', password);

        //skip password1 and password2 when mapping data to model
        this.modelSkipFields(['password1', 'password2']);

        //data will be {email: 'user email', password: 'hashed password'}
        const data = this.mapDataToModel({});
        const user = await UserModel.create(data);

        this.setData('id', user.id);
        return true;
    }
}
```

**The Controller**:

```javascript
//file UserController.js
export default class UserController {
    setup(req, handler) {
        handler.setSource(req.body).setFiles(req.files);
    }

    createUser(req, res, handler) {
        this.setup(req, handler);
        return handler.createUser().then(status => {
            if (status) {
                return res.json({
                    status: 'success',
                    data: {
                        id: handler.data.id
                    }
                });
            }
            else {
                return res.json({
                    status: 'failed',
                    errors: handler.errors
                })
            }
        });
    }
}
```

**The Router**:

```javascript
//file UserRoutes.js
import {Router} from 'r-server';
import UserController from '../controllers/UserController';
import UserHandler from '../handlers/UserHandler';

const userRoutes = Router();
const controller = new UserController;

userRoutes.post('users', (req, res) => {
    return controller.createUser(req, res, new UserHandler);
});

export default userRoutes;
```

## Validation Rule Format

Validation rules are defined as JavaScript plain object keyed by the field names. Each field rule object can contain the following rule properties:

1. **type**: indicates the type of validation to carry out on the field. it defaults to **text**.

2. **required**: indicates if the field is required. defaults to true.

3. **default**: specifies the default value for a non required field. it defaults to **null**

4. **filters**: defines filter rules to apply to the field value(s) prior to validations, such as case conversion, type casting, html tag stripping, etc.

5. **check**: defines a single database integrity check to run on the field value(s).

6. **checks**: defines array of database integrity checks to run on the field value(s).

7. **options**: defines validation options specific to the specified validation type.

8. **requiredIf/requireIf**: defines a conditional clause, which if satisfied, makes the field required, else the field becomes optional.

To reference a validation principal, the convention used is to enclose the principal field name in curly braces within a string . '{field-name}'. The module will find and resolve such, replacing it with the field value.

Other conventions include `{this}` which references the current field value under validation; `{_this}` references the current field name under validation while `{_index}` references the current field value index position (in the case of validating array of fields).

Finally, there is the `{CURRENT_DATE}`, `{CURRENT_YEAR}`, `{CURRENT_TIME}` that references the current date, current year and current timestamp values respectively.

```javascript
const rules = {
    //validate first name. should be at least 3 characters
    'first-name': {
        type: 'text',
        options: {
            min: 3,
            minErr: '{_this} should be at least 3 charaters length'
        }
    },

    //validate last name. should be at least 3 characters
    'last-name': {
        type: 'text',
        options: {
            min: 3,
            minErr: '{_this} should be at least 3 charaters length'
        }
    },

    //validate middle name. should be at least 3 characters. it is optional
    'middle-name': {
        type: 'text',
        required: false,
        default: '', //it defaults to null if not defined
        options: {
            min: 3,
            minErr: '{_this} should be at least 3 charaters length'
        }
    },

    //we are expecting an array of favorite colors
    'favorite-colors': {
        type: 'choice',
        filters: {
            //convert the colors to lowercase
            toLower: true,

            /** we can also supply a callback function*/
            callback: value => value.toLowerCase()
        },
        options: {
            choices: ['green', 'white', 'blue', 'red', 'violet', 'purple'],
            err: 'color {_index} is not a valid color'
        }
    },

    // this is a checkbox type
    'subscribe-newsletter': 'checkbox',

    //email is required if user checks the subscribe checkbox,
    email: {
        type: 'email',
        err: '{this} is not a valid email address',
        requireIf: {
            condition: 'checked',
            field: 'subscribe-newsletter'
        }
    }
};
```

## Validation Filters

Filters are applied to the field values prior to validations. You can use filters to modify field values prior to validation. The available filters include:

1. **decode**: determines if `decodeURIComponent()` method should be called on the field value. defaults to true

2. **trim**: determines if `String.prototype.trim()` method should be called on the field value. defaults to true

3. **stripTags**: determines if html tags should be stripped out from the field value(s). Behaves like PHP's `strip_tags()`. Defaults to true

4. **stripTagsIgnore**: Defines array of html tags that should not be stripped out if `stripTags` or `stripTags` filter is set to true. defaults to empty array. **It can also be a string of comma or space separated html tags, rather than array**.

5. **numeric**: determines if the field value(s) should be cast to float. if the value is not numeric, it is cast to 0. defaults to false.

6. **toUpper**: determines if the field value(s) should be turned to uppercase. defaults to false

7. **toLower**: determines if the field value(s) should be turned to lowercase. defaults to false

8. **capitalize/capitalise**: determines if the first character of each field value should be uppercased, while others are lowercased. defaults to false. eg, given field value of `lonDON`, it is converted to `London`.

9. **compact/minimize/minimise**: determines if the field value should be minimised, with empty lines stripped out, and each line trimmed. This is handy when accepting computer processed values such as html text, markdown text, css text etc.

```javascript
const rules = {
    country: {
        filters: {
            toLower: true
        }
    },
    comment: {
        filters: {
            stripTagsIgnore: ['p', 'br'] // or ['<p>', '<br>'] or 'p, br' or '<p> <br>', etc
        }
    },
    country: {
        filters: {
            toLower: true // convert to lowecase
        }
    }
];
```

## Validation Types

The module defines lots of validation types that covers a wide range of validation cases. These includes the following:

- [Limiting Rule Validation](#limiting-rule-validation)

- [Regex Rule Validation](#regex-rule-validation)

- [MatchWith Rule Validation](#matchwith-rule-validation)

- [Date Validation](#date-validation)

- [Range Validation](#range-validation)

- [Choice Validation](#choice-validation)

- [Email Validation](#email-validation)

- [URL Validation](#url-validation)

- [Numeric Validation](#numeric-validation)

- [Password Validation](#password-validation)

- [File Validation](#file-validation)

- [Image File Validation](#image-file-validation)

- [Audio File Validation](#audio-file-validation)

- [Video File Validation](#video-file-validation)

- [Media File Validation](#media-file-validation)

- [Document File Validation](#document-file-validation)

- [Archive File Validation](#archive-file-validation)

### Limiting Rule Validation

The limiting rule validation options touches every validation. It is where we can define the limiting length of a string, date or numeric values. These includes the **min**, **max**, **gt** (greater than) and **lt** (less than) options.

```javascript
const rules = {
    'first-name': {
        //type defaults to text
        options: {
            min: 3,
            minErr: 'first name should be at least 3 characters length',
            max: 15
        }
    ],
    'favorite-integer': {
        type: 'positiveInteger',
        options: {
            'lt': 101, //should be less than 101, or max of 100.
        }
    },
    'date-of-birth': {
        type: 'date',
        options: {
            min: '01-01-1990', //only interested in people born on or after 01-01-1990
            max: '{CURRENT_DATE}'
        }
    },
};
```

### Regex Rule Validation

It is quite easy to carry out different flavours of regex rule tests on field value(s). There are four kinds of regex rules. These include single **regex** test, **regexAny**, **regexAll**, and **regexNone** tests.

For **regex** type, it must match the test, otherwise it is flagged as error. For **regexAny**, at least one of the tests must match. For **regexAll**, all regex tests must match. For **regexNone**, none of the regex tests should match.

```javascript
 const rules = {

    'first-name': {
        options: {
            regexAll: [
                //name must start with letter
                {
                    test: /^[a-z]/i,
                    err: 'name must start with an alphabet'
                },
                //only aphabets, dash and apostrophe is allowed in name
                {
                    test: /^[-a-z']+$/,
                    err: 'only alphabets, dash and apostrophe is allowed in names'
                }
            ]
        }
    },

    country: {
        options: {
            regex: {
                //we expect two letter country code.
                test: /^[a-z]{2}$/,
                err: '{this} is not a 2-letter country iso-code name'
            }
        }
    },

    'phone-number': {
        options: {
            regexAny: {
                //array of tests, we are ok if any of the test matches, else flag error
                tests: [
                    //phone number can match nigeria mobile number format
                    /^0[0-9]{3}[-\s]?[0-9]{3}[-\s]?[0-9]{4}$/,

                    //phone number can match uk mobile number format
                    /^07[0-9]{3}[-\s]?[0-9]{6}$/
                ],
                err: 'only nigeria and uk number formats are accepted'
            }
        }
    },

    'favorite-colors': {
        options: {
            //we dont accept black nor white colors.
            //note that we could combine the regex. just for example purposes.
            regexNone: [
                //we dont accept white as a color
                {
                    test: /^white$/i,
                    err: '{this} is not an acceptable color'
                },
                //we dont accept black either
                {
                    test: /^black$/i,
                    err: '{this} is not an acceptable color'
                },
            ],
        },
    },
};
```

### MatchWith Rule Validation

This rule is handy when you want to make sure that a field's value matches another field's value such as in password confirmation fields as well as email and phone confirmation scenerios.

```javascript
const rules = {
    password1: 'password',

    password2: {
        type: 'password',
        options: {
            matchWith: '{password1}', //reference to password1 value
            err: 'Passwords do not match'
        },
    },
};
```

### Date Validation

To validate dates, set the type property to *'date'*. You can specify [limiting rules](#limiting-rule-validation) that validates if the date is within a given limited range.

```javascript
const rules = {
    'date-of-birth': {
        type: 'date',
        options: {
            min: '01-01-1990', //only interested in people born on or after 01-01-1990
            max: '{CURRENT_DATE}'
        }
    },
};
```

### Range Validation

To validate field as a range of values, set the type property to **range**. The range type accepts three more options keys, which are **from**, **to** and the optional **step** key that defaults to 1.

```javascript
const rules = {
    day: {
        type: 'range',
        options: {
            from: 1,
            to: 31,
        },
    },

    month: {
        type: 'range',
        options: {
            from: 1,
            to: 12,
        },
    },

    year: {
        type: 'range',
        options: {
            from: 1950,
            to: '{CURRENT_YEAR}',
        },
    },

    even-number: {
        type: 'range',
        options: {
            from: 0,
            to: 100,
            step: 2,
            err: '{this} is not a valid even number between 0-100'
        },
    },

    even-alphabet: {
        type: 'range',
        options: {
            from: 'A',
            to: 'Z',
            step: 2,
            err: '{this} is not a valid even alphabet between A-Z'
        },
    }
};
```

### Choice Validation

To validate field against a choice of options, set the type property to **choice**. Acceptable options are specified using the **choices** property as array. The [range](#range-validation) type makes use of this type validator internally.

```javascript
const rules = {
    country: {
        type: 'choice',
        options: {
            choices: ['ng', 'gb', 'us', 'ca', 'de', ],// array of country codes,
            err: '{this} is not a valid country code'
        },
    },
};
```

### Email Validation

To validate email addresses, set the type property to `email`.

```javascript
const rules = {
    email: 'email',
};
```

### URL Validation

To validate url, set the type property to `url`. the `schemes` option is optional. It defines the list of acceptable schemes.

```javascript
const rules = {
    website: {
        type: 'url',
        schemes: ['https', 'http'], //
    },
};

//schemes option is optional. it currently defaults to:
// [
//     'http',
//     'https',
//     'ssh',
//     'ftp',
//     'smtp',
//     'telnet',
//     'imap',
//     'ip',
//     'ssl',
//     'pop3',
//     'sip',
//     'ws',
//     'wss'
// ]
```

### Numeric Validation

To validate numeric values, whether floating or integers, there are nice validation types defined for such cases. These include the following types: **float** (**money** or **number**), **positiveFloat** or **pFloat**, **negativeFloat** or **nFloat**, **integer** or **int**, **positiveInteger** (**positiveInt**, **pInteger** or **pInt**), and **negativeInteger** (**negativeInt**, **nInteger** or **nInt**)

```javascript
const rules = {
    'favorite-number': 'number',
    userId: 'positiveInt'
}
```

### Password Validation

Password validation is more like text validation except that some limiting rules and regex rules were added. The default implementation is that passwords must be at least 8 charaters long, and 28 characters max. It must contain at least two alphabets and at least two non-alphabets. You can override this default if you like.

The current implementation looks like below

```javascript
const options = {
    min: 8,
    max: 28,
    regexAll: [
        //password should contain at least two letter alphabets
        {
            test: /[a-z].*[a-z]/i,
            err: 'Password must contain at least two letter alphabets'
        },
        //password should contain at least two non alphabets
        {
            test: /[^a-z].*[^a-z]/i,
            err: 'Password must contain at least two non letter alphabets'
        },
    ]
};
```

### File Validation

The module can validate files, including the integrity of file mime types. It offers wide flavours of file validation types such as **images**, **videos**, **audios**, **documents** and **archives**.

File size units are recognised accurately that includes **bytes**, **kb**, **mb**, **gb** and **tb**.

```javascript
const rules = {
    picture: {
        type: 'file',
        options: {
            min: '50kb'
        }
    }
};
```

You can define an absolute path to move the file to using the **moveTo** option. The file will be moved to the given location, witha hashed name computed for it. The hashed name is stored in the data property keyed in by the field name.

```javascript
//file UserHandler.js
import Handler from 'forensic-handler';
import path from 'path';
import fs from 'fs';
import UserModel from '../models/UserModel';

export class UserHandle extends Handler {

    updateProfilePicture(userId) {
        const rules = {
            picture: {
                type: 'file',
                options: {
                    moveTo: path.join(__dirname, '../../storage/media/pictures');
                }
            }
        };

        //return immediately if errors are found
        if (!this.setRules(rules).execute())
            return false;

        //read file and upload to our azure blob storage host.
        const filePath = moveTo + '/' + this.data.picture;

        const remoteUrl = ''; //remote url as returned from our upload
        await UserModel.findByIdAndUpdate(userId, {
            $set: {
                profilePicture: remoteUrl
            }
        }).exec();

        //delete the file
        fs.unlinkSync(filePath);

        return true;
    }
}
```

### Dealing With Multi-Value Fields and Files

The handler can process multi-value fields and file fields. The field values are stored inside arrays after processing. Checkout [RServer](https://github.com/harrison-ifeanyichukwu/r-server) for multi-field value and files handling.

```javascript
//file UserHandler.js
import Handler from 'forensic-handler';
import path from 'path';
import fs from 'fs';
import UserModel from '../models/UserModel';

export default class UserHandler extends Handler {

    addPictures(userId) {
        const rules = {
            //pictures is an array of uploaded files. RServer handles multiple
            pictures: {
                type: 'image',
                options: {
                    moveTo: path.join(__dirname, '../../storage/media/pictures');
                }
            }
        };

        //return immediately if errors are found
        if (!this.setRules(rules).execute())
            return false;

        const remoteUrls = [];
        for (const filename of this.data.pictures) {
            //read file and upload to our azure blob storage host.
            const filePath = moveTo + '/' + filename;

            const remoteUrl = ''; //remote url as returned from our upload
            remoteUrls.push(remoteUrl);

            //delete the file
            fs.unlinkSync(filePath);
        }

        const user = UserModel.findById(userId);

        user.pictures.push(...remoteUrls);
        await user.save();

        return true;
    }
}
```

### Specifying Accepted File Mimes Extensions

You can specify the accepted mime file extensions during validation. Note that the handler has a `FileExtensionDetector` module that detects file extensions based on its first magic byte. Hence, limiting file extension spoofing errors.

Also note that the current list of file magic bytes are still being updated, you can help us by reporting to us more magic bytes codes that are missing.

To specify accepted mimes, use the `mimes` options.

```javascript
const rules = {
    picture: {
        type: 'file', //we could have used image, just for demonstration purposes
        options: {
            max: '400kb',
            mimes: ['jpeg', 'png'],
            mimeErr: 'we only accept jpeg and png images'
        }
    }
};
```

### Image File Validation

The shortest way to validate image files is to use the `image` type option. The accepted mimes for images include **JPEG**, **PNG** and **GIF**.

```javascript
const rules = {
    picture: {
        type: 'image',
        options: {
            max: '400kb'
        }
    }
};
```

### Audio File Validation

The easiest way to validate audio files is to use the `audio` type option. The accepted mimes for audios include **MP3** and others.

```javascript
const rules = {
    picture: {
        type: 'audio',
        options: {
            max: '15mb'
        }
    }
};
```

### Video File Validation

The shortest way to validate video files is to use the `video` type option. The accepted mimes for videos include **MP4**, **OGG**, **MOVI**, and others.

```javascript
const rules = {
    picture: {
        type: 'video',
        options: {
            max: '400mb'
        }
    }
};
```

### Media File Validation

The shortest way to validate media files (videos, images and audios) is to use the `media` type option. The accepted mimes is a combination of **video**, **image** and **audio** mimes.

```javascript
const rules = {
    picture: {
        type: 'media',
        options: {
            max: '400mb'
        }
    }
};
```

### Document File Validation

The most convenient way to validate document files is to use the `document` type option. The accepted mimes for documents include **DOCX**, **PDF** and **DOC**, and others.

```javascript
const rules = {
    picture: {
        type: 'document',
        options: {
            max: '50mb'
        }
    }
};
```

### Archive File Validation

The shortest way to validate archive files is to use the `archive` type option. The accepted mimes for archives include **ZIP**, **TAR.GZ** and **TAR**, and others.

```javascript
const rules = {
    picture: {
        type: 'archives',
        options: {
            max: '100mb'
        }
    }
};
```