# Global Renewable Energy Transitions

An interactive 3D globe visualizing the growth of renewable energy capacity (solar & wind) across countries from 2000–2024. Built with [globe.gl](https://globe.gl/), D3, and R/Shiny.

**Live site:** [Deploy to Vercel — see instructions below]

## What it shows

- Choropleth coloring of countries by renewable energy metrics (total capacity, % growth, net change)
- Regional storytelling — step through 7 world regions with narrative context
- Year stepping from 2000 to 2024
- Solar photovoltaic potential overlay (experimental)
- Regional vs. worldwide scaling

## Repository structure

```
├── web/                         # Static site — deployed to Vercel
│   ├── index.html
│   ├── globe.js                 # Core globe logic (converted from R htmlwidget)
│   ├── globe.css
│   ├── customtheming.css
│   └── data/
│       ├── comparisons.json     # Regional scaling limits
│       ├── countries_story.json # Narrative content per region/energy/year
│       └── countries_updated.geojson  # Country polygons + energy data
│
├── shiny/                       # Original R Shiny app
│   ├── app.R
│   └── data/
│
├── widget/                      # Original R htmlwidget source
│   ├── R/mywidget.R
│   └── inst/htmlwidgets/
│       ├── mywidget.js
│       ├── mywidget.css
│       └── mywidget.yaml
│
├── data/
│   ├── raw/                     # Source datasets (IRENA, SolarGIS, etc.)
│   └── processed/               # Pipeline outputs (GeoJSON, JSON)
│
├── scripts/
│   ├── eda.R                    # Exploratory data analysis
│   └── preprocessing.Rmd        # Data preprocessing pipeline
│
├── docs/                        # Quarto project writeup
│   ├── about.qmd
│   ├── presentation.qmd
│   └── _quarto.yml
│
├── renewable-energy-globe.Rproj
└── vercel.json                  # Vercel deployment config
```

## Tech stack

| Layer | Technology |
|---|---|
| 3D Globe | [globe.gl](https://globe.gl/) v2.41.4 |
| Color scales | [D3](https://d3js.org/) v7 |
| Data processing | R (tidyverse, readxl, janitor) |
| Original app | R Shiny + htmlwidgets |
| Static deployment | HTML / CSS / JS → Vercel |

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
cd project-2-data-sages-main
vercel
```

Vercel will auto-detect `vercel.json` and serve the `web/` directory.

### Option B — Vercel Dashboard (no CLI needed)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import the GitHub repo
4. Vercel reads `vercel.json` automatically — no extra configuration needed
5. Click **Deploy**

## Run locally

Open `web/index.html` via a local server (required for `fetch()` to work):

```bash
# Python
cd web
python -m http.server 8080
# then open http://localhost:8080

# Node
npx serve web
```

> Opening `index.html` directly as a `file://` URL will fail due to browser CORS restrictions on local JSON fetches.

## Data sources

- **IRENA** — Renewable Energy Statistics (`irena_stats.xlsx`)
- **SolarGIS** — Photovoltaic potential by country (`solargis_pvpotential_countryranking_2020_data.xlsx`)
- **Natural Earth** — Country boundaries (GeoJSON)
