library(shiny)
library(htmlwidgets)
library(devtools)
library(tidyverse)
library(janitor)
library(P2A1)
library(ggplot2)
library(plotly)
library(readxl)
library(shinyjs)


comparison_json <- jsonlite::read_json(
  "./data/comparisons.json"
)

countries_updated_json <- jsonlite::read_json(
  "./data/countries_updated.geojson"
)
countries_story_json <- jsonlite::read_json(
  "./data/countries_story.json"
)

#And this is the frontend
ui <- fluidPage( shinyjs::useShinyjs(),
  tags$head(
    tags$style(HTML(
      "
      html, body {
        margin: 0;
        padding: 0;
      }
      
      #sidebar-panel {
        position:fixed;
        top:0;
        left:0;
        width:250px
        max-width: 250px;
        z-index: 10;
        padding: 10px;
        background-color: white;
        height: 100%;
        border-right: 1px solid lightgray;
      }
      
      #main-panel {
        width: 100%;
        height: 100%;
        display:block;
        margin:0;
        padding:0;
      }
      
      #q1-panel {
        display:none;
        width:calc(100%-320px);
        height:100%;
        margin:0;
        margin-left:320px;
        padding:0;
      }
      "
    ))
  ),
  div(id="sidebar-panel",
      #Inputs here should be.... what? At least the years, and "all" could be an option.
      #Maybe a species selection?
      #A Play button (afterwards perhaps.)
      selectInput(
        inputId="question",
        label="Question",
        selected="2",
        choices = c(
          "1",
          "2"
        ),
        multiple=F
      ),
      div(
        id="q2-input-elements",
        class="q2",
        selectInput(
          inputId="story",
          label="Energy",
          selected="solar",
          multiple=F,
          choices= c("solar","wind")
        ),
        actionButton("refocus", "Re-focus on Region"),
        br(),
        br(),
        actionButton("prevRegion", "Previous Region"),
        actionButton("nextRegion", "Next Region"),
        br(),
        br(),
        actionButton("prevStep", "Previous Step"),
        actionButton("nextStep", "Next Step"),
        selectInput(
          inputId="highlight_property",
          label="Highlight Property",
          selected="Year's Highest Total Electricity (MW)",
          choices = c(
            "Year's Highest Total Electricity (MW)",
            "Growth Percentage W.R.T Last Year",
            "Net Change W.R.T. Last Year (MW)"
          ),
          multiple=F
        ),
        selectInput(
          inputId="scaling",
          label="Scaling",
          selected="regional",
          choices = c(
            "regional",
            "worldwide"
          ),
          multiple=F
        ),
        checkboxInput(
          inputId="showPotential",
          label="Show potential Areas of Growth for Photovoltaic Energy",
          value=F
        )
      )
    ),
    div(
      id="main-panel",
      class="q2",
      globeglOutput("globe")
    ),
    div(
      id="q1-panel",
      class="q1",
      titlePanel("Global Renewable Energy Capacity Analysis"),
      tabsetPanel(
        tabPanel("Installed Capacity Over Time", plotlyOutput("plot1")),
        tabPanel("Model Fit (Historical)", plotlyOutput("plot3")),
        tabPanel("Forecast to 2035", plotlyOutput("plot4")),
        tabPanel("Renewable Tech Breakdown",
                 fluidRow(
                   column(12, plotlyOutput("plot2")),
                   column(12, plotlyOutput("plot5"))
                 )
        )
      )
    )
)

