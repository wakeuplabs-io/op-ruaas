
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "name" {
  description = "Name of the deployment. Used for naming resources {proy-name}-{resource}. For example, {}-vpc, {}-cluster"
  type        = string
  default     = "opruaas"
}

variable "values_path" {
  description = "The path to the Helm values.yaml file"
  type        = string
}

variable "chart_path" {
  description = "The path to the Helm chart"
  type        = string
}

variable "namespace" {
  description = "The namespace where the Helm chart will be deployed"
  type        = string
}