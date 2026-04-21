# Server ↔ Client integration

## URLs

- **API base (Vite):** set in `client/.env` as `VITE_API_URL=http://localhost:5000/api`
- **Server:** `server/.env` → `PORT=5000` (default)

The client’s shared axios instance (`client/src/api/axiosConfig.js`) and `dormApi` (`client/src/api/dormApi.js`) both use that base URL.

**Multipart (maintenance, complaints, lost & found, dorm, marketplace):** the axios instance defaults to `Content-Type: application/json`. For `FormData` uploads, the request interceptor **removes** `Content-Type` so the browser sends `multipart/form-data` with a valid **boundary** (required for `multer` on the server). Do not set `Content-Type: multipart/form-data` manually on those requests.

## Dorm application (FYDA / National ID scan)

| Client (`PlacementRequestSimple`) | Server (`POST /api/dorm/application`) |
|-----------------------------------|----------------------------------------|
| `fydaFront`, `fydaBack` (images)  | Same field names + legacy `nationalIdFront` / `nationalIdBack` |
| `city`                            | Required; must match **English** text on the **back** of the FYDA (OCR; Amharic ignored for matching) |
| `addisLetter`                     | Required only for **central** Addis / Sheger / Finfinne (not for declared **outskirts** keywords, e.g. Akaki/Kality/Kolfe — detected after OCR) |
| `paymentReceipt`                  | Required if student is **Self-Sponsored** |

**Auto-assign (status `Assigned`, not `Pending`):** when OCR verifies the address and the case is **outside Addis** or **Addis but far / outskirts** (heuristic keyword list in `server/src/utils/fydaAddressMatch.js`). Room pick prefers `student.department` → campus (`server/src/utils/campus.js`), then any same-gender vacancy.

**GET current application:** `GET /api/dorm/application` (alias: `GET /api/dorm/my-application`)  
Response: `{ success: true, application: <doc or null> }`

## Image scanning dependency (server)

OCR uses **`tesseract.js`** (declared in `server/package.json`). First run may download English trained data via the network.

Install server deps from repo root:

```bash
cd server
npm install
```

Removed unused **`@google-cloud/vision`** (was not referenced in code; avoids extra credentials).

## Run locally

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Ensure MongoDB is reachable (`MONGO_URI` in `server/.env`).

## Extra API routes (mounted on server)

| Area | Base path | Notes |
|------|-----------|--------|
| Events | `GET/POST /api/events`, `GET /api/events/mine`, `DELETE /api/events/:id` | `POST` requires auth (Student / CampusAdmin / SuperAdmin) |
| Notices | `GET/POST /api/notices` | Public `GET`; `POST` protected |
| Marketplace | `GET /api/marketplace/public`, `GET/POST /api/marketplace`, `GET /api/marketplace/mine`, `DELETE /api/marketplace/:id`, `PUT /api/marketplace/:id/sold` | Public list at `/public` |
| Lost & Found | `GET /api/lost-found/public` | Open items, no auth (home page) |
| Notifications | `DELETE /api/notifications/:id` | Delete own notification |
