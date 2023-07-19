<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"
import Dialog from 'primevue/dialog';


/**
 * libraries
 */
import * as vue from "vue"
import { Ref, ref } from 'vue'
import { useUserDataStore } from '../store/userStore'
import { useRoute } from 'vue-router'
import * as d3 from 'd3'
import introJS from 'intro.js'

/**
 * types
 */
import { Article, SentimentType, Constraint } from "../types"

/**
 * vue components
 */
import ArticleView from "../components/ArticleView.vue";
import ArticleAnalysis from "../components/ArticleAnalysis.vue";
import HexCooccurrence from "../components/HexCooccurrence.vue"

const store = useUserDataStore()
const route = useRoute()

const left_section_size = 60
const right_section_size = vue.computed(() => 100 - left_section_size)
const server_address = vue.inject("server_address")
const data_fetched: Ref<boolean> = ref(false)

const selected_outlet: any = route.params.outlet
const selected_entity = vue.computed(() => store.selected_entity)
const setEntity = (entity) => store.setEntity(entity)
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity)
const setCooccurrEntity = (cooccurr_entity) => store.setCooccurrEntity(cooccurr_entity)
const segmentation = vue.computed(() => store.segmentation)
const setNotes = (e) => (store.setNotes(e.target.value, selected_outlet))
const original_segmentation = segmentation.value
const clicked_hexview = vue.computed(() => store.clicked_hexview)
const highlight_hex_entity: Ref<string> = ref("")
const user_hex_selection = vue.computed(() => store.hex_selection) 
// const setClickedHexView = (hexview) => store.setClickedHexView(hexview)
// const hexview_grid = vue.computed(() => store.hexview_grid)

// const selected_outlet: Ref<string> = ref("ABC News")
const selected_article: Ref<Article> = ref()
const target_articles: Ref<Article[]> = ref([])
const target_article_highlights: Ref<any> = ref({})
const article_view = ref(null)
const showTutorial_I = ref(true)

vue.onMounted(() => {
    prepare_data()
})

const journal_options = [
    "CNN",
    "FoxNews",
    "Breitbart",
    "ABC News",
    "New York Times",
    "Washington Post"
]

async function prepare_data() {
    const cooccurr_entity_name = selected_cooccurr_entity.value? selected_cooccurr_entity.value.name : selected_entity.value.name
    await fetch_cooccurr_info(selected_outlet, selected_entity.value.name, cooccurr_entity_name)
    //console.log(selected_entity.value)
    const article_ids = selected_cooccurr_entity.value?.article_ids || selected_entity.value.article_ids
    console.log({article_ids})
    // const article_ids = article_ids_w_sentiment.map(obj => obj.article_id)
    highlight_hex_entity.value = selected_cooccurr_entity.value?.name
    // setSegmentation(selected_entity.value.sst_ratio)
    // selected_outlet.value = selected_entity.value.outlet
    const promiseArray: any[] = []
    promiseArray.push(new Promise(async (resolve) => {
        fetch_articles(article_ids).then(
            resolve("success")
        )
    }))
    promiseArray.push(new Promise(async (resolve) => {
        fetch_article_highlights(article_ids).then(
            resolve("success")
        )
    }))
    await Promise.all(promiseArray)
}

async function fetch_articles(article_ids) {
    await fetch(`${server_address}/processed_data/ids_to_articles`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            no_content: true,
            article_ids: article_ids,
        })
    })
        .then(res => res.json())
        .then(json => {
            target_articles.value = json
            console.log("articles", target_articles.value.length)
            data_fetched.value = true
        })
}

async function fetch_article_highlights(article_ids) {
    await fetch(`${server_address}/processed_data/ids_to_articles_highlights`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(article_ids)
    })
        .then(res => res.json())
        .then(json => {
            //console.log("highlights fetched", json)
            target_article_highlights.value = json
        })
}

// async function handleChangeJournal(e) {
//     // const outlet = e.target.value
//     const outlet = e.value
//     // selected_outlet.value = outlet
//     const entity = selected_entity.value.name
//     const co_occurr_entity = selected_cooccurr_entity.value?.name
//     const view = hexview_grid.value.find(view => view.title.split("-")[2] === outlet)
//     setClickedHexView(view)
//     await fetch_cooccurr_info(outlet, entity, co_occurr_entity)
//     prepare_data()
//     // selectedCategory.value = undefined
// }

