# Air Pollution City Ranking API

This API returns the most polluted cities from selected European countries, cleaned and sorted, with optional Wikipedia descriptions.


## How to Run Locally

1. **Clone or download the repo**
git clone https://github.com/Harshit9651/bookin-guru-task.git

2. **install dependencis:**
npm i 
3. **run the code:**
npm run dev
3. **then explore the api:**
http://localhost:3000/api/v1/cities?page=1&limit=5

##  Approach

Here’s how I built the logic step-by-step:

1. **Login to Mock API**  
   I first authenticate with the mock API by sending my username and password.  
   The API returns an authentication token which is required for all further requests.

2. **Fetch Data for Multiple Countries**  
   Using the token, I pull pollution data for four countries: **Poland (PL)**, **Germany (DE)**, **Spain (ES)**, and **France (FR)**.  
   Each request is limited to 50 results to keep the response manageable.

3. **Normalize Records**  
   - Convert city names to **Title Case** and remove any special accents.  
   - Replace ISO country codes with full country names.  
   - Extract coordinates into a `{ lat, lon }` format if available.  
   - Ensure the pollution value is a valid number.

4. **Validate Each Record**  
   - Discard entries if the city name is too short, numeric-only, or contains irrelevant terms like `"station"`, `"power plant"`, etc.  
   - Verify the country field is valid.  
   - Make sure coordinates fall within realistic latitude/longitude ranges.

5. **Deduplicate**  
   Some cities appear multiple times in the data.  
   In such cases, I keep only the entry with the **highest pollution value**.

6. **Sort by Pollution**  
   The cleaned list is sorted in **descending order** so the most polluted cities appear first.

7. **Enrich with Wikipedia**  
   For each city, I attempt to fetch a short Wikipedia summary.  
   If no summary is available, the `description` field is set to `null`.

8. **Clean Output**  
   Before sending the response, I remove internal fields like `sourceId` so the client only sees useful data.

9. **Cache Results**  
   The final processed list is cached in memory for **5 minutes** to reduce API calls and improve performance.
