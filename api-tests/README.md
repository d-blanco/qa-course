# BookNook API Tests

Starter workspace for [Lab 2.4 – API Testing with Postman](../labs/2.4-api-testing-postman.md).

| File | Purpose |
|------|---------|
| `booknook-local.postman_environment.json` | Postman environment: `baseUrl` and the test account. Import it into Postman. |
| `data/qty-boundaries.csv` | Data file for the data-driven quantity tests |
| `booknook.postman_collection.json` | **You create this** by exporting your collection from Postman |

## Run Headless

Requires Node.js 22 or later, and BookNook running (see [sample-app/README.md](../sample-app/README.md)).

```bash
cd api-tests
npm install
npm test
```

| Script | Runs |
|--------|------|
| `npm test` | The whole collection, once |
| `npm run test:qty` | The `Quantity` folder once per row of `data/qty-boundaries.csv` |
