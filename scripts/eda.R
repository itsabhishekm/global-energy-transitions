# Loading libraries
library(readxl)
library(dplyr)
library(tidyr)

# Load data
file_path <- "Insert you data path here" # Assign your data path to "file_path"
data <- read_excel(file_path, sheet = "Country")

#Filtering Solar energy
solar_data <- data %>%
  filter(`Group Technology` == "Solar energy") %>%
  select(Country, Year, `Electricity Installed Capacity (MW)`)

#Summarized installed capacity per Country Year
solar_summarized <- solar_data %>%
  group_by(Country, Year) %>%
  summarise(Total_Capacity_MW = sum(`Electricity Installed Capacity (MW)`, na.rm = TRUE), .groups = "drop")

#Full year range of all unique countries 
all_countries <- unique(solar_summarized$Country)
all_years <- 2000:max(solar_summarized$Year)


full_grid <- expand.grid(Country = all_countries, Year = all_years)

#Filling the missing years values with 0 capacity
solar_complete <- full_grid %>%
  left_join(solar_summarized, by = c("Country", "Year")) %>%
  mutate(Total_Capacity_MW = ifelse(is.na(Total_Capacity_MW), 0, Total_Capacity_MW))

#Sorting based on country and year
solar_complete <- solar_complete %>%
  arrange(Country, Year)

#Calculating absolute and percentage growth
solar_growth <- solar_complete %>%
  group_by(Country) %>%
  mutate(
    Absolute_Growth = Total_Capacity_MW - lag(Total_Capacity_MW, default = 0),
    Percentage_Growth = ifelse(lag(Total_Capacity_MW, default = 0) == 0, 0,
                               (Total_Capacity_MW - lag(Total_Capacity_MW)) / lag(Total_Capacity_MW) * 100)
  ) %>%
  ungroup()
print(solar_growth) 

#Top countries by percentage growth per year
solar_growth_by_year <- solar_growth %>%
  filter(!is.na(Percentage_Growth)) %>%
  group_by(Year) %>%
  slice_max(order_by = Percentage_Growth, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  arrange(Year)

print(solar_growth_by_year)


#Wind 

#Filtering Wind energy
wind_data <- data %>%
  filter(`Group Technology` == "Wind energy") %>%
  select(Country, Year, `Electricity Installed Capacity (MW)`)

#Summarized installed capacity per Country Year
wind_summarized <- wind_data %>%
  group_by(Country, Year) %>%
  summarise(Total_Capacity_MW = sum(`Electricity Installed Capacity (MW)`, na.rm = TRUE), .groups = "drop")

#Full year range of all unique countries 
all_countries_wind <- unique(wind_summarized$Country)
all_years_wind <- 2000:max(wind_summarized$Year)

full_grid_wind <- expand.grid(Country = all_countries_wind, Year = all_years_wind)

#Filling the missing years values with 0 capacity
wind_complete <- full_grid_wind %>%
  left_join(wind_summarized, by = c("Country", "Year")) %>%
  mutate(Total_Capacity_MW = ifelse(is.na(Total_Capacity_MW), 0, Total_Capacity_MW))

# Sorting based on country and year
wind_complete <- wind_complete %>%
  arrange(Country, Year)

# Calculating absolute and percentage growth
wind_growth <- wind_complete %>%
  group_by(Country) %>%
  mutate(
    Absolute_Growth = Total_Capacity_MW - lag(Total_Capacity_MW, default = 0),
    Percentage_Growth = ifelse(lag(Total_Capacity_MW, default = 0) == 0, 0,
                               (Total_Capacity_MW - lag(Total_Capacity_MW)) / lag(Total_Capacity_MW) * 100)
  ) %>%
  ungroup()

print(wind_growth)

# Top countries by percentage growth per year
wind_growth_by_year <- wind_growth %>%
  filter(!is.na(Percentage_Growth)) %>%
  group_by(Year) %>%
  slice_max(order_by = Percentage_Growth, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  arrange(Year)

print(wind_growth_by_year)


