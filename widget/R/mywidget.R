#From https://www.htmlwidgets.org/develop_intro.html
#' @import htmlwidgets
#' @import jsonlite
#' @export
globegl <- function(
    comparison_json,
    countries_updated_json,
    countries_story_json,
    width = NULL, height = NULL
) {

  x <- list(
    comparison_json = comparison_json,
    countries_updated_json = countries_updated_json,
    countries_story_json = countries_story_json
  )
  
  htmlwidgets::createWidget("mywidget", x, width = width, height = height)
}

#SHINY ADAPTATIONS---
#' @export
globeglOutput <- function(outputId, width = "100%", height = "400px") {
  shinyWidgetOutput(outputId, "mywidget", width, height, package = "P2A1")
}
#' @export
renderGlobegl <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  shinyRenderWidget(expr, globeglOutput, env, quoted = TRUE)
}
