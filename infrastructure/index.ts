import * as k8s from "@pulumi/kubernetes";
import * as fs from "fs";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

const imageName = config.require("image-name");

const appLabels = {
    app: "mnPlusPulumi",
};

const appNamespace = new k8s.core.v1.Namespace('app-namespace', {
    metadata: {
        name: 'micronaut-pulumi-app',
        labels: appLabels,
    }
});

const appConfigMapAccessRole = new k8s.rbac.v1.Role('micronaut-configmap-role', {
    metadata: {
        name: "service-discoverer",
        namespace: appNamespace.metadata.name,
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
        appNamespace,
    ],
});

const appRoleBindingToAccessor = new k8s.rbac.v1.RoleBinding('micronaut-rolebinding', {
    metadata: {
        name: 'default-service-discoverer',
        namespace: appNamespace.metadata.name,
    },
    subjects: [
        {
            kind: "ServiceAccount",
            name: "default",
            namespace: appNamespace.metadata.name,
        }
    ],
    roleRef: {
        kind: "Role",
        name: appConfigMapAccessRole.metadata.name,
        apiGroup: "rbac.authorization.k8s.io",
    }
}, {
    dependsOn: [
        appNamespace,
        appConfigMapAccessRole,
    ],
});

const appConfig = new k8s.core.v1.ConfigMap('micronaut-configmap', {
    metadata: {
        name: 'micronaut-config',
        namespace: appNamespace.metadata.name,
        labels: appLabels,
    },
    data: {
        "app.yml": fs.readFileSync("app.yml").toString(),
    },
}, {
    dependsOn: [
        appNamespace,
    ],
});

const appSecret = new k8s.core.v1.Secret('micronaut-secret', {
    metadata: {
        name: 'micronaut-secret',
        namespace: appNamespace.metadata.name,
        labels: appLabels,
    },
    stringData: {
        "io.eldermael.pulumi.app.secret.entry": config.requireSecret('micronaut-secret'),
    },
}, {
    dependsOn: [
        appNamespace,
    ]
})

const deployment = new k8s.apps.v1.Deployment("micronaut-app", {
    metadata: {
        name: 'micronaut-app',
        namespace: appNamespace.metadata.name,
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
                        image: `${imageName}:0.1`,
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
        appNamespace,
        appConfig,
        appSecret,
        appRoleBindingToAccessor,
    ],
});

const micronautService = new k8s.core.v1.Service('micronaut-service', {
    metadata: {
        name: 'micronaut-service',
        labels: appLabels,
        namespace: appNamespace.metadata.name,
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
        appNamespace,
    ],
});


export const name = deployment.metadata.name;
