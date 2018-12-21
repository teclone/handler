# Handler

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Handler is a **NodeJS** package that sits independently between the controller and the model, and asynchronously performs request data validation, conversion, serialization and integrity checks. It is easy to use and is independent of any framework or ORMs.

It makes the validation process easy and requires you to just define the data validation rules which are written in plain **JavaScript** objects.

The most interesting part is how easy it is to validate object of field data and files and the wide range of validation rule types that it affords by default. It is also extensible so that you can define more custom validation rules and types if the need be. See [How to Write Your Custom Validation Types](#how-to-define-custom-validation-types) for instructions.

Regarding database integrity checks, It supports both **NOSQL** and **Relational Databases**, at least. It is extensible enough to leave the DBChecker implementation up to you by defining a base `DBChecker` class (like an interface). This makes it not tied to any framework or database ORMs. See [How To Define Custom DBChecker](#how-to-define-custom-dbchecker) for instructions.

By default, it supports mongoose models when performing database integrity checks.

## Table of Content

- [Getting Started](#getting-started)

- [Usage Example](#usage-example)

- [Validation Rule Formats](#validation-rule-formats)

- [Data Filters](#data-filters)

- [Validation Types](#validation-types)

  - [Limiting Rule Validation](#limiting-rule-validations)

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

- [Dealing With Multi-Value Fields and Files](#dealing-with-multi-value-fields-and-files)

- [Specifying Accepted File Mime Types](#specifying-accepted-file-mime-types)

- [Conditional Require & Data Override](#conditional-require-&-data-override)

- [Ondemand Data Handling and Update](#ondemand-data-handling-and-update)

- [Data Expansion & Compaction for NoSQL](#data-expansion-&-compaction-for-nosql)

- [Performing Data Integrity Checks](#performing-data-integrity-checks)

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

## Validation Rule Formats

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

## Data Filters

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

10. **callback**: a callback function to execute. The callback method accepts the field value, performs some modifications, and returns the result of the operations.

```javascript
const rules = {
    country: {
        filters: {
            toLower: true //convert to lowercase
        }
    },
    comment: {
        filters: {
            stripTagsIgnore: ['p', 'br'] // or ['<p>', '<br>'] or 'p, br' or '<p> <br>', etc
        }
    },
    description: {
        filters: {
            callback: (value) => value,  //do some modifications and return the result
        }
    }
];
```

## Validation Types

The module defines lots of validation types that covers a wide range of validation cases. These includes the following:

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

You can define an absolute path to move the file to using the **moveTo** option. The file will be moved to the given location, with a hashed name computed for it. The hashed name is stored in the data property keyed in by the field name.

```javascript
//file UserHandler.js
import Handler from 'forensic-handler';
import path from 'path';
import fs from 'fs';
import UserModel from '../models/UserModel';

export class UserHandler extends Handler {

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

## Dealing With Multi-Value Fields and Files

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

## Specifying Accepted File Mime Types

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

## Conditional Require & Data Override

We can conditionally make a field required or not required using the `requireIf` or `requiredIf` option. We can also override a field's value conditionally using the `overrideIf` option. Such conditions include the following:

1. **If another field is checked or if it is not checked**

    ```javascript
    const rules = {
        'is-current-work': 'checkbox',

        'work-end-month': {
            type: 'range',
            options: {
                from: 1,
                to: 12
            },
            //if this is not user's current work, require the work-end-month
            requiredIf: {
                condition: 'notChecked',
                field: 'is-current-work'
            },
            //if this is user's current work, override work-end-month and set it to null
            overrideIf: {
                condition: 'checked',
                field: 'is-current-work',
                with: null
            }
        },

        'subscribe-newsletter': 'checkbox',

        email: {
            type: 'email',
            //if user decides to subscribe to our newsletter, require user email
            requiredIf: {
                condition: 'checked',
                field: 'subscribe-newsletter'
            },
            //if not, we override the email to empty string or null, even if email is supplied,
            //it will not be picked
            overrideIf: {
                condition: 'notChecked',
                field: 'subscribe-newsletter',
                with: null
            }
        }
    }
    ```

2. **If another field equals a given value or if it does not equal a given value**

    ```javascript
    const rules = {
        country: {
            type: 'choice',
            options: {
                choices: ['ng', 'us', 'gb', 'ca', 'gh'],
            }
        },

        //if your country is not Nigeria, tell us your country calling code
        countryCode: {
            requiredIf: {
                condition: 'notEqual',
                value: 'ng',
                field: 'country'
            }
        },

        //if you are in Nigeria, you must tell us your salary demand, other countries
        //are paid a fixed $60,000 per annum
        salaryDemand: {
            type: 'money',
            requireIf: {
                condition: 'equals',
                value: 'ng',
                field: 'country'
            },
            overrideIf: {
                condition: 'notEquals',
                field: 'country',
                value: 'ng',
                with: '60000'
            }
        }
    };
    ```

## Ondemand Data Handling and Update

When carrying out update operations, it is always good that we update only the fields that are supplied.

Hence, there is the need to filter, pick out and process rules for only fields that are supplied without making other fields mandatory.

This is easily achieved by passing in **true** as the first argument to the execute method. If there is need to still make some fields mandatory, then we can pass those array of fields as second argument to the execute method.

**The execute method signature is as shown below:**

```javascript
handler.execute(
    validateOnDemand=false: boolean,
    requiredFields: String|String[]
)
```

## Data Expansion & Compaction for NoSQL

When working with NoSql, there is always the need to expand data during creation, and compact data during updates.

The `mapDataToModel` method has this feature inbuilt. It will expand field data following the dot notation convention.

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

            password: 'password',

            'address.country': {
                type: 'choice',
                filters: {
                    toLower: true
                },
                options: {
                    choices: ['ng', 'de', 'fr', ...]
                }
            },

            'address.street': 'text',

            'address.zipCode': {
                options: {
                    regex: {
                        test: /^\d{6}$/,
                        err: '{this} is not a valid zip code'
                    }
                }
            }
        };

        /* return immediately if error is found */
        if (!(await this.execute()))
            return false;

        //proceed to create user account and return true
        const password = await bcrypt.hash(
            this.data.password,
            Number.parseInt(process.env.SALT_ROUNDS)
        );
        this.setData('password', password);

        // data will be be expanded to
        // {
        //     email: 'user email',
        //     password: 'hashed password',
        //     address: {
        //         country: 'country code',
        //         street: 'street address',
        //         zipCode: 'address zip code'
        //     }
        // }
        const data = this.mapDataToModel({});
        const user = await UserModel.create(data);

        this.setData('id', user.id);
        return true;
    }
}
```

When performing updates, it is always better to leave the data compact. Pass in false as second argument to `mapDataToModel` method.

```javascript
/* file UserHandler.js */
import Handler from 'forensic-handler';
import UserModel from '../models/UserModel.js';

export default class UserHandler extends Handler {

    async updateUser(userId) {
        /* define validation rules */
        const rules = {
            firstName: 'text',

            lastName: 'text',

            'address.country': {
                type: 'choice',
                filters: {
                    toLower: true
                },
                options: {
                    choices: ['ng', 'de', 'fr', ...]
                }
            },

            'address.street': 'text',

            'address.zipCode': {
                options: {
                    regex: {
                        test: /^\d{6}$/,
                        err: '{this} is not a valid zip code'
                    }
                }
            }
        };

        /* execute on demand, return immediately if error is found */
        if (!(await this.execute(true)))
            return false;

        await UserModel.findByIdAndUpdate(
            userId,
            {
                $set: this.mapDataToModel({}, false), //do not expand data
            }
        ).exec();

        return true;
    }
}
```

## Performing Data Integrity Checks

There is always the need to perform data integrity checks such as making sure that a given value exists or does not exists in a database.

The `check` option defines a single database integrity check while the `checks` option defines array of database integrity checks.

There are various options available when defining the check rules, whether working with NoSQL or relational databases. They are very much similar in structure:

- **model**: A model object that will be used in executing the query such as a mongoose model, etc.

- **query**: A select query object or string to be executed. If not given, it will be built from other available informations.

- **field**: the field part of the select query. if not given, it defaults to the field name under validation with camel casing or snake casing style applied to it depending on the case style in use. The case style in use can be set or updated using any of the **modelUseCamelCaseStyle()** and **modelUseSnakeCaseStyle()** methods. However, if working with relational databases, and the field value is an integer, it will default to **id**.

- **params**: array of parameters to pass in during query execution. If not given, it will default to array containing the field value.

- **callback**: a callback method to execute. The callback method should accept at least three arguments and return true if the integrity check fails. The first argument passed to the callback method is the **field name**, then the **field value**, then the handler **data** object. If you defined a **params** key, it will be passed in as fourth argument and so on, in spread format.

```javascript
//using relational database, example is mysql database the field property will default to 'id'
// because field value is an integer
const rules = {
    userId: {
        type: 'pint',
        check: {
            $if: 'notExists',
            table: 'users'
        }
    }
};

//tell the handler that we are running relational database
                |
                V
handler.modelUseRelational().setRules(rules).execute();
```

**Using Callback:**

```javascript
const rules = {
    userId: {
        type: 'pint',
        check: {
            callback: (field, value, data, param1, param2) => {
                return false; //dont set error
            },
            params: ['parameter one', 'parameter two']
        }
    }
};

//assumes nosql by default
handler.setRules(rules).execute();
```

### How to Define Custom Validation Types

The module is built to be extensible such that you can define custom validation types to suit your purpose. You would need to understand some basic things on how the module works.

To define custom validation types or even override inbuilt validation methods, the following steps are to be taken:

1. **Inherit from the main Validator:**

    ```javascript
    //file CustomValidator.js
    import Validator from 'forensic-handler/lib/Validator';

    export default class CustomValidator extends Validator {
        /**
         * define a name type validation
        */
        validateName(required, field, value, options, index=0) {
            options.min = 3;
            options.max = 15;

            options.regexAll = [
                //only alphabets, dash and apostrophe is allowed in names
                {
                    test: /^[-a-z\']$/i,
                    err: 'only alphabets, hyphen and apostrophe allowed in names'
                },
                //name must start with at least two alphabets
                {
                    test: /^[a-z]{2,}/i,
                    err: 'name must start with at least two alphabets'
                }
            ];

            return this.validateText(required, field, value, options, index);
        }
    }
    ```

2. **Inherit from the main Handler and integrate CustomValidator:**

    ```javascript
    //file CustomHandler.js
    import Handler from 'forensic-handler';
    import CustomValidator from './CustomValidator';

    export default class CustomHandler extends Handler {

        /**
         * create an instance of Custom Validator and pass along
        */
        constructor(source, files, rules, validator, dbChecker) {
            super(source, files, rules, new CustomValidator, dbChecker);
        }

        /**
         * override parent method, lets notify the handler that name rule type maps
         * to validateName method
         *@override
        */
        getRuleTypesMethodMap() {
            //let it know that name rule type maps to 'validateName' method
            return {
                ...super.getRuleTypesMethodMap(),
                name: 'validateName'
            }
        }
    }
    ```

3. **Use the new rule Type:**
    we can now use the **name** type in our validations.

    ```javascript
    /* file UserHandler.js */
    import Handler from './CustomHandler';
    import UserModel from '../models/UserModel.js';

    export default class UserHandler extends Handler {

        async updateUser(userId) {
            /* define validation rules */
            const rules = {
                firstName: 'name',

                lastName: 'name',

                'address.country': {
                    type: 'choice',
                    filters: {
                        toLower: true
                    },
                    options: {
                        choices: ['ng', 'de', 'fr', ...]
                    }
                },

                'address.street': 'text',

                'address.zipCode': {
                    options: {
                        regex: {
                            test: /^\d{6}$/,
                            err: '{this} is not a valid zip code'
                        }
                    }
                }
            };

            /* execute on demand, return immediately if error is found */
            if (!(await this.execute(true)))
                return false;

            await UserModel.findByIdAndUpdate(
                userId,
                {
                    $set: this.mapDataToModel({}, false), //do not expand data
                }
            ).exec();

            return true;
        }
    }
    ```

## How to Define Custom DBChecker

You can define your custom DBChecker to suit the current database and or ORM in use whether it is a relational or NOSQL database.

To define a custom dbchecker, the following steps are to be taken:

1. **Extend the main DBChecker, Override buildQuery and execute methods:**
    The example here uses mongodb driver.

    ```javascript
    //file connection.js
    import {MongoClient} from 'mongodb';
    const db = null;

    export default function() {
        if (db)
            return Promise.resolve(db);

        return new Promise((resolve, reject) => {
            const url = `mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`;
            MongoClient.connect(url, function(err, database) {
                if (err)
                    return reject(err);

                db = database;
                resolve(db);
            });
        });
    };

    //file CustomDBChecker.js
    import DBChecker from 'forensic-handler/lib/DBChecker';
    import connect from '../connection';

    export default class CustomDBChecker extends DBChecker {

        /**
         * override the buildQuery method. build query is called if there is no
         * query parameter defined in the dbchecker rule.
         *@override
        */
        buildQuery(options, value) {
            const result = {};
            result[options.field] = value;
            return result;

            //we could define the rule like below for relational databases such as mysql.
            //return `SELECT count(*) FROM ${options.entity} WHERE ${options.field} = ?`;
        }

        /**
         * override the execute method. it should resolve to the number of items
         * matching the select query.
        */
        execute(query, params, options) {
            //retrieve the collection
            const collection = await connect().collection(options.entity);

            return new Promise((resolve) => {
                //we can even use options.query. it is the same as the query parameter
                collection.find(query).toArray((err, docs) => {
                    if(err)
                        reject(err);
                    else
                        resolve(docs.length);
                })
            });
        }
    }
    ```

2. **Inherit from the main Handler and integrate CustomDBChecker:**

    ```javascript
    //file CustomHandler.js
    import Handler from 'forensic-handler';
    import CustomDBChecker from './CustomDBChecker';

    export default class CustomHandler extends Handler {

        /**
         * create an instance of Custom DBChecker and pass along
        */
        constructor(source, files, rules, validator, dbChecker) {
            super(source, files, rules, validator, new CustomDBChecker);
        }
    }
    ```

3. **Use the new db checker:**
    we can now use it performing database integrity checks.

    ```javascript
    /* file UserHandler.js */
    import Handler from './CustomHandler';

    export default class UserHandler extends Handler {

        async updateUser(userId) {
            /* define validation rules */
            const rules = {
                email: {
                    type: 'email',
                    check: {
                        if: 'exists',
                        collection: 'users',
                        field: 'email', //we can even leave it as it will default to email,
                        err: '{this} is already registered. use another please'
                    }
                },

                firstName: 'name',

                lastName: 'name',

                'address.country': {
                    type: 'choice',
                    filters: {
                        toLower: true
                    },
                    options: {
                        choices: ['ng', 'de', 'fr', ...]
                    }
                },

                'address.street': 'text',

                'address.zipCode': {
                    options: {
                        regex: {
                            test: /^\d{6}$/,
                            err: '{this} is not a valid zip code'
                        }
                    }
                }
            };

            /* execute on demand, return immediately if error is found */
            if (!(await this.execute(true)))
                return false;

            return true;
        }
    }
    ```