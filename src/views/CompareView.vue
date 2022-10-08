<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import Divider from "primevue/divider"
import Textarea from 'primevue/textarea';


/**
 * libraries
 */
import * as vue from "vue"
import { Ref, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

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

const route = useRoute()
const store = useStore()
/**
 * vuex store objects
 */
const segmentation = vue.computed(() => store.state.segmentation)
const setSegmentation = (segmentation) => store.commit("setSegmentation", segmentation)
const selected_entity = vue.computed(() => store.state.selected_entity)
const setEntity = (entity) => store.commit("setEntity", entity)
const selected_cooccurr_entity = vue.computed(() => store.state.selected_cooccurr_entity)
const setCooccurrEntity = (cooccurr_entity) => store.commit("setCooccurrEntity", cooccurr_entity)
const clicked_hexview = vue.computed(() => store.state.clicked_hexview)
const setClickedHexView = (hexview) => store.commit("setClickedHexView", hexview)
const hexview_grid = vue.computed(() => store.state.hexview_grid)
const setHexViewGrid = (grid) => store.commit("setHexViewGrid", grid)
const outlet_weight_dict = vue.computed(() => store.state.outlet_weight_dict)

const notes = vue.computed(() => store.state.notes)
const setNotes = (notes) => store.commit("setNotes", notes)

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
    const target_entity: string = route.params.entity as string
    const cooccurr_entity = route.params.cooccurr_entity as string
    const promiseArray: any[] = []
    promiseArray.push(new Promise((resolve) => {
        fetch(`${server_address}/hexview/grouped/${target_entity}`)
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
                resolve("success")
            })
    }))
    await Promise.all(promiseArray)
        .then(res => {
            data_fetched.value = true
            console.log("all fetched")
        })
})

async function handleHexClicked({ target, co_occurr_entity }, view) {
    const entity = target.split("-")[0]
    const outlet = target.split("-")[1]
    setClickedHexView(view)
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
}
</script>

