<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import Divider from "primevue/divider"
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import InputSwitch from 'primevue/inputswitch';



/**
 * libraries
 */
import * as vue from "vue"
import { Ref, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUserDataStore } from '../store/userStore'

/**
 * types & utils
 */
import * as typeUtils from "../types"
import * as SstColors from "../components/utils/ColorUtils"

/**
 * vue components
 */
import HexCooccurrence from "../components/HexCooccurrence.vue";
import EntityInfoView from "../components/EntityInfoView.vue";
import TopicBars from "../components/TopicBars.vue";
import HorizontalTopicBars from '../components/HorizontalTopicBars.vue';
import Legend from '../components/Legend.vue';
import HexEntityScatter from '../components/HexEntityScatter.vue';

const route = useRoute()
// const store = useStore()
const store = useUserDataStore()
/**
 * vuex store objects
 */
console.log(store)
const segmentation = vue.computed(() => store.segmentation)
const setSegmentation = (segmentation) => store.setSegmentation(segmentation)
const user_outlet_segmentations = vue.computed(() => store.user_outlet_segmentations)
const selected_entity = vue.computed(() => store.selected_entity)
const setEntity = (entity) => store.setEntity(entity)
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity )
const setCooccurrEntity = (cooccurr_entity) => store.setCooccurrEntity(cooccurr_entity)
const clicked_hexview = vue.computed(() => store.clicked_hexview)
const setClickedHexView = (hexview) => store.setClickedHexView(hexview)
const hexview_grid = vue.computed(() => store.hexview_grid)
const setHexViewGrid = (grid) => store.setHexViewGrid(grid)

const hex_entity_scatter_view: Ref<any> = ref(undefined)
const highlight_hex_entity: Ref<string> = ref("")
const notes = vue.computed(() => store.notes)
const setNotes = (e) => store.setNotes(e.target.value)
const selected_outlet = vue.computed(() => selected_entity.value?.outlet === "Overall"? "ABC News" :selected_entity.value?.outlet)
const outlet_leaning_scale = vue.inject("outlet_leaning_scale")
const flipHex: Ref<Any> = ref(outlet_leaning_scale.map(scale_obj => scale_obj.outlet).map(outlet => { return { outlet: false } }))




/**
 * left & right section width (percentage)
 */
const left_section_size = 83
const right_section_size = vue.computed(() => 100 - left_section_size)


const server_address = vue.inject("server_address")

/**
 * data
 */
const data_fetched: Ref<boolean> = ref(false)



vue.onMounted(async () => {
    const target: string = selected_entity.value.name
    const co_occurr_entity = selected_cooccurr_entity.value?.name || ""
    highlight_hex_entity.value = co_occurr_entity
    const promiseArray: any[] = []
    promiseArray.push(new Promise((resolve) => {
        fetch(`${server_address}/hexview/grouped/${target}`)
            .then(res => res.json())
            .then(json => {
                const data_list = json
                let hexview_grid_data: typeUtils.CooccurrHexView[] = []
                data_list.forEach(hex_data => {
                    const hex_view: typeUtils.CooccurrHexView = {
                        title: `co-${hex_data.entity}-${hex_data.outlet}`,
                        data: hex_data.cooccurrences_data
                    }
                    hexview_grid_data.push(hex_view)
                })
                setHexViewGrid(hexview_grid_data)
                console.log(data_list)
                const hex_candidates = hexview_grid.value[0].data.sorted_cooccurrences_list.map((hex_entity: typeUtils.HexEntity) => hex_entity.entity)
                hex_candidates.push(target)
                if (!selected_outlet.value.includes("Overall"))
                    fetch_entity_grouped_node(hex_candidates, selected_outlet.value)
                resolve("success")
            })
    }))
    await Promise.all(promiseArray)
        .then(res => {
            data_fetched.value = true
            console.log("all fetched")
        })
    // handle user return page
    if(co_occurr_entity != "") handleHexClicked({target: target + "-"+selected_outlet.value, co_occurr_entity} , hexview_grid.value[0]) 
})

async function fetch_entity_grouped_node(hex_candidates, outlet) {
    console.log(hex_candidates)
    await fetch(`${server_address}/processed_data/scatter_node/grouped/hex_candidates/${outlet}`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(hex_candidates)
    })
        .then(res => res.json())
        .then(json => {
            hex_entity_scatter_view.value = {
                title: "Hex Entity Scatter",
                data: {
                    nodes: json,
                    max_articles: Math.max(...json.map(node => node.article_ids.length)),
                    min_articles: Math.min(...json.map(node => node.article_ids.length)),
                }
            }
            console.log(hex_entity_scatter_view.value)
            console.log("hex entity scatter view fetched")
        })
}

