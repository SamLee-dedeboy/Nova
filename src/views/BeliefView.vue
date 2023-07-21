<script setup lang=ts>
import { useUserDataStore } from '../store/userStore'
import { useRoute, useRouter } from 'vue-router'

import { Ref, ref } from "vue"
import * as vue from "vue"
import * as SstColors from "../components/utils/ColorUtils"

import Dialog from "primevue/dialog"
import ProgressiveDialog from "../components/ProgressiveDialog.vue"
import HexCooccurrence from "../components/HexCooccurrence.vue";
import Legend from '../components/Legend.vue';
import * as typeUtils from "../types"
import introJS from 'intro.js'
import Tooltip from '../components/Tooltip.vue'

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
const revealed: Ref<Boolean> = ref(false)
const reveal_anmt_ended = ref(false)
const revealed_css = vue.computed(() => {
    return revealed.value ? "revealed" : "hidden"
})
const outlet_hexview: Ref<typeUtils.CooccurrHexView | undefined> = ref(undefined)
// store data for next stage
const store = useUserDataStore()
const segmentation: Ref<typeUtils.Sentiment2D> = vue.computed(() => store.segmentation)
const setUserOutletSegmentations = (segmentation, outlet) => store.setUserOutletSegmentations(segmentation, outlet)
const selected_entity = vue.computed(() => store.selected_entity)
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity )
const setCooccurrEntity = (cooccurr_entity) => store.setCooccurrEntity(cooccurr_entity)
const clicked_hexview = vue.computed(() => store.clicked_hexview)
const setClickedHexView = (hexview) => store.setClickedHexView(hexview)
const hex_selection = vue.computed(() => store.hex_selection)
const setHexSelection =  (hex_selection) => store.setHexSelection(hex_selection)
const conflict_hex = vue.computed(() => store.conflict_hex)
const setConflictHex = (conflicts) => store.setConflictHex(conflicts)
const delegateIntroHelperClick = ref(false)
const hex_filled = ref(false)
const showDragNDropHint = ref(false)

vue.watch(revealed, () => {
    user_hex.value.updateHighlightHex() 
    data_hex.value.updateHighlightHex()
    toggleDataHexTutorial()
})
vue.watch(reveal_anmt_ended, () => {
    document.querySelector(".introjs-tooltip").style.scale = 1
})

vue.onBeforeMount(() => {
    fetch_outlet_hex(target_outlet.value, target_entity.value)
})

async function fetch_outlet_hex(outlet, center_entity) {
    await fetch(`${server_address}/hexview/grouped/${center_entity}/${outlet}`)
        .then(res => res.json())
        .then(json => {
            true_hex_data.value = json
            true_hex_fetched.value = true
            const hex_view: typeUtils.CooccurrHexView = {
                title: `co-${selected_entity.value.name}`,
                data: json
            }
            outlet_hexview.value = hex_view
            setClickedHexView(hex_view)
            let init_hex_selection = {}
            init_hex_selection[outlet] = {}
            hex_view.data.sorted_cooccurrences_list.forEach(entity_data => {
                init_hex_selection[outlet][entity_data.entity] = -1
            })
            setHexSelection(init_hex_selection)
        })
}

function handleHexClicked({clickedEntity}) {
    if(clickedEntity === selected_entity.value.name) return
    highlight_hex_entity.value = clickedEntity
    setCooccurrEntity({
        "name": clickedEntity
    })
}

function handleHexFilled({filledEntity, filledHexIndex}) {
    hex_filled.value = true
    const outlet = target_outlet.value
    let old_hex_selection = hex_selection.value
    old_hex_selection[outlet][filledEntity] = filledHexIndex
    setHexSelection(old_hex_selection)
}

