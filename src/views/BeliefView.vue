<script setup lang=ts>
import { useUserDataStore } from '../store/userStore'
import { useRoute, useRouter } from 'vue-router'

import { Ref, ref } from "vue"
import * as vue from "vue"
import * as SstColors from "../components/utils/ColorUtils"

import Dialog from "primevue/dialog"
import ProgressiveDialog from "../components/ProgressiveDialog.vue"
import HexCooccurrence from "../components/HexCooccurrence.vue";
import * as typeUtils from "../types"
import introJS from 'intro.js'

const route = useRoute()
const router = useRouter()
const server_address = vue.inject("server_address")

const hex_rendered = ref(false)
const user_hex = ref(null)
const data_hex = ref(null)
const target_outlet = vue.computed(() => route.params.outlet as string)
const target_entity = vue.computed(() => route.params.entity as string)
const highlight_hex_entity: Ref<string> = ref()
const true_hex_data: Ref<any> = ref()
const true_hex_fetched: Ref<Boolean> = ref(false)
const revealed = ref(false)
const reveal_anmt_ended = ref(false)
const revealed_css = vue.computed(() => {
    return revealed.value ? "revealed" : "hidden"
})
const outlet_hexview: Ref<typeUtils.CooccurrHexView | undefined> = ref(undefined)
// store data for next stage
const store = useUserDataStore()
const segmentation: Ref<typeUtils.Sentiment2D> = vue.computed(() => store.segmentation)
const selected_entity = vue.computed(() => store.selected_entity)
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity )
const setCooccurrEntity = (cooccurr_entity) => store.setCooccurrEntity(cooccurr_entity)
const setClickedHexView = (hexview) => store.setClickedHexView(hexview)
const setInspectionHexView = (hexview) => store.setInspectionHexView(hexview)
const hex_selection = vue.computed(() => store.hex_selection[target_outlet.value]?.[target_entity.value] || undefined)
const setHexSelection =  (hex_selection) => store.setHexSelection(hex_selection, target_outlet.value, target_entity.value)
const conflict_hex = vue.computed(() => store.conflict_hex)
const setConflictHex = (conflicts) => store.setConflictHex(conflicts)
const delegateIntroHelperClick = ref(false)
const hex_filled = ref(false)
const showDragNDropHint = ref(false)
const firstAccess = vue.computed(() => store.belief_first_access)
const setFirstAccess = (value) => (store.setBeliefFirstAccess(value))
const init_hex_selection = ref({}) //declare a ref object
const init_hexview = ref()
const showExplanation = ref(false)
const setHiveExplanation = (explanation) => store.setHiveExplanation(explanation, target_outlet.value, target_entity.value)

vue.watch(revealed, () => {
    user_hex.value.updateHighlightHex() 
    data_hex.value.updateHighlightHex()
    toggleDataHexTutorial()
})
vue.watch(reveal_anmt_ended, () => {
    const introjs_tooltip: HTMLElement = document.querySelector(".introjs-tooltip")
    if(introjs_tooltip) introjs_tooltip.style.scale = "1"
})

vue.onBeforeMount(() => {
    fetch_outlet_hex(target_outlet.value, target_entity.value)
})

function fetchRetry(url, fetchOptions = {}, retry=2) {
  return fetch(url, fetchOptions)
  // check 404 error
  .then(response => {
    if (!response.ok) {
      console.log({response})
      if(retry != 0) return fetchRetry(url, fetchOptions, retry-1)
    }
    return response;
  })
  // other errors
  .catch(() => {
    if(retry != 0) return fetchRetry(url, fetchOptions, retry - 1)
  });
}

