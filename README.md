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