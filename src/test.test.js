/**
 * test file can be run using jest
 * npm i jest
 * run jest in the root directory
 */
const { logMaskerMaskDataSetDebugMode, logMaskerSetMaskingFields, logMaskerMaskData, logMaskerSetCacheUpdateEndTime } = require('./index');

describe('logMasker Masking Library', () => {
    beforeAll(() => {
        logMaskerMaskDataSetDebugMode(true);
        logMaskerSetCacheUpdateEndTime(60000);
        const mapFieldsToFindToGenericMaskingFields = {
            stringFields: ['name', 'customer_name', 'address'],
            phoneFields: ['phone', 'mobile'],
            emailFields: ['email'],
            passwordFields: ['password'],
            cardFields: ['card'],
            uuidFields: ['uuid'],
        }
        logMaskerMaskDataSetDebugMode(true);
        logMaskerSetMaskingFields(mapFieldsToFindToGenericMaskingFields);
    });

    test('should mask sensitive data', () => {
        const data = {
            name: 'John Doe',
            phone: '1234567890',
            email: 'john.doe@example.com',
            password: 'password_value',
            card: '1234-5678-9012-3456',
            uuid: '123e4567-e89b-12d3-a456-426614174000',
            nested: {
                customer_name: 'Jane Doe',
                mobile: '0987654321',
                address: '123 Street, City, Country',
            },
        };
        const maskedData = logMaskerMaskData(data, 'test1');
        console.log('maskedData', {original: data, masked: maskedData});
        expect(maskedData).not.toEqual(data);
    });

    test('should mask sensitive with undefined values', () => {
        const data = {
            name: undefined
        };
        const maskedData = logMaskerMaskData(data, 'test2');
        console.log('maskedData', {original: data, masked: maskedData});
        expect(maskedData).not.toEqual(data);
    });

    test('should handle undefined data', () => {
        const data = undefined;
        const maskedData = logMaskerMaskData(data, 'test3');
        console.log('maskedData', {original: data, masked: maskedData});
        expect(maskedData).toEqual(data);
    });

    test('should handle undefined fields', () => {
        const data = {
            undefinedField: 'This field is not defined in the fields to be masked',
        };
        const maskedData = logMaskerMaskData(data, 'test4');
        console.log('maskedData', {original: data, masked: maskedData});
        expect(maskedData).toEqual(data);
    });

});