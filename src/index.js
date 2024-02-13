const MaskData = require('maskdata');

/**
    set _DEBUG to true to see the logs, use logMaskerMaskDataSetDebugMode to set the debug mode
    do not set it directly
*/
let _DEBUG = false;
if (process.env.DEBUG) {
    if (process.env.DEBUG === 'true') {
        _DEBUG = true;
    } else _DEBUG = false;
}

/**
 * 
 * @param {boolean} value true | false
 */
function _setDebugMode(value) {
    _DEBUG = value;
}

/**
    used by maskdata library to mask the data
    it will mask the data based on the configuration provided
    it will mask the data based on the type of data
    it will mask the data based on the options provided
    for now it is not configurable, but can be made configurable in future
*/
let _DEFAULT_MASK_CONFIG = {
    cardMaskOptions: {
        maskWith: "*",
        unmaskedStartDigits: 4,
        unmaskedEndDigits: 1
    },

    emailMaskOptions: {
        maskWith: "*",
        unmaskedStartCharactersBeforeAt: 3,
        unmaskedEndCharactersAfterAt: 2,
        maskAtTheRate: false
    },

    passwordMaskOptions: {
        maskWith: "*",
        maxMaskedCharacters: 16,
        unmaskedStartCharacters: 0,
        unmaskedEndCharacters: 0
    },

    phoneMaskOptions: {
        maskWith: "*",
        unmaskedStartDigits: 4,
        unmaskedEndDigits: 1
    },

    stringMaskOptions: {
        maskWith: "*",
        maskOnlyFirstOccurance: false,
        maskAll: true,
        maskSpace: false
    },

    uuidMaskOptions: {
        maskWith: "*",
        unmaskedStartCharacters: 0,
        unmaskedEndCharacters: 0
    },

    jwtMaskOptions: {
        maskWith: '*',
        maxMaskedCharacters: 512,
        maskDot: true,
        maskHeader: true,
        maskPayload: true,
        maskSignature: true
    },
    // To extend the mask function to other types of data. 
    genericStrings: [
        {
            config: {
                maskWith: "*",
                maxMaskedCharacters: 256,
                unmaskedStartDigits: 0,
                unmaskedEndDigits: 0
            },
        }
    ]
};

/**
 * 
 * @param {Object} config DOCS: https://www.npmjs.com/package/maskdata
 * @returns void
 * if masking config is set then default config will be overriden, if not set then default config will be used
 * please ensure that the config is valid, else it will not work as expected
 */
function _setMaskConfig(config) {
    if(typeof config !== 'object') {
        if (_DEBUG) console.error("ERROR: Mask config should be an object");
        return;
    }
    if (_DEBUG) console.log("INFO: Setting mask config", config);
    _DEFAULT_MASK_CONFIG = config;
}

/*
    _cache will contain the fields to be masked
    this will get updated if fields for object are found
    the paths will be used to mask the data
    path will look like "a.b.c" for nested objects lodash get and set will be used
    it will be maintained by the library and should not be set by the developer
    it will live in the memory, you can use external redis or any other _cache to store it
*/
const _cache = {};
let _CACHE_START_TIME = Date.now();
//after this time cache updates will stop and recursive calls will not be made to check fields
//this time should be configured as per your application needs, this should be enough to cache all the fields in all APIs
let _CACHE_DURATION_UNTIL_CACHE_UPDATE_STOPS = 60 * 1000; // 1 minute in milliseconds

/**
 * 
 * @param {required} milliseconds time in milliseconds - 60000 for 1 minute is defaulf
 * @returns void
 */
function _setCacheTimeToStopCaching(milliseconds) {
    if (typeof milliseconds !== 'number') {
        if (_DEBUG) console.error("INFO: cache update time should be a number");
        return
    };
    if (_DEBUG) console.log("INFO: setting cache update stop time to: " + milliseconds);
    _CACHE_DURATION_UNTIL_CACHE_UPDATE_STOPS = milliseconds;
}

function _resetCacheTime() {
    if (_DEBUG) console.log("INFO: Resetting cache update stop time");
    _CACHE_START_TIME = Date.now();
    if (_DEBUG) console.log("INFO: Cache update stop time reset to: " + new Date(_CACHE_START_TIME + _CACHE_DURATION_UNTIL_CACHE_UPDATE_STOPS));
}