function checkReveal() {
    if(!hex_filled.value) { 
        showDragNDropHint.value = true
    } else {
        revealed.value = true
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
        dontShowAgain: true,
        showProgress: true,
        steps: [
            {
                element: document.querySelector('.belief-user-hexview-overlay'),
                intro: 'This is where you construct your hive.'
            },
            {
                element: document.querySelector('.belief-user-hexview > svg > rect.hive-border'),
                intro: `
                    Each hexagon represents a topic. 
                    The color of the hexagon is either positive, negative, neutral or mixed. 
                `
            },
            {
                element: document.querySelector('.belief-user-hexview > svg.hex-svg > g.hex-group > g.hex-paths > path.center-hexagon'),
                intro: `
                    Your selection of topic in the previous page is the center hexagon.
                    How has the outlet reported on this topic?
                    Click to change the color.
                `
            },
            {
                element: document.querySelector('.hive-user-selection-border'),
                intro: 'Drag the hexagons in this region to any empty slots above.'
            },
            {
                element: document.querySelector('.belief-true-hexview > svg > rect.hive-border'),
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
    let first_step = true
    introJS().setOptions({
        dontShowAgain: true,
        showProgress: true,
        steps: [
            {
                // element: document.querySelector('.belief-true-hexview > svg > rect.hive-border'),
                element: document.querySelector('.belief-true-hexview-overlay'),
                intro: `
                    This is the data suggested hive in its true form.
                    <br>
                    It shows how your selected topic, and other highly correlated topics are reported by the outlet.
                    The differences between yours and this hive are text-colored in red.
                    <br>
                    You can click any hexagon to highlight them in both hives.
                `
            },
            {
                element: document.querySelector('.diff-description-container'),
                intro: `
                    We summarizes the differences here for you.
                    <br>
                    If you're curious why differences exist on a topic,
                    click on the topic.
                    It will take you to the next page where you can see the articles.
                `
            },
        ]
    })
    .onafterchange(function(element) {
        if(first_step) {
            document.querySelector(".introjs-tooltip").style.scale = 0
            first_step = false
        }
        else {
            document.querySelector(".introjs-tooltip").style.scale = 1
        }
        return
    })
    .start()
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
        Put a gif here to demonstrate...
      </p>
      <template #footer>
        <Button label="Got it" icon="pi pi-check" @click="showDragNDropHint=false" autofocus />
      </template>
    </Dialog> 
    <div class='selection-grid' style="display: flex; width: 100%; height: 95vh; padding: 1%">
        <ProgressiveDialog 
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
                        How has ${target_outlet} reported on ${target_entity.replaceAll('_', ' ')}?
                        Positively, negatively, neutrally, or mixed?
                    </li>
                    <li>
                        How has ${target_outlet} reported on other related topics?
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
                title="belief-user-hexview" :id="`belief_user_hexview`"
                :entity_cooccurrences="outlet_hexview.data" :segmentation="segmentation"
                :highlight_hex_entity="highlight_hex_entity"
                @hex-clicked="handleHexClicked"
                @hex-filled="handleHexFilled"
                @hex-rendered="hex_rendered = true"
                :show_blink="true"
                :show_label="true">
                </HexCooccurrence>
                <!-- <div class="user-hexagon-region"></div> -->
            </div>
            <i v-if="!true_hex_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/>
            <div v-else class="journal-style-container" style="display: flex; flex-direction: column; width: 30%; padding-top: 5%;">
                <div class="journal-style" style="width: 100%; aspect-ratio: 1;">
                    <img :src="`/${target_outlet}.png`" :class="['journal-image', `${outletIconStyle(target_outlet)}`]" />
                </div>
                <div class="diff-container-placeholder" style="height: 30%">
                    <div v-if="reveal_anmt_ended" class="diff-description-container" style="margin-top:15px;">
                        <div v-if="Object.keys(conflict_hex).length > 0">
                            Your belief on:
                            <br>
                            <div class="conflict-hex-selector" v-for="conflict in conflict_hex" 
                            style="
                                font-weight: bold;
                                color: #ea2424;
                                cursor: pointer;
                                border: 1px solid black;
                                border-radius: 5px;
                                text-align: center;
                            "
                            @click="goToNextStep(conflict)">

                                <div class="conflict-hex-selector-overlay"></div>
                                {{ conflict }}
                            </div>
                            conflicts with the data.
                            <br>
                            Click any of the above to see why.
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
                <Legend id="legend-sentiment" :color_dict="SstColors.key_color_dict"/>
                <div class="tutorial-toggle-container" style="display:flex; justify-content:center; margin-top:-50px;">
                    <Button severity="secondary" text raised @click="toggleTutorial" style="width:fit-content;font-family:Trebuchet MS"> Tutorial </Button>
                </div>
            </div>
            <i v-if="!true_hex_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/>
            <div v-else class="belief-true-hexview-overlay">
                <div class="hive-header">Data suggested</div>
                <!-- <div class="border" :class="revealed_css" @click="revealed=true"></div> -->
                <i v-if="!revealed" class="pi pi-question" 
                style="
                    position:absolute; 
                    left: 43%; top: 30%; 
                    font-size: 8rem; 
                    z-index:1000;
                    pointer-events:none">
                </i>
                <HexCooccurrence ref="data_hex" class="belief-true-hexview"
                mode="data"
                :class="revealed_css"
                :title="outlet_hexview.title" :id="`belief_data_hexview`"
                :entity_cooccurrences="outlet_hexview.data" :segmentation="segmentation"
                :highlight_hex_entity="highlight_hex_entity"
                :user_hex_selection="hex_selection[target_outlet]"
                @hex-clicked="handleHexClicked"
                @hex-revealed="checkReveal"
                @hex-anmt-end="reveal_anmt_ended=true"
                @conflict-hex="setConflictHex"
                :show_blink="revealed"
                :show_label="revealed"
                >
                </HexCooccurrence>
            </div>
            <!-- <Button class="next-page-button" 
                @click="goToNextStep"
                :disabled="!revealed"
                > Next Page </Button> -->
            <svg>
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
    padding: 0% 2% 2% 2%;
}
.belief-true-hexview.hidden {
    opacity: 0.3;
}

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
  background-color: rgba(43, 42, 42, 0.5); /* Dark overlay color */
  opacity: 0; /* Initially transparent */
  transition: opacity 0.3s ease; /* Transition effect */
}

.journal-image {
    display: inline;
    margin: 0 auto;
    width: auto;
}

.icon {
    /* height: 100%; */
    width: 100%;
}

.FoxNews-icon {
    width: 100%;
}

.Breitbart-icon {
    width: 100%;
}

.next-page-button {
    position: absolute;
    top: 80%;
    left: 70%;
}
.hive-header {
  align-content: center;
  display: flex;
  justify-content: center;
  font-size: larger;
  font-weight: lighter;
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