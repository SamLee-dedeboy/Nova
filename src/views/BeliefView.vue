<script setup lang=ts>
import { useUserDataStore } from '../store/userStore'
import { useRoute, useRouter } from 'vue-router'

import { Ref, ref } from "vue"
import * as vue from "vue"
import * as SstColors from "../components/utils/ColorUtils"

import Dialog from 'primevue/dialog';
import HexCooccurrence from "../components/HexCooccurrence.vue";
import Legend from '../components/Legend.vue';
import * as typeUtils from "../types"

const route = useRoute()
const router = useRouter()
const server_address = vue.inject("server_address")
// const left_most_outlet = vue.inject("left_most_outlet")
// const right_most_outlet = vue.inject("right_most_outlet")
const random_outlet = vue.inject("random_outlet")
const outlet_leaning_scale = vue.inject("outlet_leaning_scale")
const outlet_leaning_scale_dict = vue.inject("outlet_leaning_scale_dict")

const user_hex = ref(null)
const data_hex = ref(null)
const target_outlet = vue.computed(() => route.params.outlet as string)
const target_entity = vue.computed(() => route.params.entity as string)
const highlight_hex_entity: Ref<string> = ref()
const order = vue.computed(() => route.params.order as string)
const true_hex_data: Ref<any> = ref()
const true_hex_fetched: Ref<Boolean> = ref(false)
const revealed: Ref<Boolean> = ref(false)
const revealed_css = vue.computed(() => {
    return revealed.value ? "revealed" : "hidden"
})
const outlet_hexview: Ref<typeUtils.CooccurrHexView | undefined> = ref(undefined)
// store data for next stage
const store = useUserDataStore()
const segmentation: Ref<typeUtils.Sentiment2D> = vue.computed(() => store.segmentation)
const setUserOutletSegmentations = (segmentation, outlet) => store.setUserOutletSegmentations(segmentation, outlet)
const selected_entity = vue.computed(() => store.selected_entity)
const setEntity = (entity) => store.setEntity(entity)
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity )
const setCooccurrEntity = (cooccurr_entity) => store.setCooccurrEntity(cooccurr_entity)
const clicked_hexview = vue.computed(() => store.clicked_hexview)
const setClickedHexView = (hexview) => store.setClickedHexView(hexview)
const hex_selection = vue.computed(() => store.hex_selection)
const setHexSelection =  (hex_selection) => store.setHexSelection(hex_selection)
vue.watch(order, (old_value, new_value) => {
    document.querySelectorAll(".hex-cell").forEach(cell => {
        cell.classList.remove("clicked-cell")
    })
    // target outlet should have changed
    // add 'if' to avoid extra fetching
    if (order.value) fetch_outlet_hex(target_outlet.value, target_entity.value)
})

vue.watch(revealed, () => {
   user_hex.value.updateHighlightHex() 
   data_hex.value.updateHighlightHex()
})

vue.onBeforeMount(() => {
    fetch_outlet_hex(target_outlet.value, target_entity.value)
})