/*
    _mapFieldsToFindToGenericMaskingFields will contain the fields to be masked
    this will be used to update the _cache if fields for object are found
    fieldsToFind will contain all the fields to be found in the object to be masked
    this will be set by the developer by calling the function logMaskerSetMaskingFields

    //DOCS FOR FIELDS: https://www.npmjs.com/package/maskdata
    EXAMPLE FIELDS:
    fields = {
        stringFields: ['name', 'customer_name', 'address'],
        phoneFields: ['phone', 'mobile'],
        emailFields: ['email'],
        passwordFields: ['password'],
        cardFields: ['card'],
        uuidFields: ['uuid'],
    }

    add all fields of your choice in its respctive category
    categories are stringFields, phoneFields, emailFields, passwordFields, cardFields, uuidFields
*/
let _mapFieldsToFindToGenericMaskingFields = {}

/*
    fieldsToFind will make an flat array of the _mapFieldsToFindToGenericMaskingFields
    it will take out all the values from the object and make an array of it
    ['name', 'customer_name', 'address', 'phone', 'mobile' ...]
    this is not to be set by the developer, it will be updated internally
*/
let _fieldsToFind = []

/**
 * 
 * @param {object} fields DOCS: https://www.npmjs.com/package/maskdata
 * 
 *  EXAMPLE FIELDS:
 *  fields = {
        stringFields: ['name', 'customer_name', 'address'],
        phoneFields: ['phone', 'mobile'],
        emailFields: ['email'],
        passwordFields: ['password'],
        cardFields: ['card'],
        uuidFields: ['uuid'],
 *   }
 */
function _setMapFieldsToFindToGenericMaskingFields(fields) {
    // Check if fields is null, undefined, or an empty object
    if (!fields || Object.keys(fields).length === 0) {
        return;
    }

    let newFieldsAdded = false;

    // Merge the old and new fields
    for (let key in fields) {
        // Filter out empty strings from the array for this key
        const newFields = fields[key].filter(field => field);

        // Check if the array for this key is empty
        if (!newFields.length) {
            continue;
        }
        if(_DEBUG) console.log("INFO: New fields to be added: ", newFields);
        if (_mapFieldsToFindToGenericMaskingFields.hasOwnProperty(key)) {
            const oldFields = _mapFieldsToFindToGenericMaskingFields[key];
            _mapFieldsToFindToGenericMaskingFields[key] = [...new Set([...oldFields, ...newFields])];

            // Check if new fields were added
            if (_mapFieldsToFindToGenericMaskingFields[key].length !== oldFields.length) {
                newFieldsAdded = true;
            }
        } else {
            _mapFieldsToFindToGenericMaskingFields[key] = newFields;
            newFieldsAdded = true;
        }
    }

    if (_DEBUG) console.log("INFO: Setting fields to be masked", _mapFieldsToFindToGenericMaskingFields);
    _fieldsToFind = Object.values(_mapFieldsToFindToGenericMaskingFields).reduce((acc, val) => acc.concat(val), []);

    // Only reset the cache time if new fields were added
    if (newFieldsAdded) {
        _resetCacheTime(); // update the cache update time, because fields are updated
    }
}

/**
 * 
 * @param {object} data object to be masked
 * @returns masked version of the data object
 */
function _masklogMaskerData(data, cackeKeyToUse) {
    if (!_cache) {
        if (_DEBUG) console.error("ERROR: No fields to mask found", { [cackeKeyToUse]: _cache[cackeKeyToUse] });
        return data;
    }
    if (_DEBUG) console.log("INFO: Masking fields", { [cackeKeyToUse]: _cache[cackeKeyToUse] });
    return MaskData.maskJSON2(data, { ..._DEFAULT_MASK_CONFIG, ..._cache[cackeKeyToUse] });
}

/**
 * 
 * @param {string} cacheKeyToUse check in cache for the fields to be masked
 * @returns boolean value if fields to be masked are found or not, will not run recursive function _findFields if true
*/
function _isCheckNeededToMask(cacheKeyToUse) {
    try {
        // If the cacheKeyToUse is not in the _cache, skip the check
        if (!_cache.hasOwnProperty(cacheKeyToUse)) {
            _cache[cacheKeyToUse] = {};
            return true;
        }

        //if the cacheKeyToUse is in the _cache but has no fields to mask, skip the check
        if (Object.keys(_cache[cacheKeyToUse]).length === 0) {
            return true;
        }

        // If the cacheKeyToUse is in the _cache or the cache duration has passed, skip the check
        if (Date.now() - _CACHE_START_TIME > _CACHE_DURATION_UNTIL_CACHE_UPDATE_STOPS) {
            return false;
        }

        // return true by default
        return true;
    } catch (error) {
        if (_DEBUG) console.error(`ERROR: ${error}`);
        return true;
    }
}

/**
 * 
 * @param {object} data object to be checked for fields to be masked
 * @param {string} path private please do not change, used for recursive function, do not set it
 * @returns void
 */