async function fetch_outlet_hex(outlet, center_entity) {
    const url = `${server_address}/hexview/grouped/${center_entity}/${outlet}`
    fetchRetry(url, {})
    .then(res => res.json())
    .then(json => {
        true_hex_data.value = json
        true_hex_fetched.value = true
        const hex_view: typeUtils.CooccurrHexView = {
            title: `co-${outlet}-${selected_entity.value.name}`,
            outlet: outlet,
            center_entity: selected_entity.value.name,
            data: json
        }
        outlet_hexview.value = hex_view
        init_hexview.value = hex_view    //save for user's belief
        
        setInspectionHexView(hex_view)

        // initialize user's belief hexagon
        hex_view.data.sorted_cooccurrences_list.forEach(entity_data => {
            init_hex_selection.value[entity_data.entity] = "-1"
        })
        init_hex_selection.value[center_entity] = "neutral"
    })

    // await fetch(`${server_address}/hexview/grouped/${center_entity}/${outlet}`)
    //     .then(res => res.json())
    //     .then(json => {
    //         true_hex_data.value = json
    //         true_hex_fetched.value = true
    //         const hex_view: typeUtils.CooccurrHexView = {
    //             title: `co-${outlet}-${selected_entity.value.name}`,
    //             outlet: outlet,
    //             center_entity: selected_entity.value.name,
    //             data: json
    //         }
    //         outlet_hexview.value = hex_view
    //         setClickedHexView(hex_view)
    //         setInspectionHexView(hex_view)
    //         const init_hex_selection = {}
    //         hex_view.data.sorted_cooccurrences_list.forEach(entity_data => {
    //             init_hex_selection[entity_data.entity] = -1
    //         })
    //         init_hex_selection[center_entity] = { pos: 0, neg: 0}
    //         setHexSelection(init_hex_selection)
    //     })
}

function handleHexClicked({clickedEntity}) {
    if(clickedEntity === selected_entity.value.name) return
    highlight_hex_entity.value = clickedEntity
    setCooccurrEntity({
        "name": clickedEntity
    })
}

function handleHexFilled({filledEntity, filledHexIndex}) {
    init_hex_selection.value[filledEntity] = filledHexIndex
    let exists = Object.values(init_hex_selection.value).includes("-1");
    // exists = false       
    if(!exists){ //is filled
        setHexSelection(init_hex_selection.value) //update as filled hexagon
        setClickedHexView(init_hexview.value) //update clicked entity(s) and oulet(s)
        hex_filled.value = true
    }
    else {
        hex_filled.value = false
        // hex_filled.value = true
    }

}

function checkReveal() {
    if(!hex_filled.value) { 
        showDragNDropHint.value = true
    } else {
        showExplanation.value = true
        // revealed.value = true
    }
}

function goToNextStep(co_occurr_entity: string) {
    if(co_occurr_entity !== undefined) {
        setCooccurrEntity({
            "name": co_occurr_entity,
            "target": target_entity.value,
            "outlet": target_outlet.value,
        })
    }
    router.push({ name: 'inspection', params: { 
        outlet: target_outlet.value, 
        entity: target_entity.value 
    } })
}

