
const { logMaskerSetMaskConfig, logMaskerSetCacheUpdateEndTime, logMaskerSetMaskingFields, logMaskerMaskData, logMaskerMaskDataSetDebugMode } = require('../index');

describe('logMasket masking configuration with X', () => {

    test('should set the masking configuration', () => {
        logMaskerMaskDataSetDebugMode(true);
        logMaskerSetCacheUpdateEndTime(100);
        const maskingConfig = {
            stringMaskOptions: {
                maskWith: "X",
                maskOnlyFirstOccurance: false,
                maskAll: true,
                maskSpace: false
            }
        }
        logMaskerSetMaskConfig(maskingConfig);

        const mapFieldsToFindToGenericMaskingFields = {
            stringFields: ['name', 'customer_name', 'address'],
        }
        logMaskerSetMaskingFields(mapFieldsToFindToGenericMaskingFields);

        const data = {
            name: 'John Doe',
            customer_name: 'Jane Doe',
            address: '123 Street, City, Country',
            password: 'password_value', // password is not in the fields to be masked
        };

        const maskedData = logMaskerMaskData(data, 'maskingConfigTest1');
        console.log('maskedData', {original: data, masked: maskedData});
        expect(maskedData).toEqual({
            name: 'XXXX XXX',
            customer_name: 'XXXX XXX',
            address: 'XXX XXXXXXX XXXXX XXXXXXX',
            password: 'password_value',
        });
    });

    test('should set the masking configuration with ?', () => {
        logMaskerMaskDataSetDebugMode(true);
        logMaskerSetCacheUpdateEndTime(100);
        const maskningConfig = {
            stringMaskOptions: {
                maskWith: "?",
                maskOnlyFirstOccurance: false,
                maskAll: true,
                maskSpace: false
            },
            passwordMaskOptions: {
                maskWith: "X",
                maxMaskedCharacters: 16,
                unmaskedStartCharacters: 0,
                unmaskedEndCharacters: 0
            } // configuration for password
        }
        logMaskerSetMaskConfig(maskningConfig);

        const mapFieldsToFindToGenericMaskingFields = {
            stringFields: ['name', 'customer_name', 'address'],
            passwordFields: ['password'], // password is now in the fields to be masked
        }
        logMaskerSetMaskingFields(mapFieldsToFindToGenericMaskingFields);

        const data = {
            name: 'John Doe',
            customer_name: 'Jane Doe',
            address: '123 Street, City, Country',
            password: 'password_value',
        };

        const maskedData = logMaskerMaskData(data, 'maskingConfigTest1');
        console.log('maskedData', {original: data, masked: maskedData});
        expect(maskedData).toEqual({
            name: '???? ???',
            customer_name: '???? ???',
            address: '??? ??????? ????? ???????',
            password: 'XXXXXXXXXXXXXX',
        });
    });

});