#And let's get the backend as well
server <- function(input, output, session) {
  global_data <- read_excel("./data/irena_stats.xlsx", sheet = "Global") %>%
    clean_names() %>%
    rename(
      group = re_or_non_re,
      capacity_mw = sum_of_electricity_installed_capacity_mw
    )
  
  year_group_summary <- global_data %>%
    group_by(year, group) %>%
    summarise(total_capacity_mw = sum(capacity_mw, na.rm = TRUE), .groups = "drop") %>%
    filter(!is.na(year))
  
  # Plot 1: Installed Capacity Over Time
  output$plot1 <- renderPlotly({
    p1 <- ggplot(year_group_summary, 
                 aes(x = year, y = total_capacity_mw / 1000, color = group, group = group,
                     text = paste0("Year: ", year, 
                                   "<br>Capacity: ", round(total_capacity_mw / 1000, 2), " GW"))) +
      geom_line(size = 0.8) +
      labs(
        title = "Installed Capacity Over Time: Renewable vs Non-Renewable",
        x = "Year",
        y = "Installed Capacity (GW)",
        color = "Energy Type"
      ) +
      theme_minimal()
    ggplotly(p1, tooltip = "text")
  })
  
  # Plot 2: Renewable Technology Breakdown
  output$plot2 <- renderPlotly({
    p2 <- ggplot(global_data %>% filter(group == "Total Renewable" & !is.na(year)),
                 aes(x = year, y = capacity_mw / 1000, fill = group_technology,
                     text = paste0("Year: ", year,
                                   "<br>Technology: ", group_technology,
                                   "<br>Capacity: ", round(capacity_mw / 1000, 2), " GW"))) +
      geom_col(position = position_dodge2()) +
      labs(
        title = "Installed Capacity by Renewable Technology Over Time",
        x = "Year",
        y = "Installed Capacity (GW)",
        fill = "Technology"
      ) +
      theme_minimal()
    ggplotly(p2, tooltip = "text")
  })
  
  # Plot 3: Model Fit with 95% CI
  output$plot3 <- renderPlotly({
    model_actual <- year_group_summary %>%
      group_by(group) %>%
      do({
        model <- if (unique(.$group) == "Total Renewable") {
          lm(total_capacity_mw ~ poly(year, 2), data = .)
        } else {
          lm(total_capacity_mw ~ year, data = .)
        }
        preds <- predict(model, newdata = ., interval = "confidence")
        bind_cols(., as.data.frame(preds))
      }) %>%
      ungroup() %>%
      mutate(text = paste0("Year: ", year,
                           "<br>Type: ", group,
                           "<br>Fitted: ", round(fit / 1000, 2), " GW",
                           "<br>95% CI: [", round(lwr / 1000, 2), ", ", round(upr / 1000, 2), "]"))
    
    p3 <- ggplot(model_actual, aes(x = year)) +
      geom_point(aes(y = total_capacity_mw / 1000, color = group), size = 2) +
      geom_line(aes(y = fit / 1000, color = group)) +
      geom_ribbon(aes(ymin = lwr / 1000, ymax = upr / 1000, fill = group), alpha = 0.2, color = NA) +
      geom_point(aes(y = fit / 1000, color = group, text = text), shape = 21, size = 2, stroke = 0.3) +
      labs(
        title = "Installed Capacity with Model Fit (95% CI)",
        x = "Year",
        y = "Installed Capacity (GW)",
        color = "Energy Type",
        fill = "95% CI"
      ) +
      theme_minimal()
    ggplotly(p3, tooltip = "text")
  })
  
  # Plot 4: Forecast to 2035 with 95% CI
  output$plot4 <- renderPlotly({
    full_years <- tibble(year = seq(min(year_group_summary$year), 2035))
    model_full <- year_group_summary %>%
      group_by(group) %>%
      do({
        model <- if (unique(.$group) == "Total Renewable") {
          lm(total_capacity_mw ~ poly(year, 2), data = .)
        } else {
          lm(total_capacity_mw ~ year, data = .)
        }
        preds <- predict(model, newdata = full_years, interval = "confidence")
        bind_cols(full_years, as.data.frame(preds)) %>%
          mutate(group = unique(.$group))
      }) %>%
      ungroup() %>%
      mutate(text = paste0("Year: ", year,
                           "<br>Type: ", group,
                           "<br>Fitted: ", round(fit / 1000, 2), " GW",
                           "<br>95% CI: [", round(lwr / 1000, 2), ", ", round(upr / 1000, 2), "]"))
    
    max_actual_year <- max(year_group_summary$year)
    
    p4 <- ggplot() +
      geom_point(data = year_group_summary, aes(x = year, y = total_capacity_mw / 1000, color = group), size = 2) +
      geom_line(data = model_full, aes(x = year, y = fit / 1000, color = group)) +
      geom_ribbon(data = model_full, aes(x = year, ymin = lwr / 1000, ymax = upr / 1000, fill = group), alpha = 0.2) +
      geom_point(data = model_full %>% filter(year > max_actual_year),
                 aes(x = year, y = fit / 1000, color = group, text = text), shape = 21, size = 2, stroke = 0.3) +
      labs(
        title = "Forecast of Installed Capacity to 2035 with 95% CI",
        x = "Year",
        y = "Installed Capacity (GW)",
        color = "Energy Type",
        fill = "95% CI"
      ) +
      theme_minimal()
    ggplotly(p4, tooltip = "text")
  })
  
  output$plot5 <- renderPlotly({
    tech_growth <- global_data %>%
      filter(group == "Total Renewable", year %in% c(2000, 2024)) %>%
      group_by(group_technology, year) %>%
      summarise(capacity_mw = sum(capacity_mw, na.rm = TRUE), .groups = "drop") %>%
      pivot_wider(names_from = year, values_from = capacity_mw, names_prefix = "year_") %>%
      mutate(absolute_growth = year_2024 - year_2000)
    
    p5 <- ggplot(tech_growth, aes(x = reorder(group_technology, absolute_growth), y = absolute_growth / 1000,
                                  fill = group_technology,
                                  text = paste0("Technology: ", group_technology,
                                                "<br>Absolute Growth: ", round(absolute_growth / 1000, 2), " GW"))) +
      geom_col() +
      coord_flip() +
      labs(
        title = "Absolute Growth of Renewable Technologies (2000 to 2024)",
        x = "Technology",
        y = "Absolute Growth (GW)",
        fill = "Technology"
      ) +
      theme_minimal()
    
    ggplotly(p5, tooltip = "text")
  })
  
  output$globe <- renderGlobegl( #From https://www.htmlwidgets.org/develop_intro.html
    globegl(
      comparison_json = comparison_json,
      countries_updated_json = countries_updated_json,
      countries_story_json = countries_story_json
    )
  )
  observeEvent(input$question, {
    session$sendCustomMessage("questionChange", input$question)
  })
  observeEvent(input$story, {
    session$sendCustomMessage("storyChange", input$story)
  })
  observeEvent(input$refocus, {
    session$sendCustomMessage("refocus", message="refocus")
  })
  observeEvent(input$prevStep, {
    session$sendCustomMessage("yearStep", "prev")
  })
  observeEvent(input$nextStep, {
    session$sendCustomMessage("yearStep","next")
  })
  observeEvent(input$prevRegion, {
    session$sendCustomMessage("regionStep", "prev")
  })
  observeEvent(input$nextRegion, {
    session$sendCustomMessage("regionStep", "next")
  })
  observeEvent(input$highlight_property, {
    session$sendCustomMessage("hpChange", input$highlight_property)
  })
  observeEvent(input$scaling, {
    session$sendCustomMessage("scalingChange", input$scaling)
  })
  observeEvent(input$year, {
  })
  
  observeEvent(input$showPotential, {
    session$sendCustomMessage("togglePotential", input$showPotential)
  })
  
  observe({
    message("observe is triggered")
    selected_energy <- input$story
    
    if(selected_energy == "solar"){
      
      shinyjs::enable("showPotential")
      message("checkbox enabled")
    }
    else {
      shinyjs::disable("showPotential")
      updateCheckboxInput(session,"showPotential",value = FALSE)
      message("checkbox disabled")
    }
    
  }
  
  
  )
  
  
}

shinyApp(ui, server)
