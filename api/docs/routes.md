# Routes Overview

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [[RFC2119](https://tools.ietf.org/html/rfc2119)] [[RFC8174](https://tools.ietf.org/html/rfc8174)] when, and only when, they appear in all capitals, as shown here.

## Authentication

All request SHOULD set the `Authorization` using the `Basic` authentication strategy with there `username` and `password`. The system by default will use the `pam` configuration for the `login` service but MAY be configured differently.

Failed authentication requests will return one of two following response unless otherwise stated.

```
# Requests where the Authorization Basic header isn't set or otherwise can not be decoded
HTTP/2 401 Unauthorized

{
  "errors": [
    {
      "id": "<id>",
      "title": "Unauthorized Error",
      "detail": "Could not authenticate your authorization credentials",
      "status": "401"
    }
  ]
}

# Requsts where the Authorization Basic header was correctly decoded but failed the username/password check
HTTP/2 403 Forbidden

{
  "errors": [
    {
      "id": "<id>",
      "title": "Forbidden Error",
      "detail": "You are not authorized to perform this action",
      "status": "403"
    }
  ]
}
```

## Missing JSON:API headers

The following examples are common error conditions due to missing/ incorrect headers. This section should be consider a guide only and does not apply to all the routes. See the individual route documentation for the required headers.

```
# Bad - Request is missing the Accepts header
GET /...

{
  "errors": [
    {
      "id": "<>",
      "title": "Not Acceptable Error",
      "status": "406"
    }
  ]
}

# Good - Sets the header
GET /...
Accepts: application/vnd.api+json


# Bad - Making a request to a known route with the incorrect HTTP verb
POST /templates/:id
{
  "errors": [
    {
      "id": "<id>",
      "title": "Method Not Allowed Error",
      "detail": "Action or method not implemented or supported",
      "status": "405"
    }
  ]
}

# Good - Check the correct verb is being used
GET /templates/:id

# Good - Check the correct route is being used
POST /render/:id
```

## GET - /authenticates/user

Test whether the provided credentials are valid

```
GET /authenticates/user
Authorization: Basic <base64 username:password>
Accepts: application/vnd.api+json

HTTP/2 200 OK
{
  "data": {
    "type": "authenticates",
    "id": "user",
    "links": {
      "self": "/authenticates/user"
    }
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## GET - /templates

Returns a list of all known `templates`

```
GET /templates
Authorization: Basic <base64 username:password>
Accepts: application/vnd.api+json

HTTP/2 200 OK
{
  "data": [
    TemplateResource,
    ...
  ],
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## GET - /templates/:id

Returns the `template` given by the `id`. The `id` should include the file extension if there is one (excluding `.erb`). The returned object is referred to as a `TemplateResource` within this document.

```
GET /templates/:id
Authorization: Basic <base64 username:password>
Accepts: application/vnd.api+json

HTTP/2 200 OK
{
  "data": {
    "type": "templates",
    "id": "<name>[.<extension>]",
    "attributes": {
      "name": "<STRING>",
      "extension": "[STRING]",
      "synposis": "<STRING>",
      "description": "[STRING]"
    },
    "links": {
      "self": "/templates/simple"
    },
    "relationships": {
      "questions": {
        "links": {
          "self": "/templates/:id/relationships/questions",
          "related": "/templates/:id/questions"
        }
      }
    }
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## Get - /templates/:id/questions

Return all the `question` resources associated with the given `template` by `template_id`

```
GET /templates/:template_id
Authorization: Basic <base64 username:password>
Accepts: application/vnd.api+json

HTTP/2 200 OK
{
  "data": [
    {
      "type": "questions",
      "id": "<question_id>"
      "attributes": {
        "text": "<string>",
        "description": "[string]",
        "default": variable_type
      },
      "links": {
        "self": "/questions/<question_id>"
      }
    },
    ...
  ],
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```


## GET - /render/:template_id

Renders the template against the provided date.

NOTE: This route does not conform the JSON:API standard and behaves slightly differently. The authentication/ authorization process is the same however the response body will be empty. The other differences are shown below.

```
# With x-www-form-urlencoded body
GET /render/:template_id
Authorization: Basic <base64 username:password>
Content-Type: x-www-form-urlencoded
Accepts: text/plain
key=value&...

HTTP/2 200 OK
Content-Disposition: attachment; filename="<template_id>"
Content-Type: text/plain
... rendered template ...


# With application/json body
GET /render/:template_id
Authorization: Basic <base64 username:password>
Content-Type: application/json
Accepts: text/plain
{
  "[key]": "[value]",
  ...
}

HTTP/2 200 OK
Content-Disposition: attachment; filename="<template_id>"
Content-Type: text/plain
... rendered template ...


# With invalid credentials
GET /render/:template_id
Authorization: Basic <base64 invalid:invalid>
Accepts: text/plain

HTPP/2 403 Forbidden


# Without credentials
GET /render/:template_id
Accepts: text/plain

HTTP/2 401 Unauthorized
```

