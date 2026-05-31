employee-ci-run-maven
PodAdmissionFailed


That tells us 100%:

Your Kubernetes cluster has Pod Security (restricted/baseline) enabled and is blocking Tekton task pods by default.

This is very common on:

Kubernetes ≥ 1.25

Docker Desktop (recent)

OpenShift

AKS / EKS hardened clusters
GKE Autopilot