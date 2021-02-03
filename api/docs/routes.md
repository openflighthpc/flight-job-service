# Routes Overview

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [[RFC2119](https://tools.ietf.org/html/rfc2119)] [[RFC8174](https://tools.ietf.org/html/rfc8174)] when, and only when, they appear in all capitals, as shown here.

## Authentication

All request SHOULD set the `Authorization` using the `Basic` authentication strategy with there `username` and `password`. The system by default will use the `pam` configuration for the `login` service but MAY be configured differently.

Failed authentication requests will return one of two following response unless otherwise stated.

```
# Requests where the Authorization Basic header isn't set or otherwise can not be decoded
HTTP/2 401 Unauthorized
Content-Type: application/vnd.api+json
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
Content-Type: application/vnd.api+json
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
# Bad - Request is missing the Accept header
GET /...

HTTP/2 406 Not Acceptable
Content-Type: application/vnd.api+json
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
Accept: application/vnd.api+json


# Bad - Making a request to a known route with the incorrect HTTP verb
POST /templates/:id
Content-Type: application/vnd.api+json
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
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
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
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
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
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": {                       # REQUIRED - The TemplateResource object
    "type": "templates",          # REQUIRED - Specifes the response as a template
    "id": "<id>",                 # REQUIRED - The template id
    "attributes": {               # REQUIRED - Template Attributes
      "name": STRING,             # REQUIRED - The name of the template including the file extension
      "synopsis": STRING,         # REQUIRED - A short summary of the template
      "description": STRING,      # OPTIONAL - A longer description of the template
      "version": 0                # REQUIRED - Species the version used by the template
    },
    "links": {                    # REQUIRED - Self reference to the resource
      "self": "/templates/<id>"
    },
    "relationships": {            # REQURIED - References to other resources
      "questions": {              # REQUIRED - References to the template's questions
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
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": [                     # REQUIRED    - A list of QuestionResource object
    {
      "type": "questions",      # REQUIRED    - Specifies the response is a question
      "id": "<question_id>"     # REQUIRED    - Gives the question's ID
      "attributes": {           # REQUIRED    - Quesion attributes
        "text": STRING,         # REQUIRED    - A short summary of the question
        "description": STRING,  # OPTIONAL    - A longer description of the question
        "default": STRING,      # OPTIONAL    - The value which should pre-populate the question
        "format": {             # OPTIONAL    - Specifies how the field should be presented
          "type": STRING,       # RECOMMENDED - The field type that should be used (specifcation TBA)
          "options":            # OPTIONAL    - A list of valid responses to the question
            {
              "text": STRING,   # RECOMMENDED - The value to be prompted to the user
              "value": STRING   # RECOMMENDED - The value to be submitted back to the API
            },
            ...
          ]
        },
        "ask-when": {           # OPTIONAL    - Defines when the question should be asked
          "value": STRING,      # RECOMMENDED - The lookup to the source value (specifcation TBA)
          "eq": STRING          # RECOMMENDED - Ask the question when the lookup equals this value
        }
      },
      "links": {                # REQUIRED  - Self reference to the resource
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

Renders the template against the provided date and saves it to the filesystem. Returns the path to the rendered script.

Due to the underlining templating engine, this route could fail to render for various reasons including but not limited to:
1. The client not sending all the required keys, or
2. The template being misconfigured.

The above errors SHOULD be resolved by the system administrator. The server expects render errors MAY occur and SHALL return in `422 - Unprocessable Entity`. This denotes the error occurred during rendering as opposed to a generic server error.

NOTE: This route does not conform the JSON:API standard and behaves slightly differently. The authentication/ authorization process is the same however the response body will be empty. The other differences are shown below.

```
# With x-www-form-urlencoded body
GET /render/:template_id
Authorization: Basic <base64 username:password>
Content-Type: x-www-form-urlencoded
Accept: text/plain
key=value&...

HTTP/2 201 CREATED
Content-Type: text/plain
/path/to/rendered/script


# With application/json body
GET /render/:template_id
Authorization: Basic <base64 username:password>
Content-Type: application/json
Accept: text/plain
{
  "[key]": "[value]",
  ...
}

HTTP/2 201 CREATED
Content-Type: text/plain
/path/to/rendered/script


# When the template fails to render
GET /render/:template_id
Authorization: Basic <base64 invalid:invalid>
Accept: text/plain

HTPP/2 422 Unprocessable Entity


# With invalid credentials
GET /render/:template_id
Authorization: Basic <base64 invalid:invalid>
Accept: text/plain

HTPP/2 403 Forbidden


# Without credentials
GET /render/:template_id
Accept: text/plain

HTTP/2 401 Unauthorized
```