function outletIconStyle(name: string) {
    let className = name + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

function toggleTutorial(e: MouseEvent) {
    introJS().setOptions({
        // dontShowAgain: true,
        showProgress: true,
        steps: [
            {
                title: "Your own Hive",
                element: document.querySelector('.belief-user-hexview-overlay'),
                intro: 'This is where you construct your hive.'
            },
            {
                title: "What are the hexagons?",
                element: document.querySelector('.belief-user-hexview > svg > g.border-group > rect.hive-border'),
                intro: `
                    Each hexagon represents a topic. 
                    The color of the hexagon is either positive, negative, neutral or mixed. 
                `
            },
            {
                title: "The center one",
                element: document.querySelector('.belief-user-hexview > svg.hex-svg > g.hex-group > g.hex-paths > path.center-hexagon'),
                intro: `
                    Your selection of topic in the previous page is the center hexagon.
                    How has the outlet reported on this topic?
                    Click and change the color so that it matches what you believe.
                `
            },
            {
                title: "Other related topics",
                element: document.querySelector('.hive-user-selection-border'),
                intro: `
                    These hexagons represent other highly correlated topics we found. 
                    How has the outlet reported on these topics?
                    Drag the hexagons to any empty slots above in corresponding regions. Remember not to
                    overlap each of the hexagon.`
            },
            {
                title: "Data Suggested Hive",
                element: document.querySelector('.belief-true-hexview > svg > g.border-group > rect.hive-border'),
                intro: "This is the data suggested hive. It is hidden for now. Once you're done with your own, click it for the reveal!"
            }
        ]
    })
    .onchange(function(targetElement) {
        delegateIntroHelperClick.value = targetElement.classList.contains("center-hexagon")
        const introjs_helperlayer: HTMLElement = document.querySelector(".introjs-helperLayer")
        if(!introjs_helperlayer) return
        if(delegateIntroHelperClick.value) {
            introjs_helperlayer.style.cursor = "pointer"
        } else {
            introjs_helperlayer.style.cursor = "unset"
        }
        introjs_helperlayer?.addEventListener('click', function(e) {
            if(delegateIntroHelperClick.value) {
                user_hex.value.changeCenterHexColor()
            }
        })
    })
    .start()
}

function toggleDataHexTutorial() {
    setFirstAccess(false)
    let first_step = true
    introJS().setOptions({
        // dontShowAgain: true,
        showProgress: true,
        steps: [
            {
                // element: document.querySelector('.belief-true-hexview > svg > rect.hive-border'),
                title: "The Big Reveal",
                element: document.querySelector('.belief-true-hexview-overlay'),
                intro: `
                    This is the data suggested hive in its true form.
                    <br>
                    The <span style='color: #ea2424;'> differences </span> between yours and this hive are text-colored in red.
                    <br>
                    You can click any hexagon to highlight them in both hives.
                `
            },
            {
                title: "What next?",
                element: document.querySelector('.diff-container-placeholder'),
                intro: `
                    We summarizes the differences here for you.
                    <p style='font-weight: bold; font-size: 1.1rem; color:#ea2424'> Investigate them! </p>
                    If you're curious why differences exist on a topic,
                    click on the topic.
                    It will take you to the next page where you can see the articles.
                `
            },
        ]
    })
    .onafterchange(function(element) {
        if(first_step) {
            (document.querySelector(".introjs-tooltip") as HTMLElement).style.scale = "0"
            first_step = false
        }
        else {
            (document.querySelector(".introjs-tooltip")as HTMLElement).style.scale = "1"
        }
        return
    })
    .start()
}

function recordInput(e) {
    setHiveExplanation(e.target.value)
}
</script>
<template>
    <Dialog v-model:visible="showDragNDropHint" position="center" :model="true">
      <template #header>
        <h3 class="header-container" style="display: flex; align-items: center"> 
            <i class="pi pi-exclamation-triangle" style="font-size: 1.5rem; color: #ff7c7c" /> 
            &thinsp;
            <span class="header-text"> Make your prediction first! </span> 
        </h3>
      </template>

      <p class="introTutorial">
        Drag and drop the hexagons into the hive to create your prediction!
        <br>
        <!-- Put a gif here to demonstrate... -->
      </p>
      <template #footer>
        <Button label="Got it" icon="pi pi-check" @click="showDragNDropHint=false" autofocus />
      </template>
    </Dialog> 
    <Dialog v-model:visible="showExplanation" position="center" :model="true">
      <template #header>
        <h3 class="header-container" style="display: flex; align-items: center"> 
            <i class="pi pi-angle-double-right" style="font-size: 1rem;" /> 
            &thinsp;
            &thinsp;
            <span class="header-text">
                Wait! One more thing to do...
            </span> 
        </h3>
      </template>

      <div>
        Before you see the data, could you please briefly explain your thought process behind the placement of each hive?
        <br>
        What topics are positive, negative, neutral, or mixed? 
        <br>
        Can you recall any example? 
        <br>
        <span style="font-size: 0.7rem; font-style: italic;">
        Later in the survey, what you write here will be helpful to answer the questions.
        <br>
        For privacy concerns, we do not collect anything other than the survey result.
        </span>
      </div>
      <textarea style="width: 600px; height: 200px; margin-top; 10px;" @input="recordInput"></textarea>
      <template #footer>    
        <Button label="I'm Done!" icon="pi pi-check" @click="revealed=true;showExplanation=false;" autofocus />
      </template>
    </Dialog> 
    <div class='selection-grid' style="display: flex; width: 100%; height: 95vh; padding: 1%">
        <ProgressiveDialog 
            v-if="firstAccess"
            @toggle-tutorial="toggleTutorial"
            :header="`How would ${target_outlet} report on ${target_entity.replaceAll('_', ' ')}?`"
            :content="`
                On this page, you will be presented a <span class='intro-hive-hint'>hive</span> that represents how it would report on a topic based on the data we collected. 
                <br>
                <br>
                The <span style='border-bottom: 1px solid grey;font-style:italic;'>data suggested hive</span> 
                is hidden at first on the right side.
                Before we show it to you, let's first try to construct your own hive based on your personal experience.
                <br>
                <br>
                When constructing the hive, try to keep the following questions in mind:
                <br>
                <ul>
                    <li>
                        How would ${target_outlet} report on ${target_entity.replaceAll('_', ' ')}?
                        Positively, negatively, neutrally, or mixed?
                    </li>
                    <li>
                        How would ${target_outlet} report on other related topics?
                    </li>
                </ul>
                <br>
                <br>
                Drag and drop the hexagons into the hive to create your prediction!
            `"></ProgressiveDialog>
        <div class=page-container style="display: flex; width: 100%; height: 100%">
            <i v-if="!true_hex_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/>
            <div v-else class="belief-user-hexview-overlay">
                <div class="hive-header">Your belief </div>
                <!-- <div class="border" ></div> -->
                <HexCooccurrence ref="user_hex" class="belief-user-hexview"
                mode="user"
                :id="`belief_user_hexview`"
                :entity_cooccurrences="outlet_hexview.data" :segmentation="segmentation"
                :highlight_hex_entity="highlight_hex_entity"
                @hex-clicked="handleHexClicked"
                @hex-filled="handleHexFilled"
                @hex-rendered="hex_rendered = true"
                @center-changable="!revealed"
                :show_blink="true"
                :show_label="true"
                :center_changable="true">
                </HexCooccurrence>
            </div>
            <i v-if="!true_hex_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/>
            <div v-else class="journal-style-container" style="display: flex; flex-direction: column; padding-top: 2%; padding-bottom: 15.7%; justify-content: space-between; ">
                <div class="journal-style" style="width: 100%; display: flex; align-items: center; justify-content: center;">
                    <img :src="`../../imgs/${target_outlet}.png`" :class="['journal-image', `${outletIconStyle(target_outlet)}`]" />
                </div>
                <div class="diff-container-placeholder">
                    <div v-if="reveal_anmt_ended" class="diff-description-container" style="height: 100%; margin-top:15px;">
                        <div v-if="Object.keys(conflict_hex).length > 0" style="display: flex; flex-direction: column; height: 100%;">
                            <span style="font-style: italic;"> Your belief on the following topics conflicts with the data.  </span>
                            <br>
                            <div class="conflict-items-container" style="max-height: 100%; overflow: scroll; padding: 5px;">
                                <div class="conflict-hex-selector" v-for="conflict in conflict_hex" 
                                :key="conflict"
                                style="
                                    font-weight: bold;
                                    font-family: Trebuchet MS;
                                    color: #e33737;
                                    cursor: pointer;
                                    border-color: transparent;
                                    border-radius: 3px;
                                    text-align: center;
                                    background-color: transparent;
                                    padding: 0.5rem, 1rem;
                                    margin: 1px 0px;
                                    box-shadow: 0 3px 1px -2px rgba(255, 0, 0, 0.2), 0 2px 2px 0 rgba(128, 0, 0, 0.14), 0 1px 5px 0 rgba(128, 0, 0, 0.12);
                                "
                                @click="goToNextStep(conflict)">

                                <div class="conflict-hex-selector-overlay" ></div>
                                    {{ (conflict as string).replaceAll("_", " ") }}
                                </div>

                            </div>
                            <br>
                            <span style="font-style: italic; font-weight: bold;"> Click any of the above to see why.  </span>
                        </div>
                        <div v-else>
                            <div>
                                Your prediction matches the data perfectly!
                                <br>
                                If you're interested in any topic, click on the hexagon to select it,
                                then click 'Next Page' to see the articles.
                            </div>
                            <div style="display:flex; justify-content:center; margin-top:15px;">
                                <Button class="next-step-button" severity="secondary" text raised @click="goToNextStep(selected_cooccurr_entity?.name)" style="width:fit-content;font-family:Trebuchet MS;"> Next Page </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- <Legend id="legend-sentiment" :color_dict="SstColors.key_color_dict" style="margin-top: 15px;"/> -->
                <div class="legend-container" style="width: 100%; ">
                    <div class="legend-image-container" style="
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        grid-template-rows: repeat(2, 1fr); /* Two rows with equal height */
                        gap: 10px;
                        width: 100%; /* Container takes the full width of parent */
                        padding: 10px; /* Padding for spacing around the grid items */
                        box-sizing: border-box; /* Include padding in width calculation */
                        border: 2px solid #b3b3b3;
                        border-radius: 30px;
                        background: #fffcf5;
                    ">
                        <img v-for="sst in Object.keys(SstColors.hive_color_dict)" :key="sst" :src="`../../legend/${sst}.png`" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                </div>
            </div>
            <i v-if="!true_hex_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/>
            <div v-else class="belief-true-hexview-overlay">
                <div class="hive-header">Data suggested</div>
                <!-- <div class="border" :class="revealed_css" @click="revealed=true"></div> -->
                <i v-if="!revealed" class="pi pi-question" 
                style="
                    position:absolute; 
                    left: 39%; top: 25%; 
                    font-size: 8rem; 
                    z-index:1000;
                    pointer-events:none">
                </i>
                <HexCooccurrence ref="data_hex" class="belief-true-hexview"
                mode="data"
                :class="revealed_css"
                :id="`belief_data_hexview`"
                :entity_cooccurrences="outlet_hexview.data" :segmentation="segmentation"
                :highlight_hex_entity="highlight_hex_entity"
                :user_hex_selection="hex_selection"
                @hex-clicked="handleHexClicked"
                @hex-revealed="checkReveal"
                @hex-anmt-end="reveal_anmt_ended=true"
                @conflict-hex="setConflictHex"
                :show_blink="revealed"
                :show_label="revealed"
                :show_hex_appear="true"
                >
                </HexCooccurrence>
                <div class="tutorial-toggle-container" style="display:inline; margin-left: auto; position: absolute; right: 0%; top: -1%;">
                    <Button severity="secondary" text raised @click="toggleTutorial" style="width:fit-content;font-family:Trebuchet MS"> Tutorial </Button>
                </div>
            </div>
            <!-- <Button class="next-page-button" 
                @click="goToNextStep"
                :disabled="!revealed"
                > Next Page </Button> -->
            <svg style="position: absolute">
                <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5" />
                    <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
                </pattern>
            </svg>
        </div>
    </div>
</template>

<style scoped>
.belief-user-hexview-overlay, .belief-true-hexview-overlay {
    width: 100%;
    height: 100%;
    padding: 0% 0% 2% 0%;
}
.belief-true-hexview.hidden {
    opacity: 0.1;
}

/* :deep(.p-button) {
    padding: 0.1rem 1rem;
} */
/* Journal style */
.conflict-hex-selector:hover .conflict-hex-selector-overlay {
    opacity: 1;
}
.conflict-hex-selector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 3px;
  background-color: rgba(43, 42, 42, 0.5); 
  opacity: 0; 
  transition: opacity 0.3s ease;
}

.hive-header {
  align-content: center;
  display: flex;
  justify-content: center;
  font-size: larger;
  font-weight: lighter;
}
.pi-question {
    border-radius: 50%;
    padding: 1rem;
    animation: pulse 2s infinite;
}
.next-step-button {
    /* animation:pulse 2s infinite; */
}
@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.5);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.7);
  }
}
</style>