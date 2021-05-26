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

## GET - /templates/:id/questions

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
                                #               The TYPE is dependant on the "format-type" below
                                #               The TYPE SHALL be:
                                #                 - [STRING] (array of strings) for 'multiselect'
                                #               Otherwise the TYPE SHOULD be STRING.
        "default": TYPE,        # RECOMMENDED - The value which would be used if the answer is omitted
                                # NOTE: multiselect questions will provide the default as a CSV list
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
      "name": STRING,           # REQUIRED - Same as the ID
      "createdAt": STRING,      # REQUIRED - The creation date-time in RFC3339 format
      "path": STRING            # REQUIRED - The script's path on the filesystem
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

## GET - /scripts/:id/content

Return the `content` of the given `script`.

```
GET /v0/scripts/:id/content
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": {
    "type": "contents",   # REQUIRED: Denotes the resource is a content
    "id": STRING,         # REQUIRED: The ID of the related script
    "attributes": {
      "payload": STRING   # REQUIRED: The content of the script
    }
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## GET - /scripts/:id/note

Return the `notes` about the given `script`.

```
GET /v0/scripts/:id/note
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": NoteResource,
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## DELETE - /scripts/:id

Permanently remove a script

```
DELETE /v0/scripts/:id
Authorization: Bearer <jwt>
Accept: application/vnd.api+json

HTTP/2 204 No Content
```

## GET - /contents/:id

Return the `content` of the related `script`.

```
GET /v0/contents/:script_id
GET /v0/script/:id/content # Alternative route
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": {
    "type": "contents",   # REQUIRED: Denotes the resource is a content
    "id": STRING,         # REQUIRED: The ID of the related script
    "attributes": {
      "payload": STRING   # REQUIRED: The content itself
    }
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## GET - /notes/:id

Return the `notes` about the given `script`.

```
GET /v0/notes/:script_id/
GET /v0/script/:id/notes # Alternative route
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": {
    "type": "notes",      # REQUIRED: Denotes the resource is a note
    "id": STRING,         # REQUIRED: The ID of the related script
    "attributes": {
      "payload": STRING   # REQUIRED: The note itself
    }
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}

