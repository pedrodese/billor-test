# Billor Coding Challenge: Solutions Engineer

This project demonstrates a microservices-based architecture for automated load extraction, large language model (LLM) summarization using GPT Compute Preview, and PostgreSQL data orchestration. It uses Node.js, NestJS, Docker, and Prometheus for observability.

Note: During the development period of this challenge, the website https://www.landstaronline.com/loadspublic was unavailable.
To ensure consistent functionality, I implemented error handling and fallback logic so that the automation routine continues to work regardless of the availability of the Landstar portal.

---

## Project Structure

```
.
├── automation-service/        # Puppeteer scraping + summary persistence
├── gpt-service/               # GPT-4 load summarization
├── docker-compose.yml         # Multi-service orchestration
├── automation-logs/           # Logs for Puppeteer
├── gpt-logs/                  # Logs for GPT service
└── README.md                  # Project documentation
```

---

## Technologies Used

* Node.js + NestJS
* Puppeteer
* OpenAI SDK (`openai@^4.x`)
* PostgreSQL
* TypeORM
* Prometheus (`prom-client`)
* Docker & Docker Compose
* Jest + Supertest (testing)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pedrodese/billor-coding-challenge.git
cd billor-coding-challenge
```

### 2. Build and Run the Stack

```bash
docker-compose up --build
```

Services will be available at:

* **Automation Service**: [http://localhost:3001](http://localhost:3001)
* **GPT Service**: [http://localhost:3002](http://localhost:3002)
* **PostgreSQL**: port 5432

---

## Health Checks

Each service exposes a health check endpoint:

* `GET /health` – verifies that the app is running

---

## Endpoints

### Automation Service

| Method | Route                  | Description                    |
| ------ | ---------------------- | ------------------------------ |
| POST   | `/load-extraction/run` | Extracts data and sends to GPT |
| GET    | `/load-extraction/all-loads`           | Make the scraping and show  |
| GET   | `/summaries` | Get all the summaries paginated |
| GET    | `/metrics`             | Prometheus metrics endpoint    |
| GET    | `/health`              | Health status                  |


### GPT Service

| Method | Route              | Description                                    |
| ------ | ------------------ | ---------------------------------------------- |
| POST   | `/summarize-loads` | Accepts load array, returns GPT-based insights |
| GET    | `/health`          | Health status                                  |

---

## Tests

Run tests from each service directory:

```bash
# Inside automation-service/
npm run test

# Inside gpt-service/
npm run test
```

Includes unit tests, E2E tests with mocks, and error handling coverage.

---

## Sample Request & Response

### POST `/summarize-loads`

#### Request:

```json
{
  "loads": [
    {
      "load_id": 1,
      "origin": "Dallas, TX",
      "destination": "Austin, TX",
      "pickupTime": "2025-06-01",
      "deliveryTime": "2025-06-02",
      "loadedWeight": "20,000 lbs",
      "route": "I-35 South",
      "equipment": "Reefer"
    }
  ]
}
```

#### Response:

```json
{
  "1": {
    "summary": "Load 1 is a short-haul route from Dallas to Austin with moderate weight.",
    "insights": [
      "Fuel-efficient short route via I-35",
      "No rest stops needed",
      "Weight is optimal for single-day delivery"
    ]
  }
}


```

### POST `/load-extraction/run`

#### Response:

```json
{
    "status": "success",
    "message": "Extraction successful"
}


```

### GET `/summaries`

#### Response:

```json
{
  "id": 4,
  "load": {
      "id": 1,
      "origin": "Trenton, OH 45067",
      "destination": "Joliet, IL 60433",
      "pickupTime": "May 26, 2025 12:01 AM - 11:55 PM",
      "deliveryTime": "May 27, 2025 9:00 AM",
      "route": "Load 2 Stops",
      "loadedWeight": "45,500 lbs",
      "equipment": "Power Only",
      "created_at": "2025-05-26T02:36:43.108Z"
  },
  "summary_text": "Load 1 travels from Trenton, OH 45067 to Joliet, IL 60433 with a weight of 45,500 lbs, loading at 2 stops.",
  "insights": [
      "Heavy load",
      "Two stops involved"
  ],
  "created_at": "2025-05-26T02:37:29.652Z"
},

```

---

## Database & Orchestration

PostgreSQL schema includes:

* `drivers`
* `loads`
* `summaries`

A **materialized view** (`load_summary_view`) joins `loads` and `summaries` for analytics.

### Example SQL Query:

```sql
SELECT *
FROM load_summary_view
ORDER BY jsonb_array_length(insights) DESC
LIMIT 5;
```

> Returns top 5 loads with the most insights.

---

## Observability

Metrics are exposed at:

```
GET /metrics
```

Includes:

* `load_extraction_runs_total`
* `load_extraction_failures_total`
* `load_extraction_duration_seconds`
* `load_extracted_items_total`

---

## Retry Logic

The Automation Service retries failed GPT requests with **exponential backoff** using `axios-retry`.

---

## Test Coverage

* Unit + E2E tests written with Jest and Supertest
* OpenAI API and Puppeteer interactions are mocked
* Covers success paths, fallback strategies, JSON parsing errors

---

## Deployment Instructions

```bash
docker-compose up --build
```

To reset the DB:

```bash
docker-compose down -v
```