async function handleHexClicked({ clickedEntity }, view) {
    if(clickedEntity === selected_entity.value.name) {
        setCooccurrEntity(undefined)
    } else {
        highlight_hex_entity.value = clickedEntity
    }
    const entity = selected_entity.value.name
    const outlet = selected_outlet
    await fetch_cooccurr_info(outlet, entity, clickedEntity)
    prepare_data()
}

async function fetch_cooccurr_info(outlet, entity, co_occurr_entity) {
    await fetch(`${server_address}/processed_data/cooccurr_info/grouped/${outlet}/${entity}/${co_occurr_entity}`)
        .then(res => res.json())
        .then(json => {
            console.log("cooccurr_info fetched", json)
            const target_entity = {
                name: json.target,
                outlet: outlet,
                article_ids: json.target_article_ids,
                // num_of_mentions: json.target_num,
                // articles_topic_dict: json.target_articles_topic_dict,
                // sst_ratio: clicked_hexview.value.data.target.sst
            }
            setEntity(target_entity)
            const cooccurr_entity = {
                target: json.target,
                name: json.cooccurr_entity,
                outlet: outlet,
                article_ids: json.cooccurr_article_ids,
                // num_of_mentions: json.cooccurr_num,
                // target_num_of_mentions: json.target_num_of_mentions,
                // articles_topic_dict: json.cooccurr_articles_topic_dict,
            }
            setCooccurrEntity(cooccurr_entity)
        })
}

function outletIconStyle(name:string){
    let className = name.replaceAll(' ','-') + '-icon';
    className = (className.includes("FoxNews") || className.includes("Breitbart")) ? className : 'icon';
    return className;
}

function toggleTutorial(e: MouseEvent) {
    showTutorial_I.value = false
    introJS().setOptions({
        showProgress: true,
        steps: [
            {
                element: document.querySelector('.article-cards-container'),
                intro: `
                    We present all the related articles that we collected here,
                    splitted into positive-leaning and negative-leaning ones.
                `
            },
            {
                element: document.querySelector('.article-card'),
                intro: `
                    This is the headline of one article. Important entities are colored in yellow.
                    <br>
                    Click on the headline to read the full article.
                `
            },
            {
                element: document.querySelector('.analysis-container'),
                intro: `
                    Once an article is clicked, the full article will be shown on the right hand side.
                    <br>
                    Related entities are highlighted by
                    <svg width=20 height=10> 
                        <rect x=0 y=0 width=20 height=10 fill="#f4c49c" />
                    </svg>
                    ,
                    <svg width=20 height=10> 
                        <rect x=0 y=0 width=20 height=10 fill="#baf0f5" />
                    </svg>,
                    or
                    <svg width=20 height=10> 
                        <rect x=0 y=0 width=20 height=10 fill="#dddddd" />
                    </svg>,
                    which means the sentence is talking 
                    <span style="background-color: #f4c49c">positively</span>,
                    <span style="background-color: #baf0f5">negatively</span>, or
                    <span style="background-color: #dddddd">neutrally</span> about the entity.
                    <br>
                    If you did not click an article in the previous step, hit 'back' and click it.
                `
            },
            {
                element: document.querySelector('.hexview-container'),
                intro: `
                    Your hive vs. data suggested hive is kept here for your record.
                    The blurry ones in yours are the ones that you did not pick.
                    Clicking on any hexagon will allow you to see a different set of articles.
                `
            },
            {
                element: document.querySelector('.cooccurr-info-content'),
                intro: `
                    If you find anything interesting or contradictory to your previous belief,
                    document it here.
                `
            },
        ]
    }).start()

}
</script>

