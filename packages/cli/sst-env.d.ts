/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "Web": {
      "id": string
      "secret": string
      "type": "sst.aws.CognitoUserPoolClient"
    }
    "opruaas-api": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "opruaas-artifacts": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "opruaas-db": {
      "database": string
      "host": string
      "password": string
      "port": number
      "type": "sst.aws.Aurora"
      "username": string
    }
    "opruaas-ui": {
      "type": "sst.aws.StaticSite"
      "url": string
    }
    "opruaas-user-pool": {
      "id": string
      "type": "sst.aws.CognitoUserPool"
    }
    "opruaas-vpc": {
      "bastion": string
      "type": "sst.aws.Vpc"
    }
  }
}