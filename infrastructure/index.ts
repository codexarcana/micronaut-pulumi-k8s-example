import * as k8s from "@pulumi/kubernetes";
import * as fs from "fs";

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
                        image: "eldermael/micronaut-pulumi:0.1",
                        imagePullPolicy: "Always"
                    }
                ]
            }
        }
    }
}, {
    dependsOn: [
        appNamespace,
        appConfig,
        appRoleBindingToAccessor,
    ],
});


export const name = deployment.metadata.name;