async function fetch_outlet_hex(outlet, center_entity) {
    await fetch(`${server_address}/hexview/grouped/${center_entity}/${outlet}`)
        .then(res => res.json())
        .then(json => {
            console.log({"true_hex_data": json})
            true_hex_data.value = json
            true_hex_fetched.value = true
            const hex_view: typeUtils.CooccurrHexView = {
                title: `co-${selected_entity.value.name}`,
                data: json.cooccurrences_data,
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

function handleCellClicked(e, segmentation, index) {
    document.querySelectorAll(".hex-cell").forEach(cell => {
        cell.classList.remove("clicked-cell")
    })
    e.target.classList.add("clicked-cell")
    //console.log(e.target, segmentation) // or segmentations.value[index]
    setUserOutletSegmentations(segmentation, route.params.outlet as string)
    if (route.params.order == "second") {
        // begin interpolation / extrapolation
        const first_segmentation = store.user_outlet_segmentations[random_outlet[0]]
        const second_segmentation = store.user_outlet_segmentations[random_outlet[1]]
        const first_base_score = outlet_leaning_scale_dict[random_outlet[0]]
        const second_base_score = outlet_leaning_scale_dict[random_outlet[1]]
        const unit_pos = (first_segmentation.pos - second_segmentation.pos) / (first_base_score - second_base_score)
        const unit_neg = (first_segmentation.neg - second_segmentation.neg) / (first_base_score - second_base_score)
        Object.keys(outlet_leaning_scale_dict).forEach(outlet => {
            const leaning_score = outlet_leaning_scale_dict[outlet]
            // interpolation / extrapolation
            const interpolated_segmentation = {
                pos: unit_pos * (leaning_score - first_base_score) + first_segmentation.pos,
                neg: unit_neg * (leaning_score - first_base_score) + first_segmentation.neg
            }
            setUserOutletSegmentations(interpolated_segmentation, outlet)
        })
        //Route to Comparision Page
        // const ccEntity = selected_cooccurr_entity.value?.name || '';
        const entityName: string = selected_entity.value?.name;
        // console.log("ROUTER PARAMS to Compare",{ entity: entityName, cooccurr_entity: ccEntity } )
        router.push({ name: 'compare', params: { entity: selected_entity.value.name } })
    } else {
        const randomOutlet: string = random_outlet[1]; //selected_cooccurr_entity?.name || '';
        const entityName: string = selected_entity.value.name;
        router.push({ name: 'belief', params: { order: 'second', outlet: randomOutlet, entity: target_entity.value } })
    }
}

function handleHexClicked({clickedEntity}) {
    if(clickedEntity === selected_entity.value.name) return
    highlight_hex_entity.value = clickedEntity
    setCooccurrEntity({
        "name": clickedEntity
    })
}

function handleHexFilled({filledEntity, filledHexIndex}) {
    const outlet = target_outlet.value
    let old_hex_selection = hex_selection.value
    old_hex_selection[outlet][filledEntity] = filledHexIndex
    setHexSelection(old_hex_selection)
    console.log(hex_selection.value)
}

function goToNextStep() {
    const randomOutlet: string = random_outlet[1]; //selected_cooccurr_entity?.name || '';
    router.push({ name: 'inspection', params: { outlet: target_outlet.value, entity: target_entity.value } })
}

function outletIconStyle(name: string) {
    let className = name + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

const showTutorial_B: Ref<boolean> = ref(true)

function toggleTutorial(e: MouseEvent) {
    showTutorial_B.value = false
}

</script>
<template>
    <div class='selection-grid'>
        <Dialog v-model:visible="showTutorial_B" class="tutorialStyle" position="center" :modal="true">
            <template #header>
                <h3> <i class="pi pi-compass" /> How would {{ target_outlet }} report on {{target_entity.replaceAll("_", " ")}}? </h3>
            </template>

            <p class="introTutorial">
                On this page, you will be presented an outlet, {{ target_outlet }}, and five Co-Occurrence Hives. Based on your
                prior knowledge of the outlet, and selected topic, how do you believe {{ target_outlet }} reported on {{
                    target_entity.replaceAll("_", " ") }}?
                That is, what do you think the overall sentiment would be for articles written by {{ target_outlet }} that discuss {{
                    target_entity.replaceAll("_", " ") }} alongside other topics.
                Would it be mixed, neutral, negative, positive, or polarizing? 

                <br />
                <br />
                As a reminder, the center hex is the selected topic and all other hexes are topics that frequently appeared
                with it across all outlets. Thus, if it is light grey it implies the selected outlet never reported on that
                topic alongside {{ target_entity.replaceAll("_", " ") }}.
            </p>
            <template #footer>
                <Button label="Ready" icon="pi pi-check" @click="toggleTutorial" autofocus />
            </template>
        </Dialog>

        <div class=page-container>
            <i v-if="!true_hex_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/>
            <div v-else class="belief-user-hexview-overlay">
                <div class="border" ></div>
                <HexCooccurrence ref="user_hex" class="belief-user-hexview"
                mode="user"
                title="belief-user-hexview" :id="`belief_user_hexview`"
                :entity_cooccurrences="outlet_hexview.data" :segmentation="segmentation"
                :highlight_hex_entity="highlight_hex_entity"
                @hex-clicked="handleHexClicked"
                @hex-filled="handleHexFilled"
                :show_blink="true"
                :show_label="true">
                </HexCooccurrence>
            </div>
            <i v-if="!true_hex_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/>
            <div v-else class="journal-style-container">
                <div class="journal-style">
                    <img :src="`/${target_outlet}.png`" :class="['journal-image', `${outletIconStyle(target_outlet)}`]" />
                </div>
                <Legend id="legend-sentiment" :color_dict="SstColors.key_color_dict"/>
            </div>
            <i v-if="!true_hex_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/>
            <div v-else class="belief-true-hexview-overlay">
                <div class="border" :class="revealed_css" @click="revealed=true"></div>
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
                @hex-clicked="handleHexClicked"
                :show_blink="revealed"
                :show_label="revealed"
                >
                </HexCooccurrence>
            </div>
            <Button v-if="route.params.order == 'first'" 
                class="next-page-button" 
                @click="goToNextStep"
                :disabled="!revealed"
                > Next Page </Button>
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
.selection-grid {
    width: 100%;
    padding: 1%;
    height: 95vh;
    display: flex;
    /* flex-wrap: wrap-reverse;
    justify-content: space-between; */
}
.page-container {
  width: 100%;
  height: 100%;
  display: flex;
}

.border {
    position:absolute;
    border:1px solid black;
    left: 12%;
    right: 12%;
    top: 5.7%;
    bottom: 32%;
    z-index: 100;
}
.border.revealed {
    z-index: 0 !important;
}
.belief-user-hexview-overlay, .belief-true-hexview-overlay {
    width: 100%;
    height: 100%;
    padding: 2%;
    /*! display: flex; */
}
.belief-true-hexview, .belief-user-hexview {
    /* border: 1px solid black; */
}
/* .belief-true-hexview:hover {
    cursor: pointer;
    opacity: 0.8;
} */
.belief-user-hexview-overlay > .border {
    z-index: 0 !important;
}
.belief-true-hexview.hidden {
    opacity: 0.3;
}
.border.hidden {
    opacity: 0.3;
    background: #8a8787;
}
.border.hidden:hover {
    cursor: pointer;
    opacity: 0.8;
}

/* Journal style */
.journal-style-container {
  /*! height: 100%; */
  display: flex;
  flex-direction: column;
  width: 30%;
  padding-top: 5%;
}
.journal-style {
  width: 100%;
  /*! height: 100%; */
  aspect-ratio: 1;
}
.legend-container {
    width: 85%;
}

/* .journal-style {
    width: 200px;
    height: 200px;
    position: absolute;
    bottom: 68%;
    left: 45%;
    overflow: hidden;
    border-radius: 50%;
    border: #d7d7d7 3px solid;
} */
:deep(.hex-svg) {
    /* width: unset;
    height: unset; */
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
</style>