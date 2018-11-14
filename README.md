# Handler

[(https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

This is a **node.js** module version of the original [PHP handler](https://github.com/harrison-ifeanyichukwu/handler) module. It is a module that sits independently between the controller and the model, and asynchronously performs request data validation, serialization and integrity checks. It is easy to setup and independent of any framework and ORMs.

It makes the validation process easy and requires you to just define the data validation rules which are written in plain **JavaScript** objects.

The most interesting part is how easy it is to validate object of field data and files and the wide range of validation rule types that it affords you. It is also extensible so that you can define more validation rules if the need be. See [How to Write Your Custom Validation Types](#how-to-write-your-custom-validation-types) for instructions

Regarding database integrity checks, It supports both **NOSQL** and **Relational Databases**, at least, it is tested on **MongoDB** and **Mysql**, it is extensible enough to leave the DBChecker implementation up to you by defining an abstract `DBChecker` class. This makes it not tied to any framework, database and QueryBuilders/ORMs. See [How To Implement the DBChecker Interface](#how-to-implement-the-dbchecker-interface) for instructions.

## Getting Started

**Install via npm**:

```bash
npm install --save forensic-handler
```

## Usage Example