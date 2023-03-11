import { Ref } from "vue"
import * as vue from "vue"

interface TutorialState {
    tutorial_mode: Ref<boolean>,
    tutorial_step: Ref<number>
}
export function prepareComponentsForTutorial({tutorial_mode, tutorial_step}: TutorialState) {
    if(tutorial_mode.value) {
        document.addEventListener("keydown", (event) => {
            if(tutorial_mode.value) {
            if(event.keyCode === 39)
                tutorial_step.value += 1
            // if(event.keyCode === 37)
                // tutorial_step.value -= 1
            }
        })
        const left_section = document.querySelector(".p-splitter-panel.expanded-section") as HTMLElement
        const right_section = document.querySelector(".p-splitter-panel.sidebar") as HTMLElement
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        left_section.style["flex-basis"] = "0"
        right_section.style["flex-basis"] = "100%"
        tutorial_tooltip.style.position = "absolute"
        tutorial_tooltip.style.width = "fit-content"
        tutorial_tooltip.style.left = "50%"
        tutorial_tooltip.style.top = "18%"
        tutorial_tooltip.style["transition"] = "opacity 1s, width 1s, height 1s, left 1s, top 1s, right 1s"
        const compare_toggler = document.querySelector(".compare_toggle") as HTMLElement
        compare_toggler.style["opacity"] = "0"
        const search_bar_container = document.querySelector(".search-bar") as HTMLElement
        search_bar_container.style["opacity"] = "0"
        compare_toggler.style["opacity"] = "0"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "84%"
        skip_button.style.top = "77%"
        skip_button.style["transition"] = "opacity 1s, width 1s, height 1s, left 1s, top 1s, right 1s"
    }
}

export function updateOverviewGrid() {
  vue.nextTick(() => {
    const grid_container = document.querySelector(".overview-grid-container") as HTMLElement
    grid_container.style["max-height"] = "44%"
    grid_container.style['grid-template-columns'] = "repeat(1, 0.5fr)"
    grid_container.style["transition"] = "height 0.5s"
    const first_scatter = document.querySelector("#scatter-0") as HTMLElement
    first_scatter.style['cursor'] = "unset"

    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style["opacity"] = "1"
    const skip_button = document.querySelector(".skip-button") as HTMLElement
    skip_button.style["opacity"] = "1"
    const overview_toggler = document.querySelector(".overview-toggler") as HTMLElement
    overview_toggler.style["opacity"] = "0"
    const segment_toggler = document.querySelector(".segment-toggler-container") as HTMLElement
    segment_toggler.style["opacity"] = "0"
    const segment_legend = document.querySelector(".legend-container") as HTMLElement
    segment_legend.style["opacity"] = "0"
    const utilities_container = document.querySelector(".utilities-container") as HTMLElement
    utilities_container.style["opacity"] = "0"
  })
}

