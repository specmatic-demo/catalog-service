# catalog-service

This is a federated provider repository.

It provides these contracts from the local `specs` directory:

- [specs/openapi.yaml](/Users/jaydeep/znsio/specmatic-demo/catalog-service/specs/openapi.yaml)
- [specs/schema.graphql](/Users/jaydeep/znsio/specmatic-demo/catalog-service/specs/schema.graphql)

## Run the service

Run this from the `catalog-service` repository root:

```bash
docker compose up --build
```

This starts the service on `localhost:9000`.
It serves HTTP endpoints and the GraphQL endpoint at `http://localhost:9000/graphql`.

## Run contract tests

In another terminal, run this from the `catalog-service` repository root:

```bash
docker run --rm -it \
  -v "$(pwd):/usr/src/app" \
  -v ~/.specmatic:/root/.specmatic \
  --network=host \
  specmatic/enterprise \
  test
```

The generated test reports will be written under:

- `build/reports/specmatic`

## Generate the central contract repo report

Run this from the `catalog-service` repository root:

```bash
docker run -it \
  -v "$(pwd):/usr/src/app" \
  -v ~/.specmatic:/root/.specmatic \
  -w /usr/src/app/specs \
  --network=host \
  specmatic/specmatic \
  central-contract-repo-report
```

Expected output file:

- `specs/build/reports/specmatic/central_contract_repo_report.json`

## Send the central contract repo report to Insights

Run this from the `catalog-service` repository root:

```bash
docker run -it \
  -v "$(pwd):/usr/src/app" \
  -v ~/.specmatic:/root/.specmatic \
  -w /usr/src/app/specs \
  --network=host \
  specmatic/specmatic \
  send-report \
  --branch-name=main \
  --repo-name="$(gh repo view --json name -q .name)" \
  --repo-id="$(gh api 'repos/{owner}/{repo}' --jq .id)" \
  --repo-url="$(gh repo view --json url --jq .url)"
```

## Send the service test report to Insights

After the test run completes, run this from the `catalog-service` repository root:

```bash
docker run -it \
  -v "$(pwd):/usr/src/app" \
  -v ~/.specmatic:/root/.specmatic \
  -w /usr/src/app \
  --network=host \
  specmatic/specmatic \
  send-report \
  --branch-name=main \
  --repo-name="$(gh repo view --json name -q .name)" \
  --repo-id="$(gh api 'repos/{owner}/{repo}' --jq .id)" \
  --repo-url="$(gh repo view --json url --jq .url)"
```
