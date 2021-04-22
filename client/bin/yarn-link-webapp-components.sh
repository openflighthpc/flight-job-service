#!/bin/bash

CLIENT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"/..

cd "${CLIENT_ROOT}"
yarn link flight-webapp-components
yarn link use-http
yarn link react
yarn link react-dom
( cd "${CLIENT_ROOT}"/node_modules/react-dom && yarn link react )
