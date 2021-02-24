import { useContext } from 'react';
import useFetch from 'use-http';

import { CurrentUserContext } from './lib';

export function useFetchTemplates() {
  const { currentUser } = useContext(CurrentUserContext);
  return useFetch(
    "/templates",
    { headers: { Accept: 'application/vnd.api+json' } },
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

export function useSubmitScript(script) {
  const request = useFetch(
    '/submissions',
    {
      method: 'post',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: {
        "data": {
          "type": "submissions",
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