async function handleHexClicked({ target, co_occurr_entity }, view) {
    const entity = target.split("-")[0]
    const outlet = target.split("-")[1]
    setClickedHexView(view)
    highlight_hex_entity.value = co_occurr_entity
    await fetch(`${server_address}/processed_data/cooccurr_info/grouped/${outlet}/${entity}/${co_occurr_entity}`)
        .then(res => res.json())
        .then(json => {
            console.log("cooccurr_info fetched")
            const target_entity = {
                name: json.target,
                outlet: outlet,
                num_of_mentions: json.target_num,
                articles_topic_dict: json.target_articles_topic_dict,
                sst_ratio: view.data.target.sst
            }
            setEntity(target_entity)
            const cooccurr_entity = {
                target: json.target,
                name: json.cooccurr_entity,
                outlet: outlet,
                num_of_mentions: json.cooccurr_num,
                target_num_of_mentions: json.target_num_of_mentions,
                articles_topic_dict: json.cooccurr_articles_topic_dict,
                cooccurr_article_ids: json.cooccurr_article_ids
            }
            const hex_cooccurr_entity = view.data.sorted_cooccurrences_list.find(hex_entity => hex_entity.entity === cooccurr_entity.name)
            if (hex_cooccurr_entity.article_ids.length === 0) {
                cooccurr_entity.articles_topic_dict = undefined
            }

            setCooccurrEntity(cooccurr_entity)

        })
    const hex_candidates = hexview_grid.value[0].data.sorted_cooccurrences_list.map((hex_entity: typeUtils.HexEntity) => hex_entity.entity)
    hex_candidates.push(entity)
    await fetch_entity_grouped_node(hex_candidates, selected_outlet.value)
}

const showTutorial: Ref<boolean> = ref(true)

function toggleTutorial(e:MouseEvent){
    showTutorial.value=false
}

function toggleSelection(selectedOutlet: any, currentOutlet: string) {
    currentOutlet = currentOutlet.split('-')[2];
    let selectionClass = (currentOutlet.includes(selectedOutlet.outlet)) ? 'hiveSelect' : '';
    return selectionClass
}

function outletIconStyle(name: string) {
    let className = name.split('-')[2].replaceAll(' ', '-') + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}
  