<template>
    <Dialog v-model:visible="showTutorial_I" class="tutorialStyle" position="center" :modal="true">
        <template #header>
            <h3> <i class="pi pi-compass" /> Why does the data suggest differently? </h3>
        </template>

        <p class="introTutorial">
            No individual in the world can possibly read every single news ever published.
            Our news reading experience is like peeking the universe through a small window.
            It is natural that what we saw is not the entire picture.
            <br>
            <br>
            NOVA is designed to help you see a bigger picture. 
            You have found that the data suggests differently on how 
            {{ selected_outlet }} 
            reported on 
            {{ selected_entity.name }}
            <span v-if="selected_cooccurr_entity"> and {{ selected_cooccurr_entity.name }}</span>.
            <br>
            The next question is: What articles are out of your expectation? 
            <br>

        </p>
        <template #footer>
            <Button label="Ready" icon="pi pi-check" @click="toggleTutorial" autofocus />
        </template>
    </Dialog>
    <Splitter class="splitter-outmost">
        <SplitterPanel id="article_view_section"
            class="articleview-section flex align-items-center justify-content-center" :size="left_section_size">
            <i v-if="!data_fetched" class="pi pi-spin pi-spinner" 
            style="position:absolute;
                left: 45%;
                top: 30%;
                font-size: 3rem;
                z-index: 1000">
            </i>
            <h2 class="component-header article-view-header">
                Articles on
                <span> {{selected_entity?.name.replaceAll("_"," ")}} </span>
                <span v-if="selected_cooccurr_entity">
                    &
                    <span> {{selected_cooccurr_entity?.name.replaceAll("_"," ")}} </span>
                </span>
                by
                <span> {{selected_outlet}}</span>
                <!-- <span> {{selected_outlet}}</span> -->
                &nbsp
                <i class='pi pi-info-circle tooltip'>
                    <span class="tooltiptext right-tooltiptext" style="width: 400px">
                        Below are the articles of the selected topics published by {{ selected_entity?.outlet }}. <br />
                        Click the plus button to expand and see a summary of the article. <br />
                        Use the Mark button to mark any interesting articles you find. <br />
                    </span>
                </i>
            </h2>
            <!-- <i v-if="!data_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/> -->
            <ArticleView class="article-view-container" v-model:sst_threshold="segmentation"
                ref="article_view"
                :articles="target_articles" 
                :article_highlights="target_article_highlights"
                @article-selected="(article) => selected_article=article"
                :entity_pair="[selected_entity?.name as string, selected_cooccurr_entity?.name as string]">
            </ArticleView>
            <div class="hexview-note-container">
                <div class="hexview-container">
                    <div class="user-hexview-container">
                        <div class="hive-header user-hive-header">Your belief </div>
                        <HexCooccurrence v-if="data_fetched" class="inpection-user-hexview" :title="clicked_hexview.title"
                            :id="`inspection_user_hexview`" :entity_cooccurrences="clicked_hexview.data"
                            mode="user-fixed"
                            :p_margin="{top:0, right:0, bottom:0, left:0}"
                            :segmentation="original_segmentation" :highlight_hex_entity="highlight_hex_entity"
                            :show_blink="true"
                            :show_label="true"
                            :wider_border="true"
                            :user_hex_selection="user_hex_selection[selected_outlet]"
                            @hex-clicked="handleHexClicked">
                        </HexCooccurrence>
                        </div>
                    <div class="data-hexview-container">
                        <div class="hive-header data-hive-header">Data suggested</div>
                        <HexCooccurrence v-if="data_fetched" class="inpection-data-hexview" :title="clicked_hexview.title"
                            :id="`inspection_data_hexview`" :entity_cooccurrences="clicked_hexview.data"
                            mode="data"
                            :p_margin="{top:0, right:0, bottom:0, left:0}"
                            :segmentation="original_segmentation" :highlight_hex_entity="highlight_hex_entity"
                            :show_blink="true"
                            :show_label="true"
                            @hex-clicked="handleHexClicked">
                        </HexCooccurrence>
                    </div>
                </div>
                <div v-if="data_fetched" class="cooccurr-info-content">
                    <div class=journal-icon-container>
                        <div :class="['journal-style']">
                            <img :src="`/${selected_outlet}.png`"
                                :class="['journal-image',`${outletIconStyle(selected_outlet)}`]" />
                        </div>
                        <div class="journal-info-container" style="font-size:small; z-index:99;">
                            <!-- <Dropdown :modelValue="selected_outlet" :options="journal_options"
                                placeholder="Select an journal" @change="handleChangeJournal" /> -->
                            {{  selected_outlet }}
                        </div>
                    </div>
                    <!-- <div class="num_of_articles">
                        A total of  {{ selected_cooccurr_entity? selected_cooccurr_entity.article_ids.length :
                            selected_entity.article_ids.length }}
                            articles are found related to
                        <span style="font-weight:bolder" :title="selected_entity?.name"> {{selected_entity?.name.replaceAll("_"," ")}}
                        </span>
                        <span v-if="selected_cooccurr_entity">
                            and
                            <span style="font-weight:bolder" :title="selected_cooccurr_entity.name">
                                {{selected_cooccurr_entity.name.replaceAll("_"," ")}}
                            </span>
                        </span>
                     </div> -->
                    <div class="notes" >
                        <h2 class="component-header notes-header">
                            Notes
                            <i class='pi pi-info-circle tooltip'>
                                <span class="tooltiptext right-tooltiptext" style="width: 145px">
                                    Write down any hypothesis or questions you have.
                                    The system will document that for you.
                                </span>
                            </i>
                        </h2>
                        <textarea class="notes-style"
                        :value="notes"
                        placeholder="Write down any thoughts you have..." 
                        @input="setNotes" />
                    </div>
                </div>
                <svg style='position:absolute;pointer-events:none'>
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
                <div class="target-cooccurr-container">
                </div>
                <ArticleAnalysis class="article_analysis_panel"
                    :entity_pair="[selected_entity?.name as string, selected_cooccurr_entity?.name as string]"
                    :selected_article="selected_article"
                    :article_highlights="target_article_highlights">
                </ArticleAnalysis>

            </div>
        </SplitterPanel>
    </Splitter>

