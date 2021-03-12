# Routes Overview

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://tools.ietf.org/html/bcp14) [[RFC2119](https://tools.ietf.org/html/rfc2119)] [[RFC8174](https://tools.ietf.org/html/rfc8174)] when, and only when, they appear in all capitals, as shown here.

All `DATETIME` fields SHALL use the date-time format described in [RFC3339](https://tools.ietf.org/html/rfc3339#section-5.6).

## Authentication

All request SHOULD set the `Authorization` using the `Bearer` authentication strategy with there issued `jwt`. Please contact your system administrator to be issued with a token.

Failed authentication requests will return one of two following response unless otherwise stated.

```
# Requests where the Authorization Bearer header isn't set, couldn't be decoded, or the token has expired.
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

# Requsts where the Authorization bearer header was correctly decoded but failed the signature or user check.
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

## GET - /templates

Returns a list of all known `templates`

```
GET /v0/templates
Authorization: Bearer <jwt>
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

Returns the `template` given by the `id`. The returned object is referred to as a `TemplateResource` within this document.

```
GET /v0/templates/:id
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": {                       # REQUIRED - The TemplateResource object
    "type": "templates",          # REQUIRED - Specifes the response as a template
    "id": "<id>",                 # REQUIRED - The template id
    "attributes": {
      "name": STRING,             # REQUIRED - The name of the template including the file extension
      "synopsis": STRING,         # REQUIRED - A short summary of the template
      "description": STRING,      # OPTIONAL - A longer description of the template
      "version": 0                # REQUIRED - Species the version used by the template
    },
    "links": {                    # REQUIRED - Self reference to the resource
      "self": "/v0/templates/<id>"
    },
    "relationships": {
      "questions": {              # REQUIRED - References to the template's questions
        "links": {
          "related": "/v0/templates/:id/questions"
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
GET /v0/templates/:template_id
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": [                     # REQUIRED    - A list of QuestionResource object
    {
      "type": "questions",      # REQUIRED    - Specifies the response is a question
      "id": "<question_id>"     # REQUIRED    - Gives the question's ID
      "attributes": {
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
        "self": "/v0/questions/<question_id>"
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


## GET - /scripts

Return a list of all `scripts` for the given user.

```
GET /v0/scripts
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": [
    ScriptResource,
    ...
  ],
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

Return the same list with all the related templates.
NOTE: Templates which the user has not used will not be included in the response

```
GET /v0/scripts?include=template
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": [
    ScriptResource,
    ...
  ],
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
    TemplateResource,
    ...
  ]
}
```

## GET - /scripts/:id

Return the `script` given by the `id`. The returned object is referred to as a `ScriptResource` object within this document.

```
GET /v0/scripts/:id
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": {                     # REQUIRED - The ScriptResource
    "type": "scripts",          # REQUIRED - Specfies the resource is a script
    "id": STRING,               # REQUIRED - The script's ID
    "attributes": {
      "script-name": STRING,    # REQUIRED - The name of the script
      "created-at": STRING      # REQUIRED - The creation date-time in RFC3339 format
    },
    "links": {
      "self": "/v0/scripts/:id"
    },
    "relationships": {
      "template": {             # RECOMMENDED - The related template resource links
        "links": {
          "related": "/v0/scripts/:id/template"
        }
      }
    },
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

The related `template` can also be retrieved along side the request.
NOTE: All `script` SHOULD have a related `template`, but this is not guaranteed. A related `template` SHALL only be provided if referential integrity can be guaranteed when the request is made.

```
# Retrieving the related template
GET /v0/scripts/:id?include=template
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "scripts"
    "id": STRING,
    "attributes": {
      ...
    },
    "links": {
      "self": "/scripts/:id"
    },
    "relationships": {
      "template": {
        "links": {
          "related": "/v0/scripts/:id/template"
        },
        "data": {
          "type": "template"      # REQUIRED - Specifies the related resource is a template
          "id": STRING,           # REQUIRED - Specifies the id of the template
        }
      }
    }
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
    TemplateResource              # REQUIRED - The related TemplateResource object
  ]
}