export function handleNextStep({tutorial_mode, tutorial_step}: TutorialState) {
    const new_value = tutorial_step.value
    // introduce scatterplot
    if(new_value === 0) {
        const grid_container = document.querySelector(".overview-grid-container") as HTMLElement
        grid_container.style["max-height"] = "44%"
    }

    // introduce outlet scatter grid
    if(new_value === 1) {
        const grid_container = document.querySelector(".overview-grid-container") as HTMLElement
        grid_container.style['grid-template-columns'] = "repeat(3, 1fr)"
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.right = "0px"
        tutorial_tooltip.style.left = "auto"
        tutorial_tooltip.style.top = "20px"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "98%"
        skip_button.style.top = "59%"

    }
    // introduce temporal 
    if(new_value === 2) {
        const utilities_container = document.querySelector(".utilities-container") as HTMLElement
        utilities_container.style["transition"] = "opacity 1s"
        utilities_container.style["opacity"] = "1"
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.right = "auto"
        tutorial_tooltip.style.left = "20%"
        tutorial_tooltip.style.top = "80%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "56.5%"
        skip_button.style.top = "93%"
    }
    if(new_value === 3) {
        const overview_toggler = document.querySelector(".overview-toggler") as HTMLElement
        overview_toggler.style["transition"] = "opacity 1s"
        overview_toggler.style["opacity"] = "1"
        overview_toggler.style.left = "-42%"
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "60%"
        tutorial_tooltip.style.top = "1%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "89%"
        skip_button.style.top = "3%"
    }
    if(new_value === 4) {
        const left_section = document.querySelector(".p-splitter-panel.expanded-section") as HTMLElement
        const right_section = document.querySelector(".p-splitter-panel.sidebar") as HTMLElement
        right_section.style["transition"] = "flex-basis 1s"
        left_section.style.setProperty("flex-basis", "calc(55% - 4px)")
        right_section.style.setProperty("flex-basis", "calc(45% - 4px)")
        const grid_container = document.querySelector(".overview-grid-container") as HTMLElement
        if(grid_container) {
        grid_container.style["max-height"] = "50%"
        }
        const tCoord_container = document.querySelector(".overview-temporal-coord") as HTMLElement
        if(tCoord_container) {
        tCoord_container.style["width"] = "500px"
        tCoord_container.style["height"] = "300px"
        const temporal_selector = document.querySelector(".temporal-selector-container") as HTMLElement
        temporal_selector.style["margin-top"] = "28px"
        const selector_text = document.querySelector(".selector-option") as HTMLElement
        selector_text.style["font-size"] = "x-small"
        }
        const overview_toggler = document.querySelector(".overview-toggler") as HTMLElement
        overview_toggler.style.left = "unset"
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "9%"
        tutorial_tooltip.style.top = "7%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "48.5%"
        skip_button.style.top = "18%"
    }
    if(new_value === 5) {
        const segment_toggler = document.querySelector(".segment-toggler-container") as HTMLElement
        segment_toggler.style["transition"] = "opacity 1s"
        segment_toggler.style["opacity"] = "1"
        const segment_legend = document.querySelector(".legend-container") as HTMLElement
        segment_legend.style["transition"] = "opacity 1s"
        segment_legend.style["opacity"] = "1"
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "66%"
        tutorial_tooltip.style.top = "70%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "98%"
        skip_button.style.top = "93%"
    }
    if(new_value === 6) {
        const compare_toggler = document.querySelector(".compare_toggle") as HTMLElement
        compare_toggler.style["transition"] = "opacity 1s"
        compare_toggler.style["opacity"] = "1"
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "55%"
        tutorial_tooltip.style.top = "-3%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "79.5%"
        skip_button.style.top = "-1%"
    }
    if(new_value === 7) {
        // allow node click
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "55%"
        tutorial_tooltip.style.top = "-3%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "90.5%"
        skip_button.style.top = "2%"
    }
    if(new_value === 8) {
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.opacity = "0"
    }
    if(new_value === 9) {
        // show finish notes
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style["opacity"] = "0"
        tutorial_mode.value = false
    }

}

export function handleSkipTutorial() {
    const left_section = document.querySelector(".p-splitter-panel.expanded-section") as HTMLElement
    const right_section = document.querySelector(".p-splitter-panel.sidebar") as HTMLElement
    left_section.style.setProperty("flex-basis", "calc(55% - 4px)")
    right_section.style.setProperty("flex-basis", "calc(45% - 4px)")
    const grid_container = document.querySelector(".overview-grid-container") as HTMLElement
    grid_container.style["max-height"] = "50%"
    grid_container.style['grid-template-columns'] = "repeat(3, 1fr)"

    const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
    tutorial_tooltip.style["opacity"] = "0"
    const overview_toggler = document.querySelector(".overview-toggler") as HTMLElement
    overview_toggler.style["opacity"] = "1"
    overview_toggler.style.left = "unset"
    const segment_toggler = document.querySelector(".segment-toggler-container") as HTMLElement
    segment_toggler.style["opacity"] = "1"
    const segment_legend = document.querySelector(".legend-container") as HTMLElement
    segment_legend.style["opacity"] = "1"
    const utilities_container = document.querySelector(".utilities-container") as HTMLElement
    utilities_container.style["opacity"] = "1"
    const compare_toggler = document.querySelector(".compare_toggle") as HTMLElement
    compare_toggler.style["opacity"] = "1"
    const search_bar_container = document.querySelector(".search-bar") as HTMLElement
    search_bar_container.style["opacity"] = "1"
}

