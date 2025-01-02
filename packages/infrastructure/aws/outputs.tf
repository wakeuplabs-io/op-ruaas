# ======================================================================
# General
# ======================================================================

output "region" {
  description = "AWS region"
  value       = var.region
}

# ======================================================================
# Cluster
# ======================================================================

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = module.eks.cluster_security_group_id
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = module.eks.cluster_name
}

output "configure_kubectl" {
  description = "Configure kubectl: run the following command to update your kubeconfig"
  value       = "aws eks --region ${var.region} update-kubeconfig --name ${module.eks.cluster_name}"
}

# ======================================================================
# Load balancer
# ======================================================================

data "kubernetes_service" "ingress_nginx_controller" {
  depends_on = [helm_release.ingress_nginx]

  metadata {
    name      = "ingress-nginx-controller"
    namespace = "ingress-nginx"
  }
}

output "elb_dnsname" {
  description = "AWS load balancer dns name needed for setting up the domain records"
  value = data.kubernetes_service.ingress_nginx_controller.status[0].load_balancer[0].ingress[0].hostname
}
