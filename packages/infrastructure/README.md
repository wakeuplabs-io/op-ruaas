# Instructions

With terraform:

1. Fill the values in `helm/values.yaml`
2. Fill up variables in `aws/variables.tf`
3. Deploy infra with `terraform apply` from aws dir
4. Use `terraform output <output_name>` to quickly gain data from your deployment like `elb_dnsname` for setting up the domain records, or `configure_kubectl` to help you connect to the cluster or to get output urls.

Without terraform:

1. Spin up your cluster
2. Deploy nginx as follows

```bash
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx && helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
```

3. Deploy Cert manager

```bash
helm repo add jetstack https://charts.jetstack.io && helm repo update
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --version v1.10.0 --set installCRDs=true
```

4. Update values.yaml accordingly
5. Deploy opraas chart

```bash
helm install opruaas ./helm --namespace opruaas --create-namespace -f ./helm/values.yaml
```

## SSL certificate

For https domain make sure to create an A record pointing to `elb_dnsname` as specified here: https://github.com/amcginlay/venafi-demos/tree/main/demos/01-eks-ingress-nginx-cert-manager#configure-route53

You can get `elb_dnsname` with `terraform output elb_dnsname` or with `kubectl -n ingress-nginx get service ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'`

Also, all ingress should be defined in `helm/templates/ingress.yaml`

## Self references in helm/values.yaml

You may notice we use `self....` in the helm values.yaml file, for example for `self.global.host` or `self.chain.id`. Be aware this is not a yaml nor helm feature, this will only work if you're using the opruaas CLI, in any other case you'll need to replace these values manually ensuring they are consistent across the values file. Notice also if you decide to opt out, the cli will not be capable of helping you replace, for example between local and prod enviroments, so before `dev` you'll need to recheck, same before `deploy`.