<template>
    <Splitter class="splitter-outmost">
        <SplitterPanel id="hexview_section" class="hexview-section flex align-items-center justify-content-center"
            :size="left_section_size" :min-size="left_section_size">
            <div v-if="selected_entity?.outlet ==='Overall'" class="reminder-click-hex">
                Click any hexagon on the left to continue to next stage.
            </div>

            <div v-if="selected_entity?.outlet !== 'Overall'" class="navigate-container">
                <router-link class="goNext" :to="{ name: 'inspection', params: { entity: selected_entity?.name || 'undefined' }}">Next
                    Stage</router-link>
            </div>
            <h2 class="component-header hexview-grid-header">
                Topic Co-occurrences Hive of
                <span> {{ route.params.entity }} </span>
                &nbsp
                <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 500px">
                        Each hive represents the coverage on {{ selected_entity?.name }} by that outlet. <br />
                        A hexagon is left blanked if the outlet does not cover that topic. <br />
                        Try to discover outlet coverage differences and common grounds.
                    </span>
                </i>
            </h2>
            <div class="hexview-grid-container">
                <div class="hexview-grid-cell-container" v-if="data_fetched" v-for="view, index in hexview_grid">
                    <HexCooccurrence class="compare-co-hexview" :title="view.title" :id="`compare-co-hex-${index}`"
                        :entity_cooccurrences="view.data" :segmentation="segmentation"
                        v-on:hex-clicked="handleHexClicked($event, view)">
                    </HexCooccurrence>
                    <img :src="`../src/assets/${view.title.split('-')[2]}.png`" class="journal-image" />
                </div>
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
                        <!-- <div class="num_of_articles">
                            #articles about 
                            <span style="font-weight:bolder"> {{selected_entity.name}} </span>
                            <span v-if="selected_cooccurr_entity"> 
                            and 
                            <span style="font-weight:bolder">
                                {{selected_cooccurr_entity.name}}
                            </span> 
                            </span>
                            is {{ selected_cooccurr_entity? selected_cooccurr_entity.num_of_mentions : selected_entity.num_of_mentions }}
                        </div>
                        <Divider layout="vertical"></Divider> -->
                        <ul class="entity-info-section">
                            <li> Main topic: {{ selected_entity.name }} </li>
                            <li v-if='selected_cooccurr_entity'> Co-occur topic: {{ selected_cooccurr_entity.name }}
                            </li>
                            <li> Media outlet: {{selected_entity.outlet === 'Overall'? "Not selected":selected_entity.outlet}}</li>
                        </ul>
                    </div>
                    <!-- <EntityInfoView
                    v-if="selected_entity"
                    title="Target Entity"
                    :entity_info="selected_entity">
                </EntityInfoView>
                <Divider v-if="selected_cooccurr_entity" layout="vertical"></Divider>
                <EntityInfoView
                    v-if="selected_cooccurr_entity"
                    title="Co-occurr Entity"
                    :entity_info="selected_cooccurr_entity">
                </EntityInfoView> -->
                </div>
                <div class="topic-bar-container" v-if="selected_entity">
                    <TopicBars id="cooccurr_topic_bars" :targetTopicBins="selected_entity?.articles_topic_dict"
                        :cooccurrTopicBins="selected_cooccurr_entity?.articles_topic_dict"></TopicBars>
                </div>
                <div class="legend-utils" v-if="selected_entity">
                    <h2 class="component-header legend-header">
                        Coverage Sentiment
                        <!-- <i class='pi pi-info-circle tooltip'>
                            <span class="tooltiptext right-tooltiptext" style="width: 120px;">
                                The sentiments have four categories as listed. <br/>
                                A mixed sentiment means the topic has lots of positive and negative articles at the same time. 
                            </span>
                        </i> -->
                    </h2>
                    <Legend v-if="selected_entity" id="segment_legend" class="segment-legend"
                        :color_dict="SstColors.hive_color_dict" :filter="true"></Legend>
                </div>
                <div class="notes-section" v-if="selected_entity">
                    <h2 class="component-header notes-header">
                        Notes
                        <i class='pi pi-info-circle tooltip'>
                            <span class="tooltiptext right-tooltiptext" style="width: 145px">
                                Write down any hypothesis or questions you have.
                                The system will document that for you.
                            </span>
                        </i>
                    </h2>
                    <Textarea class="notes-style" :model-value="notes" @update:model-value="setNotes"/>

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

.notes-style{
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

.journal-image {
    position: absolute;
    width: 100px;
    bottom: 0px;
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
}

.cooccurr-info-content {
    display: flex;
}

.entity-info-section {
    padding-left: 1%;
    margin-left: 6%;
}

// ---------------------
// legend section
// ---------------------
.legend-utils {
    margin: 1%;
    display: flex;
    flex-direction: column;
}

.segment-legend {
    width: 60%;
}

.notes-section {
    margin-left: 1%;
    flex: 1 1 0;
}

:deep(p-inputtextarea) {
    height: 50%;
}

.reminder-click-hex {
    width: 16%;
    text-align: center;
    display: flex;
    height: 5%;
    font-size: 1em;
    position: absolute;
    top: 1.25%;
    right: 1%;
    z-index: 999;
    box-shadow: 0 0 0 0 rgb(0 0 0);
    transform: scale(1);
    animation: pulse-b28f3840 2s infinite;
}

.navigate-container {
    text-align: center;
    display: flex;
    position: absolute;
    height: 5%;
    width: 7%;
    top: 1.25%;
    right: 1%;
    z-index: 999;

    box-shadow: 0 0 0 0 rgba(0, 0, 0, 1);
    transform: scale(1);
    animation: pulse 2s infinite;
}

a.goNext {
    text-decoration: none;
    margin: 10%;
    color: #4caaf5;
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
</style>