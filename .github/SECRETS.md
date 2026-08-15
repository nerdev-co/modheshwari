# GitHub Actions Secrets Checklist (ECR + ECS)

Paste these into your repository Settings → Secrets → Actions. Use the exact secret names.

- **AWS_ACCESS_KEY_ID** — AWS access key for CI
- **AWS_SECRET_ACCESS_KEY** — AWS secret key for CI
- **AWS_REGION** — e.g. `ap-south-1`
- **AWS_ACCOUNT_ID** — AWS account ID (e.g. `992382424661`)
- **ECR_REPOSITORY** — ECR repository name, e.g. `modheshwari`
- **ECS_CLUSTER** — ECS cluster name
- **ECS_SERVICE** — ECS service name
- **ECS_TASK_FAMILY** — task definition family name used in `.github/ecs/taskdef-template.json`
- **ECS_TASK_EXECUTION_ROLE_ARN** — execution role ARN used in task definition (must be passable by CI)
- **ECS_TASK_ROLE_ARN** — task role ARN (optional if your app needs AWS permissions)

Optional (only if used):
- **AWS_SESSION_TOKEN** — only if you use temporary AWS credentials
- **SENDGRID_API_KEY**, **FIREBASE_PRIVATE_KEY**, etc. — any app secrets already in `.env.example`

Quick steps to add a secret in GitHub UI:
1. Go to your repository → Settings → Secrets → Actions.
2. Click `New repository secret`.
3. Paste the name (exact) and the value, then Save.

Minimal IAM policy for the CI user (attach to the IAM user whose keys you store as secrets):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect":"Allow","Action":["ecr:GetAuthorizationToken","ecr:BatchCheckLayerAvailability","ecr:CompleteLayerUpload","ecr:UploadLayerPart","ecr:InitiateLayerUpload","ecr:PutImage","ecr:GetDownloadUrlForLayer"],"Resource":"*"},
    {"Effect":"Allow","Action":["ecs:RegisterTaskDefinition","ecs:UpdateService","ecs:DescribeServices","ecs:DescribeTaskDefinition"],"Resource":"*"},
    {"Effect":"Allow","Action":["iam:PassRole"],"Resource":"arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole"},
    {"Effect":"Allow","Action":["logs:CreateLogStream","logs:PutLogEvents","logs:CreateLogGroup"],"Resource":"*"}
  ]
}
```

Security note: prefer using GitHub Actions OIDC provider (Workflows → Configure OIDC) to avoid storing long-lived AWS keys. If you want, I can convert the workflow to OIDC-based auth.
