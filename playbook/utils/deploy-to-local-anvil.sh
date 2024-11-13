#! /bin/bash

rm -rf ./deployments/localhost
rm -rf ./artifacts
export NODE_ENV=TEST
pnpm hardhat deploy --tags multipass,rankify --network localhost
