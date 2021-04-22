#!/bin/bash

CLIENT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"/..

cd "${CLIENT_ROOT}"
( cd "${CLIENT_ROOT}"/node_modules/react-dom && yarn unlink react )
yarn unlink react-dom
yarn unlink react
yarn unlink use-http
yarn unlink flight-webapp-components

yarn install --check-files