</template>
<style scoped lang="scss">
// ---------------------
// css for split-panel layout
// ---------------------
.splitter-outmost {
    width: 100vw;
    height: 95vh;
    display: flex;
}

.entity-info-panel {
    overflow: hidden;
}

// divider style 
:deep(.p-divider.p-divider-vertical::before) {
    border-left: 1px solid #dee2e6 !important;
}

// ---------------------
// headers
// ---------------------

.article-view-header {
    background: #f7f7f7;
    margin: 0%;
    padding: 0.5%;
}

// ---------------------
// articlew view section
// ---------------------
.articleview-section {
  overflow: hidden;
  height: 100%;
  display: flex !important;
  flex-direction: column !important;
}

// ---------------------
// entity info section
// ---------------------
.target-cooccurr-container {
    display: flex;
    flex-direction: column;
    padding-left: 10px;
    padding-right: 10px;
    background: #f7f7f7;
    margin-left: 1%;
    margin-right: 1%;
    width: 100%;
}

:deep(.entity-info-view-container) {
    display: flex;
    flex-direction: column;
    align-content: center;
    width: 100%;
    justify-content: center;
    max-width: unset !important;
}

.entity-info-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.cooccurr-info-content {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    width: 40%;
}

.cooccurr-info-header {
    margin: 1.5%;
}

ol {
    padding-left: 10%;
}

li {
    white-space: pre;
}

:deep(.p-slider.p-component.p-slider-horizontal) {
    width: 50%;
    margin-left: 15px;
}

.entity-info-section {
    padding-left: 1%;
    flex: 2 1 0;
}

.num_of_articles {
    margin-left: 2%;
    font-size: 1rem;
}

// ---------------------
// Sentiment category selection section
// ---------------------
.selection-container {
    display: flex;
    align-items: center;
}

.slider-label {
    margin-left: 5px;
    // position:absolute;
    font-family: Lato;
    // left: 41.2%;
    // top: -10%;
}

:deep(.p-slider .p-slider-handle) {
    height: 0.8rem;
    width: 0.8rem;
}

:deep(.p-slider.p-slider-horizontal .p-slider-handle) {
    margin-top: -0.4rem;
    margin-left: -0.4rem;
}


// ---------------------
//  Hexview section
// ---------------------
.hexview-note-container {
    display: flex;
    margin-top: 1%;
    overflow: hidden;
}
.hexview-container {
    display: flex;
    width: 100%;
    margin-right: 2%;
}
.hive-header {
  align-content: center;
  display: flex;
  justify-content: center;
  font-size: larger;
  font-weight: lighter;
  position: absolute;
}

.user-hive-header {
  left: 47%;
}

.data-hive-header {
  left: 31%;
}

.user-hexview-container {
  width: 100%;
}
.data-hexview-container {
  width: 100%;
}


// ---------------------
// Constraints & Outlet Scatterplot Section
// ---------------------
.constraints-outlet-scatter-container {
    display: flex;
    //   justify-content: space-between;
    flex: 1 1 0;
    overflow: hidden;
    flex-direction: column;
}

