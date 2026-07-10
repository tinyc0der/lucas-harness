# Deploy

Use this procedure for every production release because the health and rollback
checks caught the regression documented in incident #318.

1. Run the repository's current test and build scripts.
2. Deploy the release through CI.
3. Verify the health endpoint, error rate, and p95 latency.
4. Roll back through CI if any release threshold is breached.
