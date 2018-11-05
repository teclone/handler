/**
 * provides test data used for testing all the validation rule types/methods
*/
export default function() {
    return {
        //incorrect float value filter test
        'wrong float value filter test set': [
            //data
            {
                age: 'n22years',
                height: 'n5.5ft',
            },

            //files
            {},

            //rules
            {
                age: 'positiveInt',
                height: 'positiveFloat'
            },

            //is error
            true,

            {
                age: '"n22years" is not a valid positive integer',
                height: '"n5.5ft" is not a valid positive number',
            }
        ],
    };
}