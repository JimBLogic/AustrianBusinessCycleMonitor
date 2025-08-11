# Kubernetes Configuration

This directory contains example Kubernetes configuration for deploying the Austrian Business Cycle Monitor.

## Files
- `kubeconfig.sample` – Example kubeconfig structure (no real credentials)
- `deployment.yaml` – Deployment resource for the dashboard/web API
- `service.yaml` – ClusterIP Service exposing the application
- `ingress.yaml` – Optional Ingress resource (annotated for NGINX)
- `configmap.yaml` – Environment & app configuration (non-secrets)
- `secret.example.yaml` – Template for creating Kubernetes Secret (never commit real keys)

## Usage
1. Copy `kubeconfig.sample` to a secure path (e.g. `~/.kube/config_abcm`) and merge with your real cluster credentials.
2. Replace placeholders (`YOUR_NAMESPACE`, `YOUR_REAL_IMAGE`, etc.).
3. Create namespace (if not existing):
   kubectl create namespace austrian-monitor
4. Apply manifests:
   kubectl apply -n austrian-monitor -f configmap.yaml
   kubectl apply -n austrian-monitor -f secret.example.yaml  # after editing & renaming to secret.yaml
   kubectl apply -n austrian-monitor -f deployment.yaml
   kubectl apply -n austrian-monitor -f service.yaml
   kubectl apply -n austrian-monitor -f ingress.yaml  # if using ingress

## Security Notes
- Do NOT commit a real kubeconfig with cluster certs/tokens.
- Use external secret managers (e.g. sealed-secrets / external-secrets) for production.
- Set resource requests/limits to ensure predictable performance.