.intensity-slider {
    width: 38% !important;
}

.constraint-table {
    font-size: 0.8rem;
}

.constraints-view {
    //   width: fit-content;
    background: #f7f7f7;
    //   flex: 1 1 0;
    margin-right: 1%;
}

:deep(.p-button) {
    padding: 0.1rem 1rem;
}

:deep(.p-buttonset, .p-button) {
    margin: 0.3rem 0rem;
}

:deep(.p-inputtext) {
    padding: 0.2rem 0.5rem;
}

:deep(.p-scrollpanel.p-component) {
    width: 100%;
}
:deep(.p-scrollpanel-bar-y) {
    background: #4d4e4f;
}

.question-container {
    display: flex;
    align-items: center;
    background: #f7f7f7;
    border-bottom: solid 1px #b7b7b7;
    font-family: "Lato";
    padding-left: 1%;
}


.component-header.notes-header {
    background: #f7f7f7;
    margin: 3% 1% 1% 0%;
    padding-left: 2%;
}

.notes {
  width: 100%;
  height: 100%;
  padding-bottom: 7%;
  display: flex;
  flex-direction: column;
}

.notes-style {
  width: 100%;
  height: 100%;
}

.document-container {
    display: flex;
    height: 100%;
    margin-left: 1%;
}

.marked-articles-header {
    margin: 1% 1% 0% 0%;
    background: #f7f7f7;
    padding-left: 1%;
}

.marked-articles-container {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.mark-table {
    font-size: 1rem;
    width: 100%;
    height: 100%;
    border: 1px solid black;
    border-collapse: collapse;
}

// td {
// border-bottom: solid 1px black;
// border-collapse: collapse;
// }

.markedTr {
    border: 1px solid #b7b7b7;
}



.journal-style.table-image {
    width: 34px;
    height: 34px;
    bottom: unset;
}
.journal-image-text-cell {
display: flex;
align-items: center;
height:100%;

}
.table-outlet-text {
  margin-left: 5%;
}
.conclusion-icon {
    font-size: 1.5em;
}
.conclusion-icon:hover::before {
    font-weight: 600;
}
.fair_icon {
    color: red;
}
.unfair_icon {
    color: blue;
}
.icon-description {
    font-size: 1rem;
    font-size: 1rem;
    font-family: 'Lato';
    font-weight: 200;
    box-shadow: rgb(0 0 0 / 25%) 0px 54px 55px, rgb(0 0 0 / 12%) 0px -12px 30px, rgb(0 0 0 / 12%) 0px 4px 6px, rgb(0 0 0 / 17%) 0px 12px 13px, rgb(0 0 0 / 9%) 0px -3px 5px;
}




.outlet-scatter-container {
    display: flex;
    /*! flex-direction: column; */
    background: #f7f7f7;
    height: 100%;
    flex: 1 1 0;
}

.outlet-scatter-header {
    // display: flex;
    // flex-direction: column;
    border-bottom: solid 1px #b7b7b7;
    margin: 0%;
    flex: 1 1 25%;
    padding-right: 0%;
}


.navigate-container {
    text-align: center;
    display: flex;
    position: absolute;
    height: 25%;
    width: 25%;
    top: 10%;
    right: 1%;
    z-index: 999;
    box-shadow: 0 0 0 0 rgb(0 0 0);
    transform: scale(1);
    animation: pulse-a39a231a 2s infinite;
}

a.goNext {
    text-decoration: none;
    margin: 1%;
    color: #4caaf5;
    width: 100%;
}


@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 #4caaf5;
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


.journal-style{
    width: 50px;
    height: 50px;
    position: relative;
    overflow: hidden;
    border-radius: 50%;
    border: #d7d7d7 3px solid;
    // bottom: 10%;
    // left: 2%;
}

.FoxNews-icon{
    height: 85%;
    right: 30%;
    bottom: 2%;
}

.Breitbart-icon{
    height: 65%;
    top: 20%;
    left: 10%;
}

.icon {
    height: 100%;
}

.journal-image {
  display: inline;
  margin: 0 auto;
  width: auto;
}
.journal-icon-container {
  display: flex;
  padding-left: 2%;
}
.journal-info-container {
//   width: fit-content;
//   right:0;
//   position: absolute;
    // white-space: nowrap;
    margin: 0.5rem 1rem;
}
</style>