#! /bin/bash

rm -rf ./artifacts
rm -rf ./cache
rm -rf ./deployments/localhost
export NODE_ENV=TEST
pnpm hardhat deploy --tags multipass,rankify --network localhost