export function handleToggleTemporal(
    tutorial_intro: Ref<string[]>, 
    overview_grid_mode: Ref<boolean>,
    {tutorial_mode, tutorial_step}: TutorialState ) {
  if(tutorial_mode.value && tutorial_step.value === 3) {
    tutorial_intro.value[3] = 
    "The TemporalView shows monthly sentiment changes on each outlet with two <br>" +
    "parallel line charts. <br>" +
    "x-axis encodes month, y-axis encodes " +
    "<span style='background-color:rgb(29, 127, 119);filter:brightness(140%)'>&nbsppositive </span>" + 
    ", " + 
    "<span style='background-color:rgb(165, 106, 29);filter:brightness(140%)'>&nbspnegative </span>" + 
    " or " +
    "<span style='background-color:grey;filter:brightness(140%)'>&nbspneutral </span>" + 
    " sentiment. <br>" +
    "You can select any outlet to highlight it in the temporal view. <br> " +
    "<br>" +
    "<img src='src/assets/tutorial/temporal.png' width='498' height='221'> <br>"
    vue.nextTick(() => {
      if(!overview_grid_mode.value) {
        const tCoord_container = document.querySelector(".overview-temporal-coord") as HTMLElement
        tCoord_container.style["width"] = "750px"
        tCoord_container.style["height"] = "450px"
        const temporal_selector = document.querySelector(".temporal-selector-container") as HTMLElement
        temporal_selector.style["margin-top"] = "45px"
        const selector_text = document.querySelector(".selector-option") as HTMLElement
        selector_text.style["font-size"] = "x-large"
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "64%"
        tutorial_tooltip.style.top = "12%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "98%"
        skip_button.style.top = "61%"
      }
    })
  } else {
      vue.nextTick(() => {
        if(!overview_grid_mode.value) {
          const tCoord_container = document.querySelector(".overview-temporal-coord") as HTMLElement
          tCoord_container.style["width"] = "500px"
          tCoord_container.style["height"] = "300px"
          const temporal_selector = document.querySelector(".temporal-selector-container") as HTMLElement
          temporal_selector.style["margin-top"] = "28px"
          const selector_text = document.querySelector(".selector-option") as HTMLElement
          selector_text.style["font-size"] = "x-small"
        }
      })
  }
}

export function handleToggleCompareMode(tutorial_intro: Ref<string[]>, {tutorial_mode, tutorial_step}: TutorialState) {
  if(tutorial_mode.value && tutorial_step.value === 6) {
      tutorial_intro.value[6] = 
      "Drag & drop any scatter to the right panel. <br>" 
      vue.nextTick(() => {
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "36%"
        tutorial_tooltip.style.top = "-2%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "54%"
        skip_button.style.top = "2.5%"
      })
  }
}

export function handleAddToLeftPanel(tutorial_intro: Ref<string[]>, {tutorial_mode, tutorial_step}: TutorialState) {
  if(tutorial_mode.value && tutorial_step.value === 4) {
    tutorial_intro.value[4] = 
      "You can open multiple scatterplots at the same time and use the tabs to switch among them."
    vue.nextTick(() => {
      const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
      tutorial_tooltip.style.left = "0%"
      tutorial_tooltip.style.top = "4%"
      const skip_button = document.querySelector(".skip-button") as HTMLElement
      skip_button.style.left = "40.5%"
      skip_button.style.top = "8.5%"

    })
  }

  if(tutorial_mode.value && tutorial_step.value < 8) {
    vue.nextTick(() => {
      const show_temporal_btns = document.querySelectorAll(".show-temporal") as NodeListOf<HTMLElement>
      show_temporal_btns.forEach(btn => btn.style["opacity"] = "0")
    })
  }
}

export function hideTemporalButton() {
    vue.nextTick(() => {
      const show_temporal_btns = document.querySelectorAll(".show-temporal") as NodeListOf<HTMLElement>
      show_temporal_btns.forEach(btn => btn.style["opacity"] = "0")
    })
}

export function introduceTemporalButton(tutorial_intro: Ref<string[]>) {
    tutorial_intro.value[7] = 
    "Try clicking on the temporal button."
    vue.nextTick(() => {
        const show_temporal_btns = document.querySelectorAll(".show-temporal") as NodeListOf<HTMLElement>
        show_temporal_btns.forEach(btn => btn.style["opacity"] = "1")
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "54%"
        tutorial_tooltip.style.top = "10%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "71%"
        skip_button.style.top = "12%"
    })
}

export function introduceDraggingTabs(tutorial_intro: Ref<string[]>) {
    tutorial_intro.value[6] = 
        "You can also drag the tabs directly."
    vue.nextTick(() => {
        const tutorial_tooltip = document.querySelector(".tutorial_tooltip") as HTMLElement
        tutorial_tooltip.style.left = "42%"
        tutorial_tooltip.style.top = "-2%"
        const skip_button = document.querySelector(".skip-button") as HTMLElement
        skip_button.style.left = "59%"
        skip_button.style.top = "-2.5%"

    })
}
