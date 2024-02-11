# Log Masker Library

This library intelligently checks for all occurrences of the specified fields to be masked within a nested object and caches the path for later use. Customize the code to fit your project's specific requirements.

```
npm i log-masker
```

## Example Usage

### Import the Library

```javascript
const {
  logMaskerMaskData,
  logMaskerSetMaskingFields,
  logMaskerMaskDataSetDebugMode,
  logMaskerSetCacheUpdateEndTime
} = require('log-masker');
```

### Set Debug Mode

```javascript
// Enable debug mode to show required logs and errors
logMaskerMaskDataSetDebugMode(true);
```

### Set Cache Update Time

```javascript
// Set the time for when to stop updating cache (in milliseconds)
// Adjust according to your requirements based on how long your code will be ready with cached data
// fine tune this time to work best for your usecase
logMaskerSetCacheUpdateEndTime(60000);
```

### Set Masking Fields

```javascript
// Define the fields to be masked based on sensitivity
const mapFieldsToFindToGenericMaskingFields = {
  stringFields: ['name', 'customer_name', 'address'],
  phoneFields: ['phone', 'mobile'],
  emailFields: ['email'],
  passwordFields: ['password'],
  cardFields: ['card'],
  uuidFields: ['uuid'],
};

// Set the masking fields
logMaskerSetMaskingFields(mapFieldsToFindToGenericMaskingFields);
```

### Mask Data

```javascript
/**
 * Mask the data
 * 
 * @param {Object} data - The data object to be masked
 * @param {string} cacheKey - The cache key for the data object
 * @param {boolean} cacheKeyInData - Whether the cache key is in the data object or not
 * @returns {Object} - The masked data object
 */
// Mask the data (no error thrown if the data is not a valid JSON)

const data = {
    inner: {
        name: "Arpit",
        fields: {
            email: "arrrr@gmail.com",
            customer: [{name: "pandey"}, {address: "address"}]
        }
    },
    phone: "1234567890"
}

const cacheKey = 'data'; // used for caching same object masking paths
// cacheKeyInData? not required, pass true if your data object contains the cacheKey, for example api_path
const maskedData = logMaskerMaskData({data}, cacheKey, cacheKeyInData?);

output:
{
  "data": {
    "inner": {
      "name": "*****",
      "fields": {
        "email": "arr**@*******om",
        "customer": [
          {
            "name": "******"
          },
          {
            "address": "*******"
          }
        ]
      }
    },
    "phone": "1234*****0"
  }
}


```

Feel free to customize the code according to your specific needs and integrate it seamlessly into your project.