// Return the first error code from a parsed response body.
export function errorCode(responseBody) {
  if (!isObject(responseBody)) { return null; }
  if (!Array.isArray(responseBody.errors)) { return null; }
  if (!isObject(responseBody.errors[0])) { return null; }
  return responseBody.errors[0].code;
}

export function getResourcesFromResponse(data) {
  if (!isObject(data)) { return null; }
  if (!Array.isArray(data.data)) { return null; }
  return data.data;
}

export function isObject(object) {
  return (typeof object === 'function' || typeof object === 'object') && !!object;
};
