<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import Divider from "primevue/divider"

/**
 * libraries
 */
import * as vue from "vue"
import {Ref, ref} from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

/**
 * types
 */
import * as typeUtils from "../types"

/**
 * vue components
 */
import HexCooccurrence from "../components/HexCooccurrence.vue";
import EntityInfoView from "../components/EntityInfoView.vue";
import TopicBars from "../components/TopicBars.vue";

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

/**
 * left & right section width (percentage)
 */
const left_section_size = 83 
const right_section_size = vue.computed(() => 100-left_section_size)


const server_address = vue.inject("server_address")

/**
 * data
 */
const data_fetched: Ref<boolean> = ref(false)



vue.onMounted(async () => {
    const target_entity: string = route.params.entity as string
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

async function handleHexClicked({target, co_occurr_entity}, view) {
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
            setCooccurrEntity(cooccurr_entity)

        })
}
</script>
<template>
    <Splitter class="splitter-outmost">
        <SplitterPanel id="hexview_section" class="hexview-section flex align-items-center justify-content-center" :size="left_section_size" :min-size="left_section_size" >
            <div class="hexview-grid-container">
                <div class="hexview-grid-cell-container"
                    v-if="data_fetched"
                    v-for="view, index in hexview_grid">
                    <HexCooccurrence
                        class="compare-co-hexview"
                        :title="view.title"
                        :id="`compare-co-hex-${index}`"
                        :entity_cooccurrences="view.data"
                        :segmentation="segmentation"
                        v-on:hex-clicked="handleHexClicked($event, view)">
                    </HexCooccurrence>
                    <img :src="`../src/assets/${view.title.split('-')[2]}.png`"
                        class="journal-image" />
                </div>
            </div>
        </SplitterPanel>    
        <SplitterPanel id="entity_info_section" class="entity-info-section flex align-items-center justify-content-center" :size="right_section_size" >
            <div class="entity-info-container">
                <div class="target-cooccurr-container">
                <EntityInfoView
                    v-if="selected_entity"
                    title="Target Entity"
                    :entity_info="selected_entity">
                </EntityInfoView>
                <Divider v-if="selected_cooccurr_entity" layout="vertical"></Divider>
                <EntityInfoView
                    v-if="selected_cooccurr_entity"
                    title="Co-occurr Entity"
                    :entity_info="selected_cooccurr_entity">
                </EntityInfoView>
                </div>
                <div class="topic-bar-container">
                <TopicBars
                    v-if="selected_entity"
                    id="cooccurr_topic_bars"
                    :targetTopicBins="selected_entity?.articles_topic_dict"
                    :cooccurrTopicBins="selected_cooccurr_entity?.articles_topic_dict"
                ></TopicBars>
                </div>
                <router-link v-if="selected_cooccurr_entity" :to="{ name: 'inspection', params: { entity: selected_entity.name, outlet:selected_entity.outlet }}">Next Stage</router-link>
            </div>

        </SplitterPanel>
    </Splitter>
</template>

<style scoped>
.splitter-outmost {
  width: 99vw;
  height: 98vh;
  display: flex;
}
:deep(.p-divider.p-divider-vertical::before) {
  border-left: 1px solid #dee2e6 !important;
}

.hexview-grid-container {
    display: grid;
    aspect-ratio: 3/2;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);  
    gap: 0;
    width: 100%;
    height: 100%;
}
.hexview-grid-cell-container {
  overflow: hidden;
}
.target-cooccurr-container {
  display: flex;
}

.utilities-container {
    margin-left: 10px
}
.entity-info-container {
    margin-left: 10px
}
.compare-co-hexview {
    z-index:1
}
.journal-image {
    position:absolute;
    width: 100px;
    bottom: 0px;
}
</style>