# When the related template is missing
GET /v0/scripts/:id?include=template
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "scripts"
    "id": STRING,
    "attributes": {
      ...
    },
    "links": {
      "self": "/v0/scripts/:id"
    },
    "relationships": {
      "template": {
        "links": {
          "related": "/v0/scripts/:id/template"
        },
        "data": null
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

## DELETE - /scripts/:id
NOTE: This end point has been "temporarily" disabled

Permanently remove a script

```
DELETE /v0/scripts/:id
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 204 No Content
```

## GET - /jobs

Return a list of previously submitted jobs

```
GET /v0/jobs
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": [
    JobResource,
    ...
  ],
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## GET - /jobs/:id

Return the `job` given by the `id`. The returned object is referred to as a `JobResource` object within this document.

```
GET /v0/jobs/:id
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": {                     # REQUIRED - The JobResource
    "type": "jobs",             # REQUIRED - Specfies the resource is a script
    "id": STRING,               # REQUIRED - The job's ID
    "attributes":{
      "createdAt": DATETIME,    # REQUIRED - The date-time the job was created
      "schedulerId": "STRING",  # RECOMMENDED - The ID used by the underlining scheduler
      "stdoutPath": STRING,     # RECOMMENDED - The path where the job's STDOUT was redirected
      "stderrPath": STRING,     # RECOMMENDED - The path where the job's STDERR was redirected
      "state": STRING,          # REQUIRED - The current point in the job's life cycle
      "reason": STRING,         # OPTIONAL - Additional information about the state
      "startTime": DATETIME,    # OPTIONAL - The actual (or predicted) time the job started running
      "endTime": DATETIME,      # OPTIONAL - The actual (or predicted) time the job will finish running
      "submitStdout": STRING,   # RECOMMENDED - The standard output of the underlining scheduler command
      "submitStderr": STRING    # RECOMMENDED - The standard error of the underlining scheduler command
    },
    "links": {
      "self": "/v0/jobs/:id"
    }
    "relationships": {
      "script": {
        "links": {
          "related": "/v0/jobs/:id/script"
        },
        "data": {
          "type": "scripts",    # RECOMMENDED - Denotes the related resource is a script
          "id": STRING          # RECOMMENDED - Denotes the script's ID
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

## POST - /jobs

Submit an existing script to the scheduler.
NOTE: The API will respond 201 create if it successfully makes a record of the job. This does not mean the job was submitted correctly. Check the `success` flag to determine if the scheduler accepted the job correctly.

```
POST /v0/jobs
Authorization: Bearer <jwt>
Accept: application/vnd.api+json
Content-Type: application/vnd.api+json
{
  "data": {
    "type": "jobs",             # REQUIRED - Specify that a job is being created
    "relationships": {
      "script": {               # REQUIRED - Specify the script which will be launched
        "data": {
          "type": "scripts",    # REQUIRED - Specify the related object is a script
          "id": STRING          # REQUIRED - Specify the ID of the related script
        }
      }
    }
  }
}

HTTP/2 201 Created
Content-Type: application/vnd.api+json
{
  "data": JobResource,
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## POST - /render/:template_id

Renders the template against the provided date and saves it to the filesystem. Returns the path to the rendered script.

Due to the underlining templating engine, this route could fail to render for various reasons including but not limited to:
1. The client not sending all the required keys, or
2. The template being misconfigured.

The API may fail to render the script due to a malformed template. The exact behaviour in this situation is undefined.

NOTE: This route does not conform the JSON:API standard and behaves slightly differently. The authentication/ authorization process is the same however the response body will be empty. The other differences are shown below.

```
# With x-www-form-urlencoded body
POST /v0/render/:template_id
Authorization: Bearer <jwt>
Content-Type: x-www-form-urlencoded
Accept: application/vnd.api+json
key=value&...

HTTP/2 201 CREATED
Content-Type: application/vnd.api+json
{
  "data": ScriptResource,
}


# With application/json body
POST /v0/render/:template_id
Authorization: Bearer <jwt>
Content-Type: application/json
Accept: application/vnd.api+json
{
  "[key]": "[value]",
  ...
}

HTTP/2 201 CREATED
Content-Type: application/vnd.api+json
{
  "data": ScriptResource,
}


# With invalid credentials
POST /v0/render/:template_id
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTPP/2 403 Forbidden


# Without credentials
POST /v0/render/:template_id
Accept: application/vnd.api+json

HTTP/2 401 Unauthorized
```

