HTMLWidgets.widget({

  name: 'mywidget',

  type: 'output',

  initialize: function(el, width, height) {
    console.log("initialize called");

    console.log("initialize finished");
    return {};
  },

  factory: function(el, width, height) {
    return {
      renderValue: async function(x) {
        let scripts = [
            "https://cdn.jsdelivr.net/npm/d3@7",
            "https://cdn.jsdelivr.net/npm/d3-scale@4/dist/d3-scale.min.js",
            "https://cdn.jsdelivr.net/npm/d3-scale-chromatic@3.1.0/dist/d3-scale-chromatic.min.js"
        ]
        function loadScript(src) {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(src);
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        function delay(timeMillis) {
          return new Promise(resolve => setTimeout(resolve, timeMillis));
        }
        await Promise.all(scripts.map(loadScript), delay(10000));
        console.log("Running renderValue")
        console.log(x)
        if(x.hasOwnProperty("comparison_json")) {
         window.maxLimits = x.comparison_json;
        } else {
          console.log("somehow did not find comparison_json")
          //window.scalingLimits = await getScaling();
        }
        if (x.hasOwnProperty("countries_updated_json")) {
          window.countries = x.countries_updated_json
        } else {
          console.log("somehow did not find countries_updated_json")
          //window.countries = await getGeojson();
        }
        if (x.hasOwnProperty("countries_story_json")) {
          window.countries_story = x.countries_story_json
        } else {
          console.log("could not find countries_story_json")
        }
        /* SECTION: SETUP SETTING VARIABLES THAT MAY BE MODIFIED ________________________________________ */
          window.currentQuestion = "2";
          window.currentStory = "solar"; // "solar" | "wind" | "bioenergy"
          //Region is probably the same as PointOfView
          window.indexToRegion = {
            0:"Europe",
            1:"Africa",
            2:"India and the Middle East",
            3:"Asia",
            4:"Oceania",
            5:"North America",
            6:"South America"
          };
          window.regionToIndex = {
            "Europe":0,
            "Africa":1,
            "India and the Middle East":2,
            "Asia":3,
            "Oceania":4,
            "North America":5,
            "South America":6
          };
          window.currentRegionPointer = 0;
          window.currentRegion = window.indexToRegion[window.currentRegionPointer];
          window.currentScaling = "Europe" // "Africa" | "Europe" | "Oceania" | "North America" | "South America" | "India and the Middle East"
          window.indexToYear = {
            0: "2000",
            1: "2010",
            2: "2012",
            3: "2014",
            4: "2016",
            5: "2017",
            6: "2018",
            7: "2019",
            8: "2020",
            9: "2021",
            10: "2022",
            11: "2023",
            12: "2024"
          }
          window.yearToIndex = {
            "2000":0,
            "2010":1,
            "2012":2,
            "2014":3,
            "2016":4,
            "2017":5,
            "2018":6,
            "2019":7,
            "2020":8,
            "2021":9,
            "2022":10,
            "2023":11,
            "2024":12
          }
          window.currentYearPointer = 0;
          window.currentYear = window.indexToYear[window.currentYearPointer];
          window.currentHighlightProperty = "year_highest_total_electricity" // year_highest_total_electricity | max_percentage_wrt_last_year
          window.showSolarPotential = false;
        /* END SECTION: SETUP SETTING VARIABLES THAT MAY BE MODIFIED _____________________________________ */

        /* SECTION: POINT OF VIEW___________________________________________________________________ */
        window.currentPointOfView = 1;
        window.currentPovTransitionTimeMillis = 4000;
        window.pointsOfView = {
            0: {
                id: 0,
                code: "europe",
                name: "Europe",
                coords: {
                    lat:52.757676,
                    lng:14.995865,
                    altitude: 1.2
                }
            },
            1: {
                id: 1,
                code: "africa",
                name: "Africa",
                coords: {
                    lat: 4.232806, lng: 18.59233, altitude: 1.5
                }
            },
            2: {
                id: 2,
                code: "india_and_middle_east",
                name: "India and the Middle East",
                coords: {
                    lat: 29.389893, lng: 67.495534, altitude: 1.1
                }
            },
            3: {
                id: 3,
                code: "asia",
                name: "asia",
                coords: {
                    lat:22.779459, lng:119.267005, altitude: 1.3
                }
            },
            4: {
                id: 4,
                code: "oceania",
                name: "Oceania",
                coords: {
                    lat:-20.8866, lng:146.2783, altitude:1.2
                }
            },
            5: {
                id: 5,
                code: "north_america",
                name: "North America",
                coords: {
                  lat:35.663283, lng:-84.374927, altitude:1.5
                }
            },
            6: {
                id: 6,
                code: "south_america",
                name: "South America",
                coords: {
                  lat: -19.606039, lng: -59.972762, altitude: 1.6
                }
            }
        }

        window.globeFocus = (pointOfInterest, transitionTime = null) => {
            console.log("new PointOfInterest", pointOfInterest)
            let currentPOVO = window.pointsOfView[window.currentPointOfView] //By default it will refocus if something goes wrong when this is called.
            if(window.pointsOfView.hasOwnProperty(pointOfInterest)) { //If we're moving to a new, valid position...
              currentPOVO = window.pointsOfView[pointOfInterest] //Then let's get those coordinates to move there
              currentPov = pointOfInterest //AND let's state that we're currently here, in case we want to re-focus in the future
            }
            window.globePTO.pointOfView(currentPOVO.coords, transitionTime ?? window.currentPovTransitionTimeMillis) //Now move there. it works for both re-focusing or for changing to a new POV.
            return currentPOVO
        }
        /* END SECTION POINT OF VIEW________________________________________________________________ */

        /* SECTION: FETCH DATA _____________________________________________________________________ */

        /*const getGeojson = async () => { //From Ridley (2018) https://stackoverflow.com/a/49482005
            //const file = await fetch("./countries.geojson")
            const file = await fetch("data/countries_updated.geojson")
            return await file.json();
        }
        const getScaling = async () => {
            const file2 = await fetch("data/comparisons.json");
            return await file2.json();
        }*/

        /* END SECTION: FETCH DATA _________________________________________________________________ */

        /* SECTION: GLOBE FUNCTIONS ________________________________________________________________ */

        window.currentHP_to_geoJsonHP = {
          "year_highest_total_electricity":"electricity_mw",
          "max_percentage_wrt_last_year":"net_percentage_wrt_last_year",
          "year_highest_raw_change":"raw_change"
        }
        window.currentHP_to_maxLimit = {
          "year_highest_total_electricity":"year_highest_total_electricity",
          "max_percentage_wrt_last_year":"max_percentage_wrt_last_year",
          "year_highest_raw_change":"year_highest_raw_change"
        }


        window.getChoroplethVal = (feat) => {
            //console.log(window.currentStory, window.currentHighlightProperty, window.currentYear)
            //console.log("Now to see your object:", feat.properties)

            let currProperty = window.currentHP_to_geoJsonHP[window.currentHighlightProperty]
            let currMaxLimit = window.currentHP_to_maxLimit[window.currentHighlightProperty]

            let color = (Object(feat.properties).hasOwnProperty(window.currentStory) &&
                    feat.properties[window.currentStory].hasOwnProperty(currProperty) &&
                    feat.properties[window.currentStory][currProperty].hasOwnProperty(window.currentYear)) ?
                      currProperty === "net_percentage_wrt_last_year" ?
                        Math.min(100, feat.properties[window.currentStory][currProperty][window.currentYear]) / 100
                      :
                        feat.properties[window.currentStory][currProperty][window.currentYear] / Math.max(
                          1,
                          window.maxLimits[window.currentScaling][window.currentStory][currMaxLimit][window.currentYear]
                        )
                : 0
            //console.log(color)
            return color
        };
        
        
        window.getPotentialChoroplethVal = (feat) => {
          
          // we will be applying dynamic scaling here, that is we will be comparing countries with their 
          // most recent production of electricity in solar and their solar potential.
          
          let potentialValue = 0;
          if(Object(feat.properties).hasOwnProperty("SOLAR_POT")) {
               potentialValue = feat.properties["SOLAR_POT"];
               return (potentialValue - 2.51) / (5.38 - 2.51); 
          }
          
          return 0;
          
         
          // These max and min values are derived from solar radiance dataset
            
            /*   // This would show potential as a multiple of current production
            if (Object(feat.properties).hasOwnProperty(window.currentStory) &&
                feat.properties[window.currentStory].hasOwnProperty("electricity_mw") &&
                feat.properties[window.currentStory]["electricity_mw"].hasOwnProperty(window.currentYear)) {
                
                let currentValue = feat.properties[window.currentStory]["electricity_mw"][window.currentYear];
                
                // If country has current solar production, show potential as a ratio
                if (currentValue > 0) {
                    // Cap the ratio at 5x for visualization purposes
                    return Math.min(5, potentialValue / currentValue) / 5;
                }
            }*/
        };
        
        window.updateYearRegionData = (changeProperty, newValue) => {
          if(changeProperty === "region") {
            console.log("Changing region on indicator")
            document.getElementById("currentRegionSpan").innerHTML = newValue
          } else if(changeProperty === "year") {
            console.log("Changing year on indicator")
            document.getElementById("currentYearSpan").innerHTML = newValue
          } else if(changeProperty === "hp") {
            console.log("Changing hp on indicator")
            document.getElementById("currentHPSpan").innerHTML = newValue
          } else if(changeProperty === "scaling") {
            console.log("Changing scaling on indicator")
            document.getElementById("currentScalingSpan").innerHTML = newValue
          } else if(changeProperty === "energy") {
            console.log("Changing energy on indicator")
            document.getElementById("currentEnergySpan").innerHTML = newValue
          }  
        }

        window.updateGlobeData = () => {
          //This might be enough actually, since we're re-calling the function, but the "window" attributes have changed!
          //console.log("Calling update to update the color data!")
          window.globePTO
            .polygonCapColor((feat) => {
              //console.log("re-evaluating colors!")
              if(window.showSolarPotential == true){
                return window.solarPotentialColorScale(window.getPotentialChoroplethVal(feat))
              }
              else{
              return window.colorScale(window.getChoroplethVal(feat))
              }
            })
            .polygonsData(window.countries.features.filter(d => d.properties.ISO_A2 !== 'AQ'))
          
          let storyContentDiv = document.getElementById("fpcontent");
          storyContentDiv.innerHTML = window.countries_story[window.currentRegion][window.currentStory][window.currentYear]
        }

        /* sECTION: LOADING GLOBE __________________________________________________________________ */
        //How to load a JavaScript library from ChatGPT
        if(!window.globePTO) {
          console.log("globe was not found. adding...")
          /* SECTION: ADDING GLOBE */

          let script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/npm/globe.gl@2.41.4/dist/globe.gl.min.js";
          document.head.appendChild(script);
          script.onload = function() {

            console.log("globe.gl loaded");
            window.colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd);
            window.solarPotentialColorScale = d3.scaleSequentialSqrt(d3.interpolatePuOr);
            // above is a different color scale to show solar potential
            window.globePTO = new Globe(el)
                .globeImageUrl(
                    "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg" //http://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg
                )
                .backgroundImageUrl(
                  "https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png"
                )
                .lineHoverPrecision(0)
                .polygonsData(window.countries.features.filter(d => d.properties.ISO_A2 !== 'AQ'))
                .polygonAltitude(0.06)
                .polygonCapColor((feat) => {
                  if(window.showSolarPotential && window.currentStory=="solar"){
                     return window.solarPotentialColorScale(window.getPotentialChoroplethVal(feat))
                  }
                  else {
                      return window.colorScale(window.getChoroplethVal(feat))
                  }
                }
                
                )
                .polygonSideColor(() => 'rgba(0, 100, 0, 0.15)')
                .polygonStrokeColor(() => '#111')
                .polygonLabel(({ properties: d }) => { //Here "properties" is being renamed to just "d"
                      //console.log(d)
                      
                      
                      if (!Object(d).hasOwnProperty(window.currentStory)) {
                          return "<b>N/A</b>";
                      }
                      
                      
                      let label = ` <b>${d.ADMIN} (${d.ISO_A3}):</b> <br/>
                                    Electricity (MW): <i>${d[window.currentStory]["electricity_mw"][window.currentYear]}</i> MW<br/>
                                    Yearly % Growth: <i>${d[window.currentStory]["net_percentage_wrt_last_year"][window.currentYear]}%</i><br/>
                                    Change w.r.t. last year: <i>${d[window.currentStory]["raw_change"][window.currentYear]} MW</i>`;
                      
                      if (window.showSolarPotential && window.currentStory === "solar" && d.hasOwnProperty("SOLAR_POT")) {
                          label += `<br/><hr/>
                                   <b>Solar Potential:</b> <i>${d.SOLAR_POT}</i> kWh/Kwp/day<br/>
                                   <span style="font-size: 0.8em; color: #7CFC00;">Higher values indicate greater solar energy potential</span>`;
                      }
                      
                      return label;
                  })
                  .onPolygonHover(hoverD => window.globePTO
                    .polygonAltitude(d => d === hoverD ? 0.12 : 0.06)
                    .polygonCapColor(d => {
                      if (d === hoverD) {
                        return 'steelblue';  // Highlighted country always appears blue
                      } else if (window.showSolarPotential && window.currentStory === "solar") {
                        return window.solarPotentialColorScale(window.getPotentialChoroplethVal(d));  // Solar potential mode
                      } else {
                        return window.colorScale(window.getChoroplethVal(d));  // Normal mode
                      }
                    })
                  )
                  .polygonsTransitionDuration(300);
                
                let storyContentDiv = document.getElementById("fpcontent");
                storyContentDiv.innerHTML = window.countries_story[window.currentRegion][window.currentStory][window.currentYear]
              console.log("globe initialized")
          };
          /* END SECTION: LOAD GLOBE _______________________________________________________________ */

          /* SECTION: Shiny websocket hooks ________________________________________________________ */
          Shiny.addCustomMessageHandler("questionChange", (newQuestion) => {
            window.currentQuestion = newQuestion;
            
            let q2InputElements = document.getElementById("q2-input-elements")
            let q2StoryDiv = document.getElementById("floatingpanel");
            let q2InformationDiv = document.getElementById("regionYearDiv");
            let q2Panel = document.getElementById("main-panel")
            let q1Panel = document.getElementById("q1-panel")
            
            if(newQuestion === "1") {
              console.log("Switching to Q1")
              q2InputElements.style.display = "none";
              q2Panel.style.display = "none";
              q2StoryDiv.style.display = "none";
              q2InformationDiv.style.display = "none";
              q1Panel.style.display = "block";
            } else if (newQuestion === "2") {
              console.log("Switching to Q2")
              q1Panel.style.display = "none";
              q2InputElements.style.display = "block";
              q2Panel.style.display = "block";
              q2StoryDiv.style.display = "flex";
              q2InformationDiv.style.display = "flex";
            }
          })
          Shiny.addCustomMessageHandler("storyChange", (newStory) => {
            window.currentStory = newStory;
            window.updateYearRegionData("story", newStory);
            window.updateGlobeData();
          })

          Shiny.addCustomMessageHandler("refocus", (message) => { //ChatGPT told me how to communicate HTMLWidget and Shiny
              window.globeFocus(window.currentRegionPointer, 2000);
          })
          Shiny.addCustomMessageHandler("yearStep", (direction) => { //Either "prev" or "next"
              console.log("yearStep called", direction, window.currentYear, window.currentYearPointer)
              if(direction === "prev") {
                if(window.currentYear === "2000") {
                  return;
                }
                else {
                  //Step 1 is changing the STATE VARIABLES.
                  window.currentYearPointer -= 1;
                  window.currentYear = window.indexToYear[window.currentYearPointer]
                  //Step 2 is actually changing the globe to reflect the state
                  window.updateGlobeData()
                  //Step 3 is notifying that the change went through
                  window.updateYearRegionData("year", window.currentYear)
                  Shiny.setInputValue("year", parseInt(window.currentYear))
                }
              } else {
                if(window.currentYear === "2024") {
                  return;
                }
                else {
                  window.currentYearPointer += 1;
                  window.currentYear = window.indexToYear[window.currentYearPointer]
                  window.updateGlobeData()
                  Shiny.setInputValue("year", parseInt(window.currentYear))
                  window.updateYearRegionData("year", window.currentYear)
                }
              }
          })
          Shiny.addCustomMessageHandler("regionStep", (direction) => {
            console.log("regionStep called", direction, window.currentRegion, window.currentRegionPointer)
              if(direction === "prev") {
                  console.log("Moving to previous region! Current:", window.currentRegionPointer, window.currentRegion)
                  window.currentRegionPointer -= 1;
                  window.currentRegion = window.indexToRegion[window.currentRegionPointer]
                  console.log("(prev) new currentRegion: ", window.currentRegionPointer, window.currentRegion)
                  window.currentScaling = window.currentRegion
                  window.updateYearRegionData("scaling", window.currentScaling)
                  console.log("(prev) new scaling: ", window.currentScaling)
                  window.updateGlobeData()
                  window.updateYearRegionData("region", window.currentRegion)
                  window.globeFocus(window.currentRegionPointer, 2000)
              } else { //NEXT
                if(window.currentRegionPointer === 6) {
                  window.globeFocus(window.currentRegionPointer, 2000)
                  return;
                }
                else {
                  console.log("Moving to next region! Current:", window.currentRegionPointer, window.currentRegion)
                  window.currentRegionPointer += 1;
                  window.currentRegion = window.indexToRegion[window.currentRegionPointer]
                  console.log("(next) new currentRegion: ", window.currentRegionPointer, window.currentRegion)
                  window.currentScaling = window.currentRegion
                  window.updateYearRegionData("scaling", window.currentScaling)
                  console.log("(next) new scaling: ", window.currentScaling)
                  window.updateGlobeData()
                  window.updateYearRegionData("region", window.currentRegion)
                  window.globeFocus(window.currentRegionPointer, 2000)
                }
              }
          })
          Shiny.addCustomMessageHandler("hpChange", (newChoice) => {
            if(newChoice === "Year's Highest Total Electricity (MW)") {
              window.updateYearRegionData("hp", newChoice)
              window.currentHighlightProperty = "year_highest_total_electricity"
            } else if (newChoice === "Growth Percentage W.R.T Last Year") {
              window.updateYearRegionData("hp", newChoice)
              window.currentHighlightProperty = "max_percentage_wrt_last_year"
            } else if (newChoice === "Net Change W.R.T. Last Year (MW)") {
              window.updateYearRegionData("hp", newChoice)
              window.currentHighlightProperty = "year_highest_raw_change"
            }
            window.updateGlobeData();
          })
          Shiny.addCustomMessageHandler("scalingChange", (newChoice) => {
            console.log("scalingChange called", newChoice, window.currentScaling)
            if(newChoice === "regional") {
              window.currentScaling = window.currentRegion;
              window.updateYearRegionData("scaling", window.currentRegion)
            } else { //"global"
              window.currentScaling = "Overall";
              window.updateYearRegionData("scaling", "Global")
            }
            
            window.updateGlobeData();
          })
          Shiny.addCustomMessageHandler("storyChange", (newChoice) => {
            window.currentStory = newChoice;
            window.updateGlobeData();
          })
          
          Shiny.addCustomMessageHandler("togglePotential",(newChoice) => {
            window.showSolarPotential = newChoice;
            window.updateGlobeData(); 
            
          })
          

          /* END SECTION: Shiny websocket hooks ________________________________________________________ */

          /* SECTION: STORY DIV ADDED ON FIRST TIME RUN ____________________________________________ */
          const regionYearDiv = document.createElement("div");
          regionYearDiv.id = "regionYearDiv";
          regionYearDiv.innerHTML = `
              <div>
                <span class="regionYearTitle">Energy:</span> <span class="regionYearValue" id="currentStorySpan">${window.currentStory}</span>
              </div>
              <div>
                  <span class="regionYearTitle">Region:</span> <span class="regionYearValue" id="currentRegionSpan">${window.currentRegion}</span>
              </div>
              <div>
                  <span class="regionYearTitle">Year:</span> <span class="regionYearValue" id="currentYearSpan">${window.currentYear}</span>
              </div>
              <div>
                <span class="regionYearTitle">HP:</span> <span class="regionYearValue" id="currentHPSpan">${
                window.currentHighlightProperty === "year_highest_total_electricity"
                ? "Year's Highest Total Electricity (MW)"
                : window.currentHighlightProperty
                }</span>
              </div>
              <div>
                <span class="regionYearTitle">Scaling:</span> <span class="regionYearValue" id="currentScalingSpan">${window.currentScaling}</span>
              </div>
          `
          document.body.appendChild(regionYearDiv)
          
          //From ChatGPT: I asked, "Can I add a <div> to the HTML in the initialize function, does it execute only once?"
          const storyDiv = document.createElement("div"); //From ChatGPT, it helped me add the element to the HTML document
          storyDiv.id = "floatingpanel";
          storyDiv.innerHTML = `
              <div id="showtoggle">
                  Story
              </div>
              <div id="fpcontent" class="closed">

              </div>
          `;
          document.body.appendChild(storyDiv)

          let showing = false
          let content = `Feel free to explore!`

          function onClick() {
              console.log("working on it, your majesty!")
              let fpcontent = document.getElementById("fpcontent")
              if(showing) {
                  //Hide
                  fpcontent.innerHTML = "";
                  fpcontent.classList.remove("open")
                  fpcontent.classList.add("closed")
              } else {
                  //Show
                  fpcontent.classList.remove("closed")
                  fpcontent.classList.add("open")
                  fpcontent.innerHTML = content
              }
              showing = !showing
              void fpcontent.offsetWidth; // Trigger reflow, thanks to ChatGPT
          }

          let showtoggle = document.getElementById("showtoggle")
          showtoggle.onclick = () => onClick();
          console.log("added module!")
          /* END SECTION: STORY DIV ADDED ON FIRST TIME RUN _______________________________________ */

          console.log("finished running");
        } else {
          console.log("globe window was found to be true")
        }
      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size
        //el.style.width = width + "px";
        //el.style.height = height + "px";
      }
    };
  }
});
