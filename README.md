# Handler

[![Build Status](https://travis-ci.org/teclone/handler.svg?branch=master)](https://travis-ci.org/teclone/handler)
[![Coverage Status](https://coveralls.io/repos/github/teclone/handler/badge.svg?branch=master)](https://coveralls.io/github/teclone/handler?branch=master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm version](https://badge.fury.io/js/%40teclone%2Fhandler.svg)](https://badge.fury.io/js/%40teclone%2Fhandler)
![npm](https://img.shields.io/npm/dt/%40teclone%2Fhandler.svg)

**Handler** is a **NodeJS** module that sits independently between the controller and the model, and asynchronously performs request data validation, serialization and database integrity checks. It has excellent error reporting with wide range of validation rules. It can be used with **relational and non-relational databases/ORMs**.

All validation rules are defined in plain **JS** objects. **Handler** supports **Mongoose Models** by default when working with **non-relational** databases such as **MongoDB** and supports **Sequelize Models** by default when working with **relational** databases such as **Postgres, Mysql, etc**.

It is extensible, customizable so that you can define more custom validation rules whenever needed.

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

  - [Phone Number Validation](#phone-number-validation)

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

## Getting Started

**Install via npm**:

```bash
npm install --save handler
```

## Development & Testing

before working with development version of this project and running test, you need to setup **mysql** database and connection credentials, and also **Mongodb**. create a `.env` file for setting up your relational database credentials using the `.env.example` file.

## Usage Example

**The Handler**:

```typescript
import Server from '@teclone/r-server'; // import rserver
import Handler from '@teclone/handler';
import UserModel from './models/UserModel'; //import model
import bcrypt from 'bcrypt';

const app = Server.create(); // create server instance

app.post('/signup', async (req, res) => {
  const handler = new Handler<'email' | 'password1' | 'password2' | 'id'>(
    req.data,
    req.files,
    {
      email: {
        type: 'email',
        checks: {
          that: `itDoesNotExist`,
          model: UserModel,
          err: 'email address already exist, login instead',
        },
      },
      password1: {
        type: 'password',
        compute: async function (fieldName, value) {
          return await bcrypt.hash(
            value,
            Number.parseInt(process.env.SALT_ROUNDS)
          );
        },
      },

      password2: {
        type: 'password',
        shouldMatch: 'password1',
      },
    }
  );

  if (await handler.execute()) {
    const data = handler
      .model()
      .skipFields('password2')
      .renameField('password1', 'password')
      .export();
    const user = await UserModel.create(data);
    handler.data.id = user.id;
  }

  if (handler.succeeds()) {
    return res.json({
      status: 'success',
      data: {
        id: handler.data.id,
      },
    });
  } else {
    return res.json(
      {
        status: 'failed',
        errors: handler.errors,
      },
      400
    );
  }
});

app.listen(null, () => {
  console.log('listening');
});
```

## Validation Rule Formats

Validation rules are defined as JavaScript plain objects keyed by their field names. Each field rule can contain the following properties:

1. **type**: indicates the type of validation to carry out on the field. it defaults to **text**.

2. **required**: it is a boolean or conditional require object that indicates if the field is required. defaults to true.

3. **defaultValue**: specifies the default value for a non required field

4. **filters**: defines filters to apply to the field value(s) prior to validations, such as case conversion, type casting, html tag removal, trimming, etc.

5. **checks**: defines database integrity checks to run on the field value(s).

6. **options**: defines extra validation options specifically for the field.

There are certain placeholder formats that can be used to refrence certain values. This includes **`{value}`** which references the current field value under validation; **`{name}`** references the current field name under validation while **`{index}`** references the current field value index position (in the case of validating array of fields).

Moreover, there is the **`{CURRENT_DATE}`**, **`{CURRENT_YEAR}`**, and **`{CURRENT_TIME}`** that references the current date, current year and current timestamp values respectively.

**Example:**

```typescript
const rules: Rules<
  | 'first-name'
  | 'last-name'
  | 'middle-name'
  | 'favorite-colors'
  | 'subscribe-newsletter'
  | 'email'
> = {
  //validate first name. should be at least 3 characters
  'first-name': {
    options: {
      min: 3,
      minErr: '{name} should be at least 3 charaters length',
    },
  },

  //validate last name. should be at least 3 characters
  'last-name': {
    options: {
      min: 3,
      minErr: '{name} should be at least 3 charaters length',
    },
  },

  //validate middle name. should be at least 3 characters. it is optional
  'middle-name': {
    required: false,
    options: {
      min: 3,
      minErr: '{name} should be at least 3 charaters length',
    },
  },

  //we are expecting an array of favorite colors
  'favorite-colors': {
    type: 'choice',
    filters: {
      //convert the colors to lowercase
      toLower: true,
      /** we can also supply a callback function*/
      callback: (value) => value.toLowerCase(),
    },
    options: {
      choices: ['green', 'white', 'blue', 'red', 'violet', 'purple'],
      err: 'color number {index} is not a valid color', // or `{value} is not a valid color`,
    },
  },

  // this is a checkbox type or boolean
  'subscribe-newsletter': 'checkbox',

  //email is required if user checks the subscribe checkbox,
  email: {
    type: 'email',
    err: '{value} is not a valid email address',
    required: {
      if: 'checked',
      field: 'subscribe-newsletter',
    },
  },
};
```

## Data Filters

You can use filters to modify field values before validation. The available filters include:

1. **decode**: determines if `decodeURIComponent()` method should be called on the field value. defaults to true

2. **trim**: determines if `String.prototype.trim()` method should be called on the field value. defaults to true

3. **stripTags**: determines if html tags should be stripped out from the field value(s). Behaves like PHP's `strip_tags()`. Defaults to true

4. **stripTagsIgnore**: Defines array of html tags that should not be stripped out if `stripTags` filter is set to true. defaults to empty array. **It can also be a string of comma or space separated html tags, rather than array**.

5. **numeric**: determines if the field value(s) should be cast to float. if the value is not numeric, it is cast to 0. defaults to false.

6. **uppercase**: determines if the field value(s) should be turned to uppercase. defaults to false

7. **lowercase**: determines if the field value(s) should be turned to lowercase. defaults to false

8. **capitalize**: determines if the first character of each field value should be uppercased, while others are lowercased. defaults to false. eg, given field value of `lonDON`, it is converted to `London`.

9. **minimize**: determines if the field value should be minimised, with empty lines stripped out, and each line trimmed. This is handy when accepting computer processed values such as html text, markdown text, css text etc.

10. **callback**: a callback function to execute. The callback method accepts the field value, performs some modifications, and returns the result of the operations.

```typescript
const rules: Rules<'country' | 'comment' | 'description'> = {
    country: {
        filters: {
            lowercase: true //convert to lowercase
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

The module defines lots of validation types that covers a wide range of validation cases that includes the following:

### Limiting Rule Validation

The limiting rule validation options touches every validation. It is where we can define the limiting length of a string, date or numeric values. These includes the **min**, **max**, **gt** (greater than) and **lt** (less than) options.

```typescript
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
        type: 'pInt',
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

It is quite easy to carry out different flavours of regex rule tests on field value(s). There are four kinds of regex rules. These include **regex**, **regexAny**, and **regexNone**.

**regex** test defines one or more regex patterns that the value must match, otherwise it is flagged as error. For **regexAny**, at least one of the tests must match. For **regexAll**, all regex tests must match. For **regexNone**, none of the regex tests should match.

```typescript
const rules = {
  'first-name': {
    options: {
      regex: [
        //name must start with letter
        {
          pattern: /^[a-z]/i,
          err: 'name must start with an alphabet',
        },
        //only aphabets, dash and apostrophe is allowed in name
        {
          pattern: /^[-a-z']+$/,
          err: 'only alphabets, dash and apostrophe is allowed in names',
        },
      ],
    },
  },

  country: {
    options: {
      regex: {
        //we expect two letter country code.
        pattern: /^[a-z]{2}$/,
        err: '{value} is not a 2-letter country iso-code name',
      },
    },
  },

  'phone-number': {
    options: {
      regexAny: {
        //array of tests, we are ok if any of the test matches, else flag error
        patterns: [
          //phone number can match nigeria mobile number format
          /^0[0-9]{3}[-\s]?[0-9]{3}[-\s]?[0-9]{4}$/,

          //phone number can match uk mobile number format
          /^07[0-9]{3}[-\s]?[0-9]{6}$/,
        ],
        err: 'only nigeria and uk number formats are accepted',
      },
    },
  },

  'favorite-colors': {
    options: {
      //we dont accept black nor white colors.
      //note that we could combine the regex. just for example purposes.
      regexNone: [
        //we dont accept white as a color
        {
          pattern: /^white$/i,
          err: '{value} is not an acceptable color',
        },

        //we dont accept black either
        {
          pattern: /^black$/i,
          err: '{value} is not an acceptable color',
        },
      ],
    },
  },
};
```

### shouldMatch Rule Validation

This rule is handy when you want to make sure that a field's value matches another field's value such as in password, email and phone number confirmation cases.

```typescript
const rules = {
  password1: 'password',
  password2: {
    type: 'password',
    shouldMatch: 'password1', // or {field: 'password1', err: 'passwords did not match, please try again'},
  },
};
```

### Date Validation

To validate dates, set the type property to `date`. You can specify [limiting rules](#limiting-rule-validation) that validates if the date is within a given range.

```typescript
const rules = {
  'date-of-birth': {
    type: 'date',
    options: {
      min: '01-01-1990', //only interested in people born on or after 01-01-1990
      max: '{CURRENT_DATE}',
    },
  },
};
```

### Range Validation

To validate field as a range of values, set the type property to **range**. The range type accepts three more options keys, which are **from**, **to** and the optional **step** key that defaults to `1`.

```typescript
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

  even_number: {
    type: 'range',
    options: {
      from: 0,
      to: 100,
      step: 2,
      err: '{value} is not a valid even number between 0-100',
    },
  },

  even_alphabet: {
    type: 'range',
    options: {
      from: 'A',
      to: 'Z',
      step: 2,
      err: '{value} is not a valid even alphabet between A-Z',
    },
  },
};
```

### Choice Validation

To validate field against a choice of options, set the type property to **choice**. Acceptable options are specified using the **choices** property as array. The [range](#range-validation) type makes use of this type validator internally.

```typescript
const rules = {
  country: {
    type: 'choice',
    options: {
      choices: ['ng', 'gb', 'us', 'ca', 'de'], // array of country codes,
      err: '{value} is not a valid country code',
    },
  },
};
```

### Email Validation

To validate email addresses, set the type property to `email`.

```typescript
const rules = {
  email: 'email',
};
```

### URL Validation

To validate url, set the type property to `url`. the `schemes` option is optional. It defines the list of acceptable schemes.

```typescript
const rules = {
  website: {
    type: 'url',
    options: {
      schemes: ['https', 'http'],
      mustHaveScheme: true, //false by default
    },
  },
};
```

### Phone Number Validation

To validate phone numbers, set the type property to `number`. The validation is performed using [libphonenumber.js](https://www.npmjs.com/package/libphonenumber-js) module.

```typescript
const rules = {
  country: {
      type: 'choice',
      options: {
          choices: ['us', 'ng', 'de', 'ca', .....],
      }
  },

  //we want the phone number to be a valid phone number for the selected country
  phoneNumber: {
    type: 'phone-number',
    options: {
        country: '{country}',
        format: 'INTERNATIONAL', // we want the number to be formatted with country code before we save it
    },
  },
};
```

### Numeric Validation

To validate numeric values, whether floating or integers, there are nice validation types defined for such cases. These include the following types: **money**, **number**, **nNumber**, **pNumber**, **int**, **pInt**, and **nInt**.

```typescript
const rules = {
  amount: 'money',
  userId: 'pInt',
};
```

### Password Validation

Password validation is more like text validation except that some limiting rules and regex rules were added. The default implementation is that passwords must be at least 8 charaters long, and 26 characters max. It must contain at least two alphabets and at least two non-alphabets. You can disable this by setting the **preValidate** option to false.

```typescript
const rules = {
  password: {
    type: 'password',
    preValidate: false, // disables default password rules
  },
};
```

### File Validation

The module can validate files, including the integrity of file mime types with the help of (**file-type**). It offers wide flavours of file validation types such as **image**, **video**, **audio**, **document**, **archive** and finally the generic **file** validation type.

Use of file memory units are recognised such as **kb**, **mb**, **gb** and **tb**.

```typescript
const rules = {
  picture: {
    type: 'image',
    options: {
      min: '50kb',
    },
  },
};
```

You can define an absolute path to move the file to using the **moveTo** option. The file will be moved to the given location, with a hashed name computed for it. The hashed name is stored in the data property keyed in by the field name.

```typescript
import Server from '@teclone/r-server'; // import rserver
import Handler from '@teclone/handler';
import UserModel from './models/UserModel'; //import model
import * as path from 'path';

const app = Server.create(); // create server instance

app.post('/profile-picture', async (req, res) => {

    const moveTo = path.join(__dirname, '../uploads/images/profile-pictures');
    const handler = new Handler(req.data, req.files, {
        picture: {
            type: 'file',
            options: {
                moveTo: path.join(__dirname, '../uploads/images/profile-pictures');
            }
        }
    });

    if (await handler.execute()) {
        await UserModel.findByIdAndUpdate(req.user.id, {
            $set: {
                profilePix: this.data.picture
            }
        }).exec();
    }

    if (handler.succeeds()) {
        return res.json({
            status: 'success',
            data: {
                profilePicture: handler.data.picture
            }
        });
    }
    else {
        return res.json({
            status: 'failed',
            errors: handler.errors
        }, 400);
    }
});

app.listen(null, () => {
    console.log('listening');
});
```

### Image File Validation

```typescript
const rules = {
  picture: {
    type: 'image',
    options: {
      max: '400kb',
    },
  },
};
```

### Audio File Validation

```typescript
const rules = {
  picture: {
    type: 'audio',
    options: {
      max: '15mb',
    },
  },
};
```

### Video File Validation

```typescript
const rules = {
  picture: {
    type: 'video',
    options: {
      max: '400mb',
    },
  },
};
```

### Media File Validation

Media files are one of **image**, **audio** and **video**.

```typescript
const rules = {
  picture: {
    type: 'media',
    options: {
      max: '400mb',
    },
  },
};
```

### Document File Validation

```typescript
const rules = {
  picture: {
    type: 'document',
    options: {
      max: '50mb',
    },
  },
};
```

### Archive File Validation

examples of archives files are **.zip**, **.tar.gz** and **.rar** files.

```typescript
const rules = {
  picture: {
    type: 'archive',
    options: {
      max: '100mb',
    },
  },
};
```

## Dealing With Multi-Value Fields and Files

The handler can process multi-value fields and file fields. The field values are stored inside arrays after processing. Checkout [RServer](https://github.com/teclone/r-server) for multi-field value and files handling.

## Specifying Accepted File Extensions

You can specify the accepted file extensions during validation. To specify accepted file extensions during file validations, use the **exts** option.

To specify accepted mimes, use the `mimes` options.

```javascript
const rules = {
  picture: {
    type: 'file', //we could have used image, just for demonstration purposes
    options: {
      max: '400kb',
      exts: ['jpeg', 'png'],
      extErr: 'we only accept jpeg and png images',
    },
  },
};
```

## Conditional Require & Data Override

We can conditionally make a field required or not required using the `requiredIf` option for the following conditions:

1. **If another field is checked or not checked:**

   ```typescript
   const rules = {
     'is-current-work': 'checkbox',

     'work-end-month': {
       type: 'range',
       options: {
         from: 1,
         to: 12,
       },
       //if this is not user's current work, require the work-end-month
       requiredIf: {
         if: 'notChecked',
         field: 'is-current-work',
       },
       //if this is user's current work, override work-end-month and set it to empty string
       overrideIf: {
         if: 'checked',
         field: 'is-current-work',
         with: '',
       },
     },

     'subscribe-newsletter': 'checkbox',

     email: {
       type: 'email',
       //if user decides to subscribe to our newsletter, require user email
       requiredIf: {
         if: 'checked',
         field: 'subscribe-newsletter',
       },
       //if not, we override the email to empty string or null, even if email is supplied,
       //it will not be picked
       overrideIf: {
         if: 'notChecked',
         field: 'subscribe-newsletter',
         with: '',
       },
     },
   };
   ```

2. **If another field equals or not equals a given value:**

   ```typescript
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
               if: 'notEquals',
               field: 'country'
               value: 'ng',
           }
       },

       //if you are in Nigeria, you must tell us your salary demand, other countries
       //are paid a fixed $60,000 per annum
       salaryDemand: {
           type: 'money',
           required: {

               field: 'country',
               if: 'equals',
               value: 'ng',
           },
       }
   };
   ```

## Ondemand Data Validation and Update

When carrying out update operations, it is always good that we update only the fields that are supplied.

Hence, there is the need to filter, pick out and process rules for only fields that are supplied without making other fields mandatory.

This is easily achieved by passing in **true** as the first argument to the execute method. If there is need to still make some fields mandatory, then we can pass those fields as second argument to the execute method.

**The execute method signature is as shown below:**

```typescript
async execute(validateOnDemand: boolean = false, requiredFields: string[] | string = []): Promise<boolean>
```

## Data Expansion & Compaction

When working in **NoSql** databases, there is always the need to expand data during creation, and compact data during updates.

The `export` method of the **Model** module has this feature inbuilt. It will expand field data following the dot notation convention if the `expandProperties` argument is set as true (the default value).

```typescript
import Server from '@teclone/r-server'; // import rserver
import Handler from '@teclone/handler';
import UserModel from './models/UserModel'; //import model
import bcrypt from 'bcrypt';

const app = Server.create(); // create server instance

app.post('/signup', async (req, res) => {
    const handler = new Handler(req.data, req.files, {
        email: {
            type: 'email',
            checks: {
                if: 'exists',
                model: UserModel,
                err: 'email address already exists'
            }
        },
        password1: {
            type: 'password',
            postCompute: async function(password) {
                return await bcrypt.hash(password, Number.parseInt(process.env.SALT_ROUNDS));
            }
        },
        password2: {
            type: 'password',
            shouldMatch: 'password1'
        },
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
                    pattern: /^\d{6}$/,
                    err: '{value} is not a valid zip code'
                }
            }
        }
    });

    if (await handler.execute()) {
        const model = handler.model().skipFields('password2').renameField('password1', 'password').export();
        const user = await UserModel.create(data);
        handler.data.id = user.id;

        console.log(model.address.zipCode); // logs the zipCode etc
    }

    if (handler.succeeds()) {
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
        }, 400);
    }
});

app.listen(null, () => {
    console.log('listening');
});
```