function _findFields(data, cacheKey, _path = '') {
    if (typeof data !== 'object' || data === null) {
        return;
    }
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const newPath = _path ? `${_path}.${key}` : key;
            let maskingOptionToUse = null;

            if (_fieldsToFind.includes(key)) {
                // Generic masking fields to be set in cache
                for (const genericKey in _mapFieldsToFindToGenericMaskingFields) {
                    if (_mapFieldsToFindToGenericMaskingFields[genericKey].includes(key)) {
                        maskingOptionToUse = genericKey;
                        break;
                    }
                }
                if (!_cache[cacheKey]) {
                    _cache[cacheKey] = {};
                }
                if (!_cache[cacheKey][maskingOptionToUse]) {
                    _cache[cacheKey][maskingOptionToUse] = [];
                }
                // Check if newPath already exists in _cache before pushing
                if (!_cache[cacheKey][maskingOptionToUse].includes(newPath)) {
                    _cache[cacheKey][maskingOptionToUse].push(newPath);
                }
            }

            // Try to parse the data as JSON
            try {
                //handle null, undefined values
                if (data[key] === null || data[key] === undefined) {
                    data[key] = String(data[key]);
                }
                const jsonData = JSON.parse(data[key]);
                data[key] = jsonData;
                _findFields(jsonData, cacheKey, newPath);
            } catch (e) {
                // Not a JSON object, ignore
            }

            if (typeof data[key] === 'object') {
                // Recursively search nested objects
                _findFields(data[key], cacheKey, newPath);
            }
        }
    }
}

/**
 * 
 * @returns string key to be used for caching same data object and masking paths
 */
function _findCacheKey(data, cacheKey, cacheKeyInData) {
    let cacheKeyToUse = cacheKey;
    if (cacheKeyInData) {
        if (data.hasOwnProperty(cacheKey)) {
            cacheKeyToUse = data[cacheKey];
        }
    }
    return cacheKeyToUse;
}

/**
 * 
 * @param {object} data object to be checked for fields and to be masked
 * @param {string} cacheKey a key to to be kept in cache for the fields to be masked
 * @param {booelan} cacheKeyInData pass true if the cacheKey is in the data object, else pass false and the cacheKey will be used as it is
 * @returns masked data object
 * not to be used by the developer, use logMaskerMaskData instead
 * doest not throws error if the data is not a valid JSON
 * will only handle valid json or valid json strings
 */
function _maskMyData(data, cacheKey, cacheKeyInData = false) {
    try {
        const _cackeKeyToUse = _findCacheKey(data, cacheKey, cacheKeyInData);
        const isCheckNeededToMask = _isCheckNeededToMask(_cackeKeyToUse);
        if (_DEBUG) {
            console.log(`INFO: Is check needed to mask: ${isCheckNeededToMask}`);
            if (isCheckNeededToMask) console.log(`INFO: Fields will be checked recursilvely`);
        }
        if (isCheckNeededToMask) {
            _findFields(data, _cackeKeyToUse);
        }
        return _masklogMaskerData(data, _cackeKeyToUse);
    } catch (error) {
        if (_DEBUG) console.error(`ERROR: ${error}`);
        return data;
    }
}

module.exports = {
    logMaskerMaskDataSetDebugMode: _setDebugMode,
    logMaskerSetMaskingFields: _setMapFieldsToFindToGenericMaskingFields,
    logMaskerMaskData: _maskMyData,
    logMaskerSetCacheUpdateEndTime: _setCacheTimeToStopCaching,
    logMaskerSetMaskConfig: _setMaskConfig
}

/**
    Example use:

    //import the library
    const { logMaskerMaskData, logMaskerSetMaskingFields, logMaskerMaskDataSetDebugMode, logMaskerSetCacheUpdateEndTime} = require('./logMasker_masking_library');

    //set the debug mode, it will show required logs and errors if any
    logMaskerMaskDataSetDebugMode(true);

    //set time for when to stop updating cache
    //set according to your requrirement, figure ot the time in how much time your code will be ready with cached data
    logMaskerSetCacheUpdateEndTime(60000);

    //set the fields to be masked, check from your logs which fields are sensitive and need to be masked
    const mapFieldsToFindToGenericMaskingFields = {
        stringFields: ['name', 'customer_name', 'address'],
        phoneFields: ['phone', 'mobile'],
        emailFields: ['email'],
        passwordFields: ['password'],
        cardFields: ['card'],
        uuidFields: ['uuid'],
    }
    logMaskerSetMaskingFields(mapFieldsToFindToGenericMaskingFields)

    function(data){
        //mask the data, it will not throw error if the data is not a valid JSON
        //cacheKey should be string, this will cache keys of data object to be masked
        //cacheKeyInData should be boolean, if the field is in the data object, if not it will use the field as it is
        return logMaskerMaskData(data, cacheKey, cacheKeyInData?);
    }
*/