```

## PATCH - /notes/:id

Update the `note` about a `script`.

```
GET /v0/scripts/:id/note
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json
{
  "data": {
    "id": STRING,
    "type": "notes",
    "attributes": {
      "payload": STRING   # RECOMMENDED: The updated note text
    }
  }
}

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": NoteResource,
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
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
      "submitStderr": STRING,   # RECOMMENDED - The standard error of the underlining scheduler command
      "resultsDir": STRING,     # RECOMMENDED - The directory that will store the results files (excluding STDOUT/STDERR)
      "mergedStderr": BOOLEAN   # RECOMMENDED - Flags if the job's STDERR has been merged with STDOUT
    },
    "links": {
      "self": "/v0/jobs/:id"
    }
    "relationships": {
      "script": {               # REQUIRED - The related script resource
        "links": {
          "related": "/v0/jobs/:id/script"
        }
      },
      "stdoutFile": {           # RECOMMENDED - The standard output of the job
        "links": "/v0/jobs/:id/stdoutFile"
      },
      "stderrFile": {           # OPTIONAL - The standard error of the job
        "links": "/v0/jobs/:id/stderrFile"
      },
      "resultFiles": {          # RECOMMENDED - Additional result files
        "links": "/v0/jobs/:id/resultFiles"
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

## GET - /jobs/:id/result-files

Return the related results `files` for the `job` (excludes `stdout` and `stderr`).

```
GET /v0/jobs/:id/result-files
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": [
    FileResource,
    ...
  ],
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## GET - /jobs/:id/stdout-file

Return the related `stdout` for the `job`.

```
GET /v0/jobs/:id/stdout-file
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": FileResource,
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## GET - /jobs/:id/stderr-file

Return the related `stderr` for the `job`.

```
GET /v0/jobs/:id/stderr-file
Authorization: basic <base64 username:password>
Accept: application/vnd.api+json

HTTP/2 200 OK
Content-Type: application/vnd.api+json
{
  "data": FileResource,
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

## GET - /files/:job_id.:encoded_name

Return the results `file` for a particular `job_id`. The `encoded_name` should be one of the following:

* `stdout`: Return the standard output of the job,
* `stderr`: Return the standard error of the job, or
* `<filename-base64>`: The relative path to any file contained within the job's working directory as a base64 encoded string \*

\* Base64 is used to encode the file paths to allow for sub directories.

By default the `payload` of the file is not returned with the request. This provides a performance benefits when using `include` queries. The following is the default return structure for a `files` resource:

```
GET /v0/files/:job_id.:encoded_name
Authorization: Bearer <jwt>
Accept: application/vnd.api+json
Content-Type: application/vnd.api+json

HTTP/2 200 OK
{
  "data": {                     # REQUIRED - The FileResource
    "type": "files",            # REQUIRED - Specfies the resource is a file
    "id": STRING,               # REQUIRED - The file's ID (:job_id.:encoded_relative_path)
    "attributes":{
      "filename": STRING,       # REQUIRED - The name of the file
      "mimeType": STRING,       # REQUIRED - The predicted MIME type of the file from the file extension
                                             Warning: This could be incorrect
      "relative_path": STRING,  # RECOMMENDED - The relative path to the file from the results_dir
      "path": STRING,           # RECOMMENDED - The path to the file
      "size": INTEGER,          # REQUIRED - The size of the file in Bytes
    },
    "links": {
      "self": "/v0/files/:id"
    }
    "meta": "The 'payload' attribute is hidden by default. It can be returned by specifying a sparse fieldset: 'fields[files]=payload'"
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}

# Returns the Standard Output and Error respectively
GET /v0/files/:job_id.stdout
GET /v0/files/:job_id.stderr
```

A [sparse field set](https://jsonapi.org/format/1.0/#fetching-sparse-fieldsets) can be used to retrieve the `payload` for the `files`. The following example only returns the `payload` attribute, however it can be combined with other `filed` and `include` queries:

```
GET /v0/files/:job_id.:encoded_name?fields[files]=payload
Authorization: Bearer <jwt>
Accept: application/vnd.api+json
Content-Type: application/vnd.api+json

HTTP/2 200 OK
{
  "data": {                     # REQUIRED - The FileResource
    "type": "files",            # REQUIRED - Specfies the resource is a file
    "id": STRING,               # REQUIRED - The file's ID (:job_id.:encoded_name)
    "attributes":{
      "payload": STRING         # REQUIRED - The content of the file using UTF-8 encoding
    },
    "links": {
      "self": "/v0/files/:id"
    }
  },
  "jsonapi": {
    "version": "1.0"
  },
  "included": [
  ]
}
```

## POST - /render/:template_id

Renders the template against the provided date and saves it to the filesystem.

There are two formats for the request payload: "Structured" and "Unstructured". The difference between the two is the request payload. The following applies to "Structured" requests. Refer to the end for "Unstructured" format.

NOTE: This route does not conform the JSON:API standard and behaves slightly differently. The authentication/ authorization process is the same however the response body will be empty. The other differences are shown below.

### Structured Requests

Structured requests MUST contain the `answers` key. The `answers` SHOULD be an object containing keys which match the `questions_ids` of the associated `template`. 

The `name` is an OPTIONAL field that sets the identifier for the `script`. It MUST be a unique STRING when provided, otherwise the response SHALL be `409 Conflict`.

The `name` is subject to the following constraints:
* It MUST start with an alphanumeric character,
* It SHOULD be primarily alphanumeric characters but MAY contain hypen and underscore,
* It MUST NOT use any other characters, and
* It SHOULD be less than 16 characters (depending on the underlining CLI tools configuration).

The response SHALL be 422 Unprocessable Entity if the above `name` constraints are not be met.

The `notes` are OPTIONAL but MUST be a string when included. They SHOULD provided additional details about the script.

Due to the underlining templating engine, this route could fail to render for various reasons including but not limited to:
1. The client not sending all the required keys, or
2. The template being misconfigured.

The API may fail to render the script due to a malformed template. The exact behaviour in this situation is undefined.

```
POST /v0/render/:template_id
Authorization: Bearer <jwt>
Content-Type: application/json
Accept: application/vnd.api+json
{
  "name": STRING,       # OPTIONAL: The name of the script
  "notes": STRING,      # OPTIONAL: Additional details about the script
  "answers": {          # REQUIRED: The answers to the associated questions
    "[key]": "[value]",
    ...
  }
}

HTTP/2 201 CREATED
Content-Type: application/vnd.api+json
{
  "data": ScriptResource,
}

# With a duplicate "name"
POST /v0/render/:template_id
Authorization: Bearer <jwt>
Content-Type: application/json
Accept: application/vnd.api+json
{
  "name": "existing-name"
}

HTTP/2 409 Conflict

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

### Unstructured Requests

Unstructured requests provide backwards compatibility with the original API specification. It will not receive future feature enhancements and SHOULD NOT be used.

Unstructured requests MUST NOT contain the `answers` key. All the top level keys SHOULD match `question_ids` of the top level template.

```
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

```
