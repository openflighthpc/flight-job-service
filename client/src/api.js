import { useContext } from 'react';
import useFetch from 'use-http';

import {
  CurrentUserContext,
  utils,
} from 'flight-webapp-components';

export function useFetchTemplates() {
  const { currentUser } = useContext(CurrentUserContext);
  return useFetch(
    "/templates",
    { headers: { Accept: 'application/vnd.api+json' } },
    [ currentUser.authToken ]);
}

export function useFetchTemplate(id) {
  const { currentUser } = useContext(CurrentUserContext);
  return useFetch(
    `/templates/${id}`,
    {
      headers: { Accept: 'application/vnd.api+json' },
      interceptors: {
        response: async ({ response }) => {
          if (response.ok) {
            denormalizeResponse(response);
          }
          return response;
        }
      }
    },
    [ currentUser.authToken ]);
}

export function useFetchQuestions(templateId) {
  const { currentUser } = useContext(CurrentUserContext);
  return useFetch(
    `/templates/${templateId}/questions`,
    { headers: { Accept: 'application/vnd.api+json' } },
    [ templateId, currentUser.authToken ]
  );
}

export function useGenerateScript(templateId, answers) {
  const request = useFetch(
    `/render/${templateId}`,
    {
      method: 'post',
      headers: {
        Accept: 'text/plain',
        'Content-Type': 'application/json',
      },
      body: answers,
      cachePolicy: 'no-cache',
    },
  );
  return request;
}

export function useFetchScripts() {
  const { currentUser } = useContext(CurrentUserContext);
  return useFetch(
    "/scripts?include=template",
    { headers: { Accept: 'application/vnd.api+json' } },
    [ currentUser.authToken ]);
}

export function useFetchScript(id) {
  const { currentUser } = useContext(CurrentUserContext);
  return useFetch(
    `/scripts/${id}?include=template`,
    {
      headers: { Accept: 'application/vnd.api+json' },
      interceptors: {
        response: async ({ response }) => {
          if (response.ok) {
            denormalizeResponse(response);
          }
          return response;
        }
      }
    },
    [ currentUser.authToken ]);
}

export function useSubmitScript(script) {
  const request = useFetch(
    '/jobs',
    {
      method: 'post',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: {
        "data": {
          "type": "jobs",
          "relationships": {
            "script": {
              "data": {
                "type": "scripts",
                "id": script.id,
              }
            }
          }
        }
      },
      cachePolicy: 'no-cache',
    },
  );
  return request;
}

export function useDeleteScript(script) {
  const request = useFetch(
    `/scripts/${script.id}`,
    {
      method: 'delete',
      headers: {
        Accept: 'application/vnd.api+json',
      //   'Content-Type': 'application/vnd.api+json',
      },
      cachePolicy: 'no-cache',
    },
  );
  return request;
}

function getResourceFromResponse(data) {
  if (!utils.isObject(data)) { return null; }
  return data.data;
}

function denormalizeResponse(response, { isArray=false }={}) {
  const data = response.data;
  let resources;
  if (isArray) {
    resources = utils.getResourcesFromResponse(data);
  } else {
    resources = [ getResourceFromResponse(data) ].filter(i => i != null);
  }
  if (resources == null) { return; }

  resources.forEach((resource) => {
    if (!resource.denormalized) {
      Object.defineProperty(resource, 'denormalized', { value: true, writable: false });

      Object.keys(resource.relationships || {}).forEach((relName) => {
        const relNeedle = resource.relationships[relName].data;
        Object.defineProperty(
          resource,
          relName,
          {
            get: function() {
              if (relNeedle == null) { return null; }
              const haystack = data.included || [];
              return haystack.find((hay) => {
                return hay.type === relNeedle.type && hay.id === relNeedle.id;
              });
            },
          },
        );
      });
    }
  });
}

export function useFetchJobs() {
  const { currentUser } = useContext(CurrentUserContext);
  return useFetch(
    "/jobs?include=script",
    {
      headers: { Accept: 'application/vnd.api+json' },
      interceptors: {
        response: async ({ response }) => {
          if (response.ok) {
            denormalizeResponse(response, { isArray: true });
            // setJobDefaults(response);
          }
          return response;
        }
      }
    },
    [ currentUser.authToken ]);
}


export function useFetchJob(id) {
  const { currentUser } = useContext(CurrentUserContext);
  return useFetch(
    `/jobs/${id}?include=script`,
    {
      headers: { Accept: 'application/vnd.api+json' },
      interceptors: {
        response: async ({ response }) => {
          if (response.ok) {
            denormalizeResponse(response);
            // setJobDefaults([ response.data.data ]);
          }
          return response;
        }
      }
    },
    [ currentUser.authToken ]);
}
