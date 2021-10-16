## Pulumi (K8s) & Micronaut Example

This is an example of a micronaut application being deployed to a
Kubernetes cluster using Pulumi to provision. 

It shows how to provision Micronaut to read ConfigMaps and Secrets
as properties sources. These will be provisioned as well by Pulumi.

# Requirements

- Install Pulumi
  ```bash
    $ curl -fsSL https://get.pulumi.com | sh
  ```

- Create a [Docker hub repository for your image](https://hub.docker.com/repository/create).
  
- Log in to Docker hub, Pulumi requires a public image to create the
  deployment. This repo will push it to whatever repository you are logged
  in. It must be accessible from your K8s Cluster.

  ```bash
  $ docker login
  ```

- Set your Kubernetes Context (or use your default one)
  ```bash
  export KUBECONFIG=/home/eldermael/.kube/context
  ```

## How To Run

- Run the installation script with your repository name.

  ```bash
  $ ./build-and-publish.sh "username/image"
  ```
  
This script will push a new image to the repository specified in dockerhub.
Then pulumi will use that image to create the required objets:

```bash
$ pulumi up
Previewing update (dev)

View Live: ...

     Type                                                    Name                              Plan       
 +   pulumi:pulumi:Stack                                     pulumi-k8s-app-dev                create     
 +   ├─ kubernetes:core/v1:Namespace                         micronaut-namespace               create     
 +   ├─ kubernetes:core/v1:ConfigMap                         micronaut-object-configmap        create     
 +   ├─ kubernetes:core/v1:ConfigMap                         micronaut-configmap               create     
 +   ├─ kubernetes:rbac.authorization.k8s.io/v1:Role         micronaut-discoverer-role         create     
 +   ├─ kubernetes:core/v1:Service                           micronaut-service                 create     
 +   ├─ kubernetes:core/v1:Secret                            micronaut-secret                  create     
 +   ├─ kubernetes:rbac.authorization.k8s.io/v1:RoleBinding  micronaut-discoverer-rolebinding  create     
 +   ├─ kubernetes:networking.k8s.io/v1:Ingress              micronaut-ingress                 create     
 +   └─ kubernetes:apps/v1:Deployment                        micronaut-deployment              create     
 
Resources:
    + 10 to create

Do you want to perform this update?  [Use arrows to move, enter to select, type to filter]
  yes
> no
  details

```

## How To Verify

The deployment must happen to a namespace named `micronaut-pulumi-app`. You
can port forward the application locally and verify the endpoint returns
the required property.

```bash
kubectl -n micronaut-pulumi-app port-forward micronaut-app-xxxx-xxxx 8080
```

In this case, I use HTTPie to create a request to the server.

```bash
$ http http://stream.lan/config
HTTP/1.1 200 OK
Content-Length: 119
Content-Type: application/json
Date: Sat, 16 Oct 2021 15:03:23 GMT
Vary: Accept-Encoding

{
    "another_config": "Hi, from a TS Object Configuration",
    "config": "Hello from Pulumi",
    "secret": "Hello, this is a secret"
}

```

## Clean Up

Run `pulumi destroy` in the `infrastructure` directory.