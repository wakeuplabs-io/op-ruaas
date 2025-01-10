
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

variable "values_file_path" {
  description = "The path to the Helm values.yaml file"
  type        = string
  default     = "../helm/values.yaml"  
}