function outletIconHeaderStyle(name: string) {
    let className = name.replaceAll(' ', '-') + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

</script>

<template>
    <Dialog v-model:visible="showTutorial" class="tutorialStyle" position="center" :modal="true">
      <template #header>
        <h3> <i class="pi pi-compass"/> Compare Coverage for {{ selected_entity.name.replaceAll("_"," ") }} </h3>
      </template>

      <p class="introTutorial">
        Try to spot some similarities and difference between the outlets for how they covered {{ selected_entity.name.replaceAll("_"," ") }}.
        For example, some outlets discuss different topics when mentioning {{ selected_entity.name.replaceAll("_"," ") }}.
      </p>
      <p class="tutorialInstructions">
        Use the notes block to keep track of any general observations you may find here.
        Click <span class="bold"> review articles </span> after selecting a hexagon to see articles that contain that topic and {{ selected_entity.name.replaceAll("_"," ") }}.
      </p>

      <template #footer>
          <Button label="Ready" icon="pi pi-check" @click="toggleTutorial" autofocus />
      </template>
    </Dialog>

    <Splitter class="splitter-outmost">
        <SplitterPanel id="hexview_section" class="hexview-section flex align-items-center justify-content-center"
            :size="left_section_size" :min-size="left_section_size">
            <div class="reminder-click-hex">
                <p class="reminderBody">Do you see any differences among outlets for their coverage?</p>
            </div>
            <h2 class="component-header hexview-grid-header">
                Topic Co-occurrence Hives for
                <span class="mainTopicStyle"> {{ selected_entity.name.replaceAll("_"," ") }} </span>
                &nbsp
                <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 500px">
                        Each hive represents the coverage on {{ selected_entity?.name.replaceAll("_"," ") }} by that
                        outlet. <br />
                        A hexagon is left blanked if the outlet does not cover that topic. <br />
                        Try to discover outlet coverage differences and common grounds.
                    </span>
                </i>
            </h2>
            <div class="hexview-grid-container">
                <div class="hexview-grid-cell-container" v-if="data_fetched" v-for="view, index in hexview_grid">
                    <InputSwitch class="flip-switch" 
                        v-model="flipHex[view.title.split('-')[2]]"
                        style="position:absolute;z-index:2"
                     ></InputSwitch>
                    <HexCooccurrence class="compare-co-hexview" 
                        v-if="flipHex[view.title.split('-')[2]]"
                        :title="view.title" :id="`compare-co-hex-${index}`"
                        :entity_cooccurrences="view.data" :segmentation="segmentation"
                        :show_blink="true"
                        :highlight_hex_entity="highlight_hex_entity" v-on:hex-clicked="handleHexClicked($event, view)">
                    </HexCooccurrence>
                    <HexCooccurrence class="compare-co-hexview" 
                        v-else
                        :title="view.title" :id="`compare-co-hex-${index}`"
                        :entity_cooccurrences="view.data" :segmentation="user_outlet_segmentations[view.title.split('-')[2]]"
                        :show_blink="true"
                        :highlight_hex_entity="highlight_hex_entity" v-on:hex-clicked="handleHexClicked($event, view)">
                    </HexCooccurrence>
                    <div :class="['journal-style', toggleSelection(selected_entity, view.title)]">
                        <img :src="`/${view.title.split('-')[2]}.png`"
                            :class="['journal-image',`${outletIconStyle(view.title)}`]" />
                    </div>
                </div>
                <svg style='position:absolute'>
                    <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)"
                        patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="10" height="10" style="fill:#baf0f5" />
                        <line x1="0" y1="0" x2="0" y2="10" style="stroke:#f4c49c; stroke-width:8" />
                    </pattern>
                </svg>
            </div>
        </SplitterPanel>
        <SplitterPanel id="entity_info_section" class="entity-info-panel flex align-items-center justify-content-center"
            :size="right_section_size">
            <div class="entity-info-container">
                <div class="target-cooccurr-container" v-if="selected_entity">
                    <h2 class="component-header cooccurr-info-header">
                        Topic Info
                        <i class='pi pi-info-circle tooltip'>
                            <span class="tooltiptext right-tooltiptext" style="width: 100px;">
                                <Legend id="policy_legend" class="policy-bar-legend"
                                    :color_dict="SstColors.topic_color_dict" :row_height="10" :font_size="1.2"></Legend>
                            </span>
                        </i>
                    </h2>
                    <div class="cooccurr-info-content">
                        <div class="cooccurContent">
                            <h4>Articles with <span class="topicStyle"> {{ selected_entity.name.replaceAll("_"," ") }}
                                </span> &
                                <span v-if='selected_cooccurr_entity' class="topicStyle"> {{
                                selected_cooccurr_entity.name.replaceAll("_"," ") }} </span>
                            </h4>

                        </div>
                    </div>

                </div>
                <div class="notes-section" v-if="selected_entity">
                    <h2 class="component-header notes-header">
                        Notes
                        <i class='pi pi-info-circle tooltip'>
                            <span class="tooltiptext right-tooltiptext" style="width: 145px">
                                Write down any observations, these will be saved and added to your report.
                            </span>
                        </i>
                    </h2>
                    <textarea class="notes-style" :value="notes" @input="setNotes"
                        placeholder="Write down any observations..." />

                    <div v-if="selected_outlet !== 'Overall'" class="navigate-container">
                        <router-link class="goNext"
                            :to="{ name: 'inspection', params: { entity: selected_entity?.name || 'undefined' }}">
                            <Button label="Review Articles" icon="pi pi-file" />
                        </router-link>
                    </div>
                </div>
                <div class="legend-utils" v-if="selected_entity">
                    <h2 class="component-header legend-header">
                        <div class="journalSent">
                            <div :class="['journal-style']">
                                <img v-if="selected_outlet !=='Overall'"  :src="`/${selected_outlet}.png`"
                                    :class="['journal-image',`${outletIconHeaderStyle(selected_outlet)}`]" />
                            </div>
                            <div class="journalSentContent">Sentiment</div>
                        </div>
                    </h2>
                    <HexEntityScatter ref="hex_entity_scatter" v-if="hex_entity_scatter_view"
                        :view="hex_entity_scatter_view" :highlight_node_text="selected_entity.name"
                        :highlight_cooccurr="selected_cooccurr_entity?.name"
                        id="hex_entity_scatter" :segment_mode="true" :segmentation="segmentation"
                        @update:segmentation="setSegmentation">
                    </HexEntityScatter>
                    <h4 id="hexScatterToolTip" class="toolTipStyle"> </h4>
                </div>

            </div>

        </SplitterPanel>
    </Splitter>
