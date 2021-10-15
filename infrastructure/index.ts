import * as k8s from "@pulumi/kubernetes";
import * as fs from "fs";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

const imageRepositoryName = config.require("image-name");

const appLabels = {
    app: "mnpluspulumi",
};

const hostName = config.get('host-name') || "stream.lan";

const applicationNamespace = new k8s.core.v1.Namespace('micronaut-namespace', {
    metadata: {
        name: 'micronaut-pulumi-app',
        labels: appLabels,
    }
});

const serviceDiscovererAccessRole = new k8s.rbac.v1.Role('micronaut-discoverer-role', {
    metadata: {
        name: "service-discoverer",
        namespace: applicationNamespace.metadata.name,
        labels: appLabels,
    },
    rules: [
        {
            apiGroups: [""],
            resources: ["services", "endpoints", "configmaps", "secrets", "pods"],
            verbs: ["get", "watch", "list"]
        }
    ],
}, {
    dependsOn: [
        applicationNamespace,
    ],
});

const defaultServiceAccountRoleAssignment = new k8s.rbac.v1.RoleBinding('micronaut-discoverer-rolebinding', {
    metadata: {
        name: 'default-service-discoverer',
        namespace: applicationNamespace.metadata.name,
        labels: appLabels,
    },
    subjects: [
        {
            kind: "ServiceAccount",
            name: "default",
            namespace: applicationNamespace.metadata.name,
        }
    ],
    roleRef: {
        kind: "Role",
        name: serviceDiscovererAccessRole.metadata.name,
        apiGroup: "rbac.authorization.k8s.io",
    }
}, {
    dependsOn: [
        applicationNamespace,
        serviceDiscovererAccessRole,
    ],
});

const micronautConfiguration = new k8s.core.v1.ConfigMap('micronaut-configmap', {
    metadata: {
        name: 'micronaut-config',
        namespace: applicationNamespace.metadata.name,
        labels: appLabels,
    },
    data: {
        "app.yml": fs.readFileSync("app.yml").toString(),
    },
}, {
    dependsOn: [
        applicationNamespace,
    ],
});

const micronautSecret = new k8s.core.v1.Secret('micronaut-secret', {
    metadata: {
        name: 'micronaut-secret',
        namespace: applicationNamespace.metadata.name,
        labels: appLabels,
    },
    stringData: {
        "io.eldermael.pulumi.app.secret.entry": config.requireSecret('micronaut-secret'),
    },
}, {
    dependsOn: [
        applicationNamespace,
    ]
})

const micronautDeployment = new k8s.apps.v1.Deployment("micronaut-deployment", {
    metadata: {
        name: 'micronaut-app',
        namespace: applicationNamespace.metadata.name,
        labels: appLabels,
    },
    spec: {
        selector: {
            matchLabels: appLabels
        },
        replicas: 1,
        template: {
            metadata: {
                labels: appLabels
            },
            spec: {
                containers: [
                    {
                        name: "micronaut",
                        image: `${imageRepositoryName}:0.1`,
                        imagePullPolicy: "Always",
                        ports: [
                            {
                                protocol: "TCP",
                                name: "http",
                                containerPort: 8080,
                            },
                        ]
                    }
                ],
            }
        }
    }
}, {
    dependsOn: [
        micronautSecret,
        applicationNamespace,
        micronautConfiguration,
        defaultServiceAccountRoleAssignment,
    ],
});

const micronautService = new k8s.core.v1.Service('micronaut-service', {
    metadata: {
        name: 'micronaut-service',
        labels: appLabels,
        namespace: applicationNamespace.metadata.name,
    },
    spec: {
        type: "ClusterIP",
        selector: appLabels,
        ports: [
            {
                name: "http",
                protocol: "TCP",
                port: 80,
                targetPort: 8080,
            }
        ],
    }
}, {
    dependsOn: [
        applicationNamespace,
    ],
});

const micronautIngress = new k8s.networking.v1.Ingress('micronaut-ingress', {
    metadata: {
        name: 'micronaut-ingress',
        labels: appLabels,
        namespace: applicationNamespace.metadata.name,
    },
    spec: {
        rules: [
            {
                host: hostName, // change this to suite your needs :)
                http: {
                    paths: [
                        {
                            path: "/config",
                            pathType: "ImplementationSpecific",
                            backend: {
                                service: {
                                    name: micronautService.metadata.name,
                                    port: {
                                        number: 80,
                                    }
                                },
                            }
                        },
                    ],
                }
            }
        ],
    }

}, {
    dependsOn: [
        micronautService,
    ],
});


export const ingressHostName = hostName;
export const deploymentName = micronautDeployment.metadata.name;
