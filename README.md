# Global Renewable Energy Transitions

An end-to-end data project tracking solar and wind energy capacity growth across every country from 2000 to 2024. The output is an interactive 3D globe built in R and JavaScript — you step through years, switch between regions, and watch how the energy picture shifts country by country.

---

## What it shows

The globe colors every country based on three metrics you can switch between:

- **Total installed capacity (MW)** : how much solar or wind a country has built in a given year
- **Year-over-year % growth**: how fast it's growing relative to its own prior year
- **Net MW change**: raw capacity added or removed vs. the previous year

Alongside the visualization, I modeled growth trends using lag-based time series analysis — computing absolute and percentage change for each country across every year — and used regional max aggregations to build a dynamic color scale that recalibrates when you switch between worldwide and regional views. The regional scaling was a direct result of the EDA finding that Africa and South America are nearly invisible on a global scale despite meaningful growth rates.

There's also a solar PV potential overlay (SolarGIS data) that lets you compare a country's actual capacity against the solar resource it has available — useful for spotting where the gap between potential and deployment is largest.

---

## Data pipeline

### Where the data comes from

The project pulls from two public datasets. IRENA publishes annual renewable electricity capacity by country and technology going back to 2000 — that's the backbone. SolarGIS has country-level photovoltaic potential rankings, which power the solar overlay. I also put together a small CSV manually mapping ISO Alpha-3 codes to the seven regions the globe uses for its storytelling mode, since no clean version of that grouping existed off the shelf.

Raw files sit in `data/raw/` untouched.

| File | Source |
|---|---|
| `irena_stats.xlsx` | [IRENA](https://www.irena.org/Statistics) |
| `solargis_pvpotential_countryranking_2020_data.xlsx` | [SolarGIS](https://solargis.com) |
| `world_country_and_usa_states_latitude_and_longitude_values.csv` | Public domain |
| `country_region_pairing_SHARE.csv` | Manually compiled |

### Cleaning and transformation (`scripts/preprocessing.Rmd`)

The IRENA file has multiple sheets — country-level data on sheet 2, regional aggregates on sheet 3. I loaded both with `readxl` and cleaned up the column names with `janitor::clean_names()`.

The trickier part was the missing data. IRENA only includes rows where a country reported capacity, so any country-year with zero capacity simply doesn't appear. Before calculating any growth rates, I built a complete grid of every country × year × energy type with `expand.grid()`, joined the actual data onto it, and filled the gaps with zero. Without that step, lag-based calculations break at the edges and growth rates come out wrong.

From the filled panel I computed three features per country per technology per year: total installed capacity in MW, the raw MW change from the prior year via lag differencing, and percentage growth relative to the prior year. I also aggregated regional and global max values for each metric per year — those go into `comparisons.json` and are what drives the color scale normalization when you switch between regional and worldwide views.

Getting the JSON into the right nested shape (`region → energy type → metric → year → value`) took a sequence of `pivot_longer`, `group_by`, `nest`, and `deframe` calls. The nesting approach is based on [akrun's method on Stack Overflow](https://stackoverflow.com/a/56656268). The solar potential data went through a lighter path — extracted, renamed, and written out as `solar_potential.json` keyed by ISO Alpha-3 code.

The last step merged everything into a Natural Earth GeoJSON. Each country polygon carries its full energy history in the `properties` object. That one file is what the globe loads at runtime.

### Processed outputs (`data/processed/`)

| File | Description |
|---|---|
| `countries_updated.geojson` | Country polygons with all energy data embedded |
| `comparisons.json` | Regional and global max values per metric/year |
| `countries_story.json` | Narrative text per region, energy type, and year |
| `country_performance.json` | Per-country stats (standalone reference) |
| `solar_potential.json` | PV potential by ISO code |

---

## Exploratory data analysis (`scripts/eda.R`)

I ran EDA on solar and wind separately before touching the pipeline. Capacity across countries is heavily right-skewed — a handful of countries account for most of the global total, which makes aggregate charts misleading. Looking at year-over-year growth rates after gap-filling told a different story: smaller countries sometimes show faster percentage growth even with low absolute numbers.

I also pulled regional aggregates from the IRENA sheet and built faceted line plots to compare regions over time. That's what made it clear the globe needed a regional scaling option. On a worldwide color scale, Africa's growth is nearly invisible even in years where it was growing fast in relative terms.

---

## Visualization

The globe runs on [globe.gl](https://globe.gl/) v2.41.4 (Three.js and WebGL under the hood) with D3 v7 handling the color scales. Capacity and raw change use `scaleSequentialSqrt` with `interpolateYlOrRd` (yellow to red). Percentage growth uses `interpolatePuOr`, a diverging scale, since values can go negative.

The original version was an R Shiny app with a custom htmlwidget. I converted it to a standalone static site by pulling out the JavaScript and replacing all the Shiny websocket calls with plain DOM event listeners. That's what makes it deployable on Vercel without a server.

---

## Project structure

```
├── web/                         # Static site — what gets deployed
│   ├── index.html
│   ├── globe.js
│   ├── globe.css
│   ├── customtheming.css
│   └── data/
│
├── shiny/                       # Original R Shiny app
│   ├── app.R
│   └── data/
│
├── widget/                      # R htmlwidget source
│   ├── R/mywidget.R
│   └── inst/htmlwidgets/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── scripts/
│   ├── eda.R
│   └── preprocessing.Rmd
│
├── docs/
│   ├── about.qmd
│   ├── presentation.qmd
│   └── _quarto.yml
│
├── renewable-energy-globe.Rproj
└── vercel.json
```

---

## Setup

### Run the data pipeline

Open `scripts/preprocessing.Rmd` in RStudio and run all chunks. You need `readxl`, `janitor`, `tidyverse`, and `jsonlite`. Outputs write to `data/processed/`.

```r
install.packages(c("readxl", "janitor", "tidyverse", "jsonlite"))
```

If the project uses renv:

```r
renv::restore()
```

### Run the globe locally

The site loads JSON and GeoJSON with `fetch()`, so opening `index.html` directly as a `file://` URL will fail — browsers block local fetches over that protocol. Run a local server instead:

```bash
# Python
cd web
python -m http.server 8080
# open http://localhost:8080

# Node
npx serve web
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect the repo on the Vercel dashboard — it picks up `vercel.json` automatically and serves the `web/` folder.

### Run the original Shiny app

```r
shiny::runApp("shiny/app.R")
```

---

## Tech stack

| | |
|---|---|
| Data extraction & cleaning | R : `readxl`, `janitor` |
| Transformation & feature engineering | R :`tidyverse` (dplyr, tidyr) |
| JSON output | R : `jsonlite` |
| Exploratory analysis | R :`ggplot2`, `dplyr` |
| 3D globe | globe.gl v2.41.4 |
| Color scales | D3 v7 |
| Original app | R Shiny + htmlwidgets |
| Deployment | Vercel |