</template>

<style scoped lang="scss">
// ---------------------
// general
// ---------------------
.splitter-outmost {
    width: 99vw;
    height: 98vh;
    display: flex;
}

.notes-style {
    width: 100%;
    height: 50%;
}

:deep(.p-divider.p-divider-vertical::before) {
    border-left: 1px solid #dee2e6 !important;
}

// ---------------------
// hex grid
// ---------------------
.hexview-grid-header {
    background: #f7f7f7;
    margin: 0.5%;
    padding: 0.5%;
}

.hexview-grid-container {
    display: grid;
    aspect-ratio: 3/2;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 0;
    width: 100%;
    height: 91%;
}

.hexview-grid-cell-container {
    overflow: hidden;
}

.compare-co-hexview {
    z-index: 1
}

.journal-style {
    width: 50px;
    height: 50px;
    position: relative;
    bottom: 15%;
    left: 10%;
    overflow: hidden;
    border-radius: 50%;
    border: #d7d7d7 3px solid;
}

.FoxNews-icon {
    height: 85%;
    right: 30%;
    bottom: 2%;
}

.Breitbart-icon {
    height: 65%;
    top: 20%;
    left: 10%;
}

.icon {
    height: 100%;
}

.hiveSelect {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
    transform: scale(1);
    animation: pulse 2s infinite;
}

.journal-image {
    display: inline;
    margin: 0 auto;
    width: auto;
}

.journalSent {
    display: flex
}

.journalSentContent {
    width: 50%;
    position: absolute;
    left: 35%;
    top: 10%;
}

// ---------------------
// entity info section
// ---------------------
.entity-info-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f7f7f7;
    margin: 1%;
}

.target-cooccurr-container {
    display: flex;
    flex-direction: column;
    height: 10%;
}

.topic-bar-container {
    height: 30%;
}

.cooccurr-info-content {
    display: flex;
    text-align: center;
}

.entity-info-section {
    padding-left: 1%;
    margin-left: 6%;
}

.topicStyle {
    font-style: italic;
    font-weight: 700;
}

// ---------------------
// legend section
// ---------------------
.legend-utils {
    margin: 1%;
    display: flex;
    flex-direction: column;
    height: 45%;
}

.segment-legend {
    width: 60%;
}

.notes-section {
    margin-left: 1%;
    margin-top: 10%;
    flex: 1 1 0;
    height: 20%;
}


.mainTopicStyle {
    font-style: italic;
    font-weight: 200;
}

:deep(p-inputtextarea) {
    height: 50%;
}

.reminder-click-hex {
    width: 35%;
    text-align: center;
    display: flex;
    height: 5%;
    font-size: 1em;
    position: absolute;
    top: 1.25%;
    right: 1%;
    z-index: 999;
    transform: scale(1);
    animation: pulseText 2s infinite;
}

.reminderBody {
    position: relative;
    top: 25%;
    left: 10%;
    font-style: italic;
}

.tooltiptext {
    font-size: 1rem;
    font-size: 1rem;
    font-family: 'Lato';
    font-weight: 200;
    box-shadow: rgb(0 0 0 / 25%) 0px 54px 55px, rgb(0 0 0 / 12%) 0px -12px 30px, rgb(0 0 0 / 12%) 0px 4px 6px, rgb(0 0 0 / 17%) 0px 12px 13px, rgb(0 0 0 / 9%) 0px -3px 5px;
}

.navigate-container {
    text-align: center;
    display: flex;
    position: relative;
    height: 20%;
    width: 100%;
    z-index: 999;
}

a.goNext {
    text-decoration: none;
    color: #00000075;
    width: 100%;
}

.clickNext {
    font-style: italic;
    font-weight: 700;
}


@keyframes pulseText {
    0% {
        transform: scale(0.95);
    }

    70% {
        transform: scale(1);
    }

    100% {
        transform: scale(0.95);
    }
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
}

.hex-entity-scatter {
    height: 75%;
}

.cooccurr-info-header {
    height: 59%;
}

.toolTipStyle {
    text-align: center;
}

p.next {
    text-align: center;
}

.bold{
    font-weight: 800;
}

.introTutorial{
  margin-bottom: 2%;
  padding-bottom: 2%;
  border-bottom: 2px solid #b7b7b7;
}

p.tutorialInstructions {
    font-style: italic;
    margin-bottom: 2%;
}

</style>