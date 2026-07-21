/**
 * globe.js — Renewable Energy Globe (standalone static version)
 * Converted from R Shiny + htmlwidgets to pure HTML/JS for Vercel deployment.
 * Original widget: inst/htmlwidgets/mywidget.js
 */

(async function initGlobe() {

  /* ── STATE VARIABLES ──────────────────────────────────────────── */
  window.currentStory   = "solar";
  window.indexToRegion  = { 0:"Europe", 1:"Africa", 2:"India and the Middle East", 3:"Asia", 4:"Oceania", 5:"North America", 6:"South America" };
  window.regionToIndex  = { "Europe":0, "Africa":1, "India and the Middle East":2, "Asia":3, "Oceania":4, "North America":5, "South America":6 };
  window.currentRegionPointer    = 0;
  window.currentRegion           = "Europe";
  window.currentScaling          = "Europe";
  window.indexToYear = { 0:"2000", 1:"2010", 2:"2012", 3:"2014", 4:"2016", 5:"2017", 6:"2018", 7:"2019", 8:"2020", 9:"2021", 10:"2022", 11:"2023", 12:"2024" };
  window.yearToIndex  = { "2000":0, "2010":1, "2012":2, "2014":3, "2016":4, "2017":5, "2018":6, "2019":7, "2020":8, "2021":9, "2022":10, "2023":11, "2024":12 };
  window.currentYearPointer      = 0;
  window.currentYear             = "2000";
  window.currentHighlightProperty = "year_highest_total_electricity";
  window.showSolarPotential      = false;
  window.currentPointOfView      = 0;
  window.currentPovTransitionTimeMillis = 4000;

  /* ── POINTS OF VIEW ───────────────────────────────────────────── */
  window.pointsOfView = {
    0: { id:0, name:"Europe",                    coords:{ lat:52.757676,  lng:14.995865,   altitude:1.2 } },
    1: { id:1, name:"Africa",                    coords:{ lat:4.232806,   lng:18.59233,    altitude:1.5 } },
    2: { id:2, name:"India and the Middle East", coords:{ lat:29.389893,  lng:67.495534,   altitude:1.1 } },
    3: { id:3, name:"Asia",                      coords:{ lat:22.779459,  lng:119.267005,  altitude:1.3 } },
    4: { id:4, name:"Oceania",                   coords:{ lat:-20.8866,   lng:146.2783,    altitude:1.2 } },
    5: { id:5, name:"North America",             coords:{ lat:35.663283,  lng:-84.374927,  altitude:1.5 } },
    6: { id:6, name:"South America",             coords:{ lat:-19.606039, lng:-59.972762,  altitude:1.6 } }
  };

  /* ── FETCH DATA ───────────────────────────────────────────────── */
  const [comparisons, countries, countriesStory] = await Promise.all([
    fetch('./data/comparisons.json').then(r => r.json()),
    fetch('./data/countries_updated.geojson').then(r => r.json()),
    fetch('./data/countries_story.json').then(r => r.json())
  ]);
  window.maxLimits        = comparisons;
  window.countries        = countries;
  window.countries_story  = countriesStory;

  /* ── PROPERTY MAPS ────────────────────────────────────────────── */
  window.currentHP_to_geoJsonHP = {
    "year_highest_total_electricity": "electricity_mw",
    "max_percentage_wrt_last_year":   "net_percentage_wrt_last_year",
    "year_highest_raw_change":        "raw_change"
  };
  window.currentHP_to_maxLimit = {
    "year_highest_total_electricity": "year_highest_total_electricity",
    "max_percentage_wrt_last_year":   "max_percentage_wrt_last_year",
    "year_highest_raw_change":        "year_highest_raw_change"
  };

  /* ── CHOROPLETH VALUE ─────────────────────────────────────────── */
  window.getChoroplethVal = (feat) => {
    const currProperty = window.currentHP_to_geoJsonHP[window.currentHighlightProperty];
    const currMaxLimit = window.currentHP_to_maxLimit[window.currentHighlightProperty];
    const props = feat.properties;
    if (
      Object(props).hasOwnProperty(window.currentStory) &&
      props[window.currentStory].hasOwnProperty(currProperty) &&
      props[window.currentStory][currProperty].hasOwnProperty(window.currentYear)
    ) {
      if (currProperty === "net_percentage_wrt_last_year") {
        return Math.min(100, props[window.currentStory][currProperty][window.currentYear]) / 100;
      }
      const maxVal = window.maxLimits[window.currentScaling]?.[window.currentStory]?.[currMaxLimit]?.[window.currentYear] ?? 1;
      return props[window.currentStory][currProperty][window.currentYear] / Math.max(1, maxVal);
    }
    return 0;
  };

  window.getPotentialChoroplethVal = (feat) => {
    if (Object(feat.properties).hasOwnProperty("SOLAR_POT")) {
      return (feat.properties["SOLAR_POT"] - 2.51) / (5.38 - 2.51);
    }
    return 0;
  };

  /* ── UI STATUS PANEL UPDATE ───────────────────────────────────── */
  window.updateYearRegionData = (changeProperty, newValue) => {
    const idMap = {
      energy:  "currentEnergySpan",
      region:  "currentRegionSpan",
      year:    "currentYearSpan",
      hp:      "currentHPSpan",
      scaling: "currentScalingSpan"
    };
    const el = document.getElementById(idMap[changeProperty]);
    if (el) el.innerHTML = newValue;
  };

  /* ── GLOBE FOCUS ──────────────────────────────────────────────── */
  window.globeFocus = (pointOfInterest, transitionTime = null) => {
    let pov = window.pointsOfView[window.currentPointOfView];
    if (window.pointsOfView.hasOwnProperty(pointOfInterest)) {
      pov = window.pointsOfView[pointOfInterest];
      window.currentPointOfView = pointOfInterest;
    }
    window.globePTO.pointOfView(pov.coords, transitionTime ?? window.currentPovTransitionTimeMillis);
  };

  /* ── UPDATE GLOBE DATA ────────────────────────────────────────── */
  window.updateGlobeData = () => {
    window.globePTO
      .polygonCapColor((feat) => {
        if (window.showSolarPotential) {
          return window.solarPotentialColorScale(window.getPotentialChoroplethVal(feat));
        }
        return window.colorScale(window.getChoroplethVal(feat));
      })
      .polygonsData(window.countries.features.filter(d => d.properties.ISO_A2 !== 'AQ'));

    const storyContentDiv = document.getElementById("fpcontent");
    if (storyContentDiv) {
      storyContentDiv.innerHTML =
        window.countries_story[window.currentRegion]?.[window.currentStory]?.[window.currentYear] ?? "";
    }
  };

  /* ── INITIALISE GLOBE ─────────────────────────────────────────── */
  const el = document.getElementById("globe-container");

  window.colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd);
  window.solarPotentialColorScale = d3.scaleSequentialSqrt(d3.interpolatePuOr);

  window.globePTO = new Globe(el)
    .globeImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg")
    .backgroundImageUrl("https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png")
    .lineHoverPrecision(0)
    .polygonsData(window.countries.features.filter(d => d.properties.ISO_A2 !== 'AQ'))
    .polygonAltitude(0.06)
    .polygonCapColor((feat) => {
      if (window.showSolarPotential && window.currentStory === "solar") {
        return window.solarPotentialColorScale(window.getPotentialChoroplethVal(feat));
      }
      return window.colorScale(window.getChoroplethVal(feat));
    })
    .polygonSideColor(() => 'rgba(0, 100, 0, 0.15)')
    .polygonStrokeColor(() => '#111')
    .polygonLabel(({ properties: d }) => {
      if (!Object(d).hasOwnProperty(window.currentStory)) return "<b>N/A</b>";
      let label = `
        <b>${d.ADMIN} (${d.ISO_A3}):</b><br/>
        Electricity (MW): <i>${d[window.currentStory]["electricity_mw"]?.[window.currentYear] ?? "N/A"}</i> MW<br/>
        Yearly % Growth: <i>${d[window.currentStory]["net_percentage_wrt_last_year"]?.[window.currentYear] ?? "N/A"}%</i><br/>
        Change w.r.t. last year: <i>${d[window.currentStory]["raw_change"]?.[window.currentYear] ?? "N/A"} MW</i>
      `;
      if (window.showSolarPotential && window.currentStory === "solar" && d.hasOwnProperty("SOLAR_POT")) {
        label += `<br/><hr/>
          <b>Solar Potential:</b> <i>${d.SOLAR_POT}</i> kWh/Kwp/day<br/>
          <span style="font-size:0.8em;color:#7CFC00;">Higher = greater solar energy potential</span>`;
      }
      return label;
    })
    .onPolygonHover(hoverD => window.globePTO
      .polygonAltitude(d => d === hoverD ? 0.12 : 0.06)
      .polygonCapColor(d => {
        if (d === hoverD) return 'steelblue';
        if (window.showSolarPotential && window.currentStory === "solar") {
          return window.solarPotentialColorScale(window.getPotentialChoroplethVal(d));
        }
        return window.colorScale(window.getChoroplethVal(d));
      })
    )
    .polygonsTransitionDuration(300);

  // Start focused on Europe
  window.globeFocus(0);

  /* ── FLOATING PANELS ──────────────────────────────────────────── */
  // Status bar (bottom-right)
  const regionYearDiv = document.createElement("div");
  regionYearDiv.id = "regionYearDiv";
  regionYearDiv.innerHTML = `
    <div><span class="regionYearTitle">Energy:</span><span class="regionYearValue" id="currentEnergySpan">${window.currentStory}</span></div>
    <div><span class="regionYearTitle">Region:</span><span class="regionYearValue" id="currentRegionSpan">${window.currentRegion}</span></div>
    <div><span class="regionYearTitle">Year:</span><span class="regionYearValue" id="currentYearSpan">${window.currentYear}</span></div>
    <div><span class="regionYearTitle">HP:</span><span class="regionYearValue" id="currentHPSpan">Year's Highest Total Electricity (MW)</span></div>
    <div><span class="regionYearTitle">Scaling:</span><span class="regionYearValue" id="currentScalingSpan">${window.currentScaling}</span></div>
  `;
  document.body.appendChild(regionYearDiv);

  // Story panel (right edge, slide-in)
  const storyDiv = document.createElement("div");
  storyDiv.id = "floatingpanel";
  storyDiv.innerHTML = `
    <div id="showtoggle">Story</div>
    <div id="fpcontent" class="closed"></div>
  `;
  document.body.appendChild(storyDiv);

  let storyShowing = false;
  document.getElementById("showtoggle").onclick = () => {
    const fpcontent = document.getElementById("fpcontent");
    if (storyShowing) {
      fpcontent.innerHTML = "";
      fpcontent.classList.remove("open");
      fpcontent.classList.add("closed");
    } else {
      fpcontent.classList.remove("closed");
      fpcontent.classList.add("open");
      fpcontent.innerHTML =
        window.countries_story[window.currentRegion]?.[window.currentStory]?.[window.currentYear] ?? "";
    }
    storyShowing = !storyShowing;
    void fpcontent.offsetWidth; // trigger reflow
  };

  /* ── EVENT LISTENERS ──────────────────────────────────────────── */

  // Energy / Story selector
  document.getElementById("story").addEventListener("change", (e) => {
    const newStory = e.target.value;
    window.currentStory = newStory;
    window.updateYearRegionData("energy", newStory);
    // Solar potential only available for solar
    const cb = document.getElementById("showPotential");
    if (newStory === "solar") {
      cb.disabled = false;
    } else {
      cb.disabled = true;
      cb.checked = false;
      window.showSolarPotential = false;
    }
    window.updateGlobeData();
  });

  // Re-focus on current region
  document.getElementById("refocus").addEventListener("click", () => {
    window.globeFocus(window.currentRegionPointer, 2000);
  });

  // Year — previous
  document.getElementById("prevStep").addEventListener("click", () => {
    if (window.currentYear === "2000") return;
    window.currentYearPointer -= 1;
    window.currentYear = window.indexToYear[window.currentYearPointer];
    window.updateGlobeData();
    window.updateYearRegionData("year", window.currentYear);
  });

  // Year — next
  document.getElementById("nextStep").addEventListener("click", () => {
    if (window.currentYear === "2024") return;
    window.currentYearPointer += 1;
    window.currentYear = window.indexToYear[window.currentYearPointer];
    window.updateGlobeData();
    window.updateYearRegionData("year", window.currentYear);
  });

  // Region — previous
  document.getElementById("prevRegion").addEventListener("click", () => {
    if (window.currentRegionPointer === 0) return;
    window.currentRegionPointer -= 1;
    window.currentRegion = window.indexToRegion[window.currentRegionPointer];
    window.currentScaling = window.currentRegion;
    window.updateYearRegionData("scaling", window.currentScaling);
    window.updateGlobeData();
    window.updateYearRegionData("region", window.currentRegion);
    window.globeFocus(window.currentRegionPointer, 2000);
  });

  // Region — next
  document.getElementById("nextRegion").addEventListener("click", () => {
    if (window.currentRegionPointer === 6) {
      window.globeFocus(window.currentRegionPointer, 2000);
      return;
    }
    window.currentRegionPointer += 1;
    window.currentRegion = window.indexToRegion[window.currentRegionPointer];
    window.currentScaling = window.currentRegion;
    window.updateYearRegionData("scaling", window.currentScaling);
    window.updateGlobeData();
    window.updateYearRegionData("region", window.currentRegion);
    window.globeFocus(window.currentRegionPointer, 2000);
  });

  // Highlight property
  document.getElementById("highlight_property").addEventListener("change", (e) => {
    const newChoice = e.target.value;
    window.updateYearRegionData("hp", newChoice);
    if      (newChoice === "Year's Highest Total Electricity (MW)") window.currentHighlightProperty = "year_highest_total_electricity";
    else if (newChoice === "Growth Percentage W.R.T Last Year")     window.currentHighlightProperty = "max_percentage_wrt_last_year";
    else if (newChoice === "Net Change W.R.T. Last Year (MW)")      window.currentHighlightProperty = "year_highest_raw_change";
    window.updateGlobeData();
  });

  // Scaling
  document.getElementById("scaling").addEventListener("change", (e) => {
    if (e.target.value === "regional") {
      window.currentScaling = window.currentRegion;
      window.updateYearRegionData("scaling", window.currentRegion);
    } else {
      window.currentScaling = "Overall";
      window.updateYearRegionData("scaling", "Global");
    }
    window.updateGlobeData();
  });

  // Solar potential overlay
  document.getElementById("showPotential").addEventListener("change", (e) => {
    window.showSolarPotential = e.target.checked;
    window.updateGlobeData();
  });

})();
