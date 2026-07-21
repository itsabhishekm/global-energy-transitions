# Global Renewable Energy Transitions

An end-to-end data engineering and visualization project that tracks the growth of **solar** and **wind** energy capacity across every country from **2000–2024**.

The project transforms raw renewable energy datasets into a processed geospatial data model powering an interactive **3D globe**, where users can explore renewable energy adoption over time, compare regions, and analyze growth trends through multiple metrics.

---

## Overview

This project combines data engineering, exploratory data analysis, geospatial processing, and interactive visualization into a single analytics pipeline.

Users can:

* Explore renewable energy adoption country-by-country
* Animate changes from 2000 to 2024
* Compare global and regional renewable growth
* Switch between solar and wind datasets
* View countries using multiple analytical metrics
* Compare installed capacity with solar resource potential

The visualization is built with **globe.gl**, **Three.js**, **D3.js**, and a preprocessing pipeline written entirely in **R**.

---

# Features

### Renewable Energy Metrics

Each country can be visualized using one of three analytical measures:

* **Installed Capacity (MW)**: Total solar or wind capacity for a selected year
* **Year-over-Year Growth (%)**: Percentage growth relative to the previous year
* **Net Capacity Change (MW)**: Absolute increase or decrease from the previous year

---

### Dynamic Regional Scaling

One of the largest challenges during development was the extreme imbalance between countries.

Large producers such as China and the United States dominate global capacity, making smaller but rapidly growing countries nearly invisible.

To solve this, the preprocessing pipeline computes:

* Regional maximum values
* Global maximum values
* Year-specific normalization

When users switch between worldwide and regional views, the color scale automatically recalibrates, allowing meaningful comparison regardless of region.

---

### Solar Potential Overlay

The globe also includes a **SolarGIS PV Potential** overlay.

This allows users to compare:

* Available solar resources
* Installed solar infrastructure

making it easy to identify countries with high renewable potential but relatively low deployment.

---

# Data Sources

The project combines multiple public datasets.

| Dataset                             | Purpose                                              |
| ----------------------------------- | ---------------------------------------------------- |
| IRENA Renewable Capacity Statistics | Historical renewable capacity by country (2000–2024) |
| SolarGIS PV Potential Rankings      | Country-level photovoltaic potential                 |
| Latitude & Longitude Dataset        | Country centroids                                    |
| Country–Region Mapping              | Custom ISO Alpha-3 regional mapping                  |

Raw datasets remain unchanged inside:

```
data/raw/
```

---

# Data Engineering Pipeline

The preprocessing workflow transforms raw Excel files into optimized JSON and GeoJSON files used directly by the visualization.

## 1. Data Extraction

* Import multi-sheet Excel files using `readxl`
* Standardize schemas with `janitor`
* Load renewable capacity and regional summary tables

---

## 2. Data Cleaning

IRENA only reports years where renewable capacity exists.

Missing country-year combinations do **not** appear in the source data.

To create a complete analytical dataset:

* Generate every Country × Year × Technology combination
* Join reported observations
* Replace missing values with zero capacity

This complete panel enables accurate lag calculations and prevents incorrect growth metrics.

---

## 3. Feature Engineering

For every country, technology, and year, the pipeline calculates:

* Installed Capacity
* Net Capacity Change
* Year-over-Year Growth (%)

Additional regional and global summary statistics are generated for visualization normalization.

---

## 4. JSON Generation

Processed datasets are transformed into nested JSON structures optimized for client-side rendering.

The pipeline exports:

* Country energy histories
* Regional comparison statistics
* Narrative content
* Solar potential data
* Performance summaries

---

## 5. GeoJSON Construction

The final step enriches Natural Earth polygons by embedding each country's historical renewable data directly into the GeoJSON properties.

The web application only needs to load this processed file at runtime.

---

# Exploratory Data Analysis

Before building the visualization, exploratory analysis was performed on both solar and wind datasets.

Key findings included:

* Renewable capacity is highly right-skewed.
* A small number of countries dominate global production.
* Smaller countries often exhibit significantly higher percentage growth.
* Regional scaling is essential for meaningful visualization.

These insights directly influenced both the preprocessing pipeline and visualization design.

---

# Visualization

The interactive globe is built using:

* **globe.gl**
* **Three.js**
* **D3.js**

Color scales are optimized for each metric:

* Square-root sequential scales for installed capacity and MW change
* Diverging scales for growth percentage

The application originally began as an **R Shiny** application before being refactored into a fully static JavaScript application suitable for deployment on **Vercel**.

---

# Project Structure

```
├── web/
│   ├── index.html
│   ├── globe.js
│   ├── globe.css
│   └── data/
│
├── shiny/
│   ├── app.R
│   └── data/
│
├── widget/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── scripts/
│   ├── preprocessing.Rmd
│   └── eda.R
│
├── docs/
│
├── renewable-energy-globe.Rproj
└── vercel.json
```

---

# Processed Outputs

| File                        | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `countries_updated.geojson` | Country polygons with embedded renewable history |
| `comparisons.json`          | Regional and global normalization values         |
| `countries_story.json`      | Narrative descriptions by region and year        |
| `country_performance.json`  | Country-level statistics                         |
| `solar_potential.json`      | SolarGIS PV potential data                       |

---

# Running the Project

## Install Dependencies

```r
install.packages(c(
  "readxl",
  "janitor",
  "tidyverse",
  "jsonlite"
))
```

or

```r
renv::restore()
```

---

## Generate Processed Data

Open:

```
scripts/preprocessing.Rmd
```

Run all chunks to regenerate the processed datasets.

---

## Run Locally

```bash
cd web
python -m http.server 8080
```

or

```bash
npx serve web
```

---

## Run the Original Shiny Version

```r
shiny::runApp("shiny/app.R")
```

---

## Deploy

Deploy directly to **Vercel**:

```bash
vercel
```

or connect the repository through the Vercel dashboard.

---

# Technology Stack

| Category             | Technologies              |
| -------------------- | ------------------------- |
| Language             | R, JavaScript             |
| Data Processing      | tidyverse, dplyr, tidyr   |
| Data Cleaning        | readxl, janitor           |
| JSON Generation      | jsonlite                  |
| Exploratory Analysis | ggplot2                   |
| Geospatial Data      | GeoJSON, Natural Earth    |
| Visualization        | globe.gl, Three.js, D3.js |
| Original Frontend    | R Shiny, htmlwidgets      |
| Deployment           | Vercel                    |

---

# Key Highlights

* End-to-end ETL pipeline from raw Excel files to optimized GeoJSON
* Automated feature engineering for lag-based time series analysis
* Dynamic regional normalization for meaningful visual comparisons
* Geospatial data enrichment for client-side rendering
* Interactive WebGL visualization using globe.gl
* Static deployment architecture with no backend requirements
