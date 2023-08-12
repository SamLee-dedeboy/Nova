<script setup lang="ts">
/**
 * primevue components
 */
import Splitter from 'primevue/splitter';
import SplitterPanel from "primevue/splitterpanel"



/**
 * libraries
 */
import * as vue from "vue"
import { Ref, ref } from 'vue'
import { useUserDataStore } from '../store/userStore'
import { useRouter, useRoute } from 'vue-router'
import introJS from 'intro.js'

/**
 * types
 */
import { Article } from "../types"

/**
 * vue components
 */
import ArticleView from "../components/ArticleView.vue";
import ArticleAnalysis from "../components/ArticleAnalysis.vue";
import HexCooccurrence from "../components/HexCooccurrence.vue"
import ProgressiveDialog from "../components/ProgressiveDialog.vue"
import NoteEditor from '../components/NoteEditor.vue';

const store = useUserDataStore()
const route = useRoute()
const router = useRouter()

const left_section_size = 60
const right_section_size = vue.computed(() => 100 - left_section_size)
const server_address = vue.inject("server_address")
const data_fetched: Ref<boolean> = ref(false)

const selected_outlet: any = route.params.outlet
const selected_entity = vue.computed(() => store.selected_entity)
const setEntity = (entity) => store.setEntity(entity)
const selected_cooccurr_entity = vue.computed(() => store.selected_cooccurr_entity)
const setCooccurrEntity = (cooccurr_entity) => store.setCooccurrEntity(cooccurr_entity)
const user_hex_selection = vue.computed(() => store.hex_selection[selected_outlet][selected_entity.value.name])
const segmentation = vue.computed(() => store.segmentation)
const notes = vue.computed(() => store.notes[selected_outlet]?.[selected_entity.value])
const setNotes = (content) => (store.setNotes(content, selected_outlet, selected_entity.value.name))
const inspection_hexview = vue.computed(() => store.inspection_hexview)
const highlight_hex_entity: Ref<string> = ref("")

const selected_article: Ref<Article> = ref()
const target_articles: Ref<Article[]> = ref([])
const target_article_highlights: Ref<any> = ref({})
const article_view = ref(null)
const article_content_view = ref(null)
const article_selected = ref(false)

const note_editor = ref(null)
const firstAccess = vue.computed(() => store.inspection_first_access)
const setFirstAccess = (value) => (store.setInspectionFirstAccess(value))

vue.onMounted(() => {
    prepare_data()
})

function handleNoteUpdated(noteHTMLContent) {
    setNotes(noteHTMLContent)
    vue.nextTick(() => {
        const references = document.querySelectorAll(".noteReference")
        console.log({references})
        references.forEach(reference_element => {
            reference_element.addEventListener("click", async function(e) {
                console.log("reference clicked", (e.target as HTMLElement).getAttribute("sentence_index"))
                const sentence_index = (e.target as HTMLElement).getAttribute("sentence_index")
                const doc_id = parseInt((e.target as HTMLElement).getAttribute("doc_id"))
                console.log({sentence_index, doc_id})
                // check if the article is already loaded
                if(doc_id != selected_article.value.id) {
                    await fetch(`${server_address}/processed_data/ids_to_articles`, {
                        method: "POST",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            no_content: false,
                            article_ids: [doc_id],
                        })
                    })
                    .then(res => res.json())
                    .then(articles => {
                        selected_article.value = articles[0]
                        vue.nextTick(() => article_content_view.value.scrollToSentence(sentence_index))
                    })
                } else {
                    article_content_view.value.scrollToSentence(sentence_index)
                }
            })
        })
    })
}

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
            console.log("articles", target_articles.value)
            article_view.value.handleArticleClicked(undefined, article_ids[0])
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
            console.log("highlights fetched", json)
            target_article_highlights.value = json
        })
}

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

function handleSentenceClicked(sentence, sentence_index, doc_id) {
    console.log("sentence clicked")
    note_editor.value.addReference(sentence, sentence_index, doc_id)
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
                // sst_ratio: inspection_hexview.value.data.target.sst
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

function goToOverview() {
    router.push({ name: "home" })
}

function toggleTutorial() {
    setFirstAccess(false)
    introJS().setOptions({
        showProgress: true,
        steps: [
            {
                title: "Lists of articles",
                element: document.querySelector('.article-cards-container'),
                intro: `
                    We present all the related articles that we collected here,
                    splitted into positive-leaning and negative-leaning ones.
                `
            },
            {
                title: "Article headline",
                element: document.querySelector('.article-card'),
                intro: `
                    This is the headline of one article. Important entities are colored in yellow.
                    <br>
                    Click on the headline to read the full article.
                `
            },
            {
                title: "Full Article",
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
                `
            },
            {
                title: "Click for more!",
                element: document.querySelector('.hexview-container'),
                intro: `
                    Your hive vs. data suggested hive is kept here for your record.
                    The blurry ones in yours are the ones that you did not pick.
                    <br>
                    Clicking on any hexagon will allow you to see a different set of articles.
                `
            },
            {
                title: "Take Notes!",
                element: document.querySelector('.cooccurr-info-container'),
                intro: `
                    If you find anything interesting or contradictory to your previous belief,
                    document it here.
                `
            },
            {
                title: "A handy feature",
                // element: document.querySelector('#s-0'),
                element: document.querySelector('.summary'),
                intro: `
                    You can click on any sentence to add it to your notes.
                    They will be like references and you can add comments on them.
                `
            },
        ]
    }).start()

}
</script>

<template>
    <ProgressiveDialog
        v-if="firstAccess"
        @toggle-tutorial="toggleTutorial"
        header="Why does the data suggest differently?"
        :content="`
            No individual in the world can possibly read every single news article ever published.
            Our news reading experience is like peeking the universe through a small window.
            It is natural that what we saw is not the entire picture.
            <br>
            <br>
            NOVA is designed to help you see a bigger picture. 
            You have found that the data suggests differently on how 
            ${selected_outlet}
            reported on 
            ${selected_entity.name}`
            + (selected_cooccurr_entity? `and ${selected_cooccurr_entity?.name}</span>.` : `.`) 
            + `
            <br>
            The next question is: What articles did you miss? You might be surprised at what ${selected_outlet} reported.
            <br>
        `"
    ></ProgressiveDialog>
    <Splitter class="splitter-outmost" style="width: 100vw; height: 95vh; display: flex;">
        <SplitterPanel id="article_view_section"
            class="articleview-section flex align-items-center justify-content-center" :size="left_section_size"
            style="overflow: hidden; height:100%; display: flex !important; flex-direction: column !important;">
            <i v-if="!data_fetched" class="pi pi-spin pi-spinner" 
            style="position:absolute;
                left: 45%;
                top: 30%;
                font-size: 3rem;
                z-index: 1000">
            </i>
            <h2 class="component-header article-view-header" 
                style="
                    display: flex; 
                    align-items: center; 
                    background: #f7f7f7; 
                    margin: 0%; 
                    padding: 0.5%;
                "
            >
                <span> Articles on {{selected_entity?.name.replaceAll("_"," ")}} </span>
                <span v-if="selected_cooccurr_entity">
                &thinsp;
                    <span> & {{selected_cooccurr_entity?.name.replaceAll("_"," ")}} </span>
                </span>
                &thinsp;
                by
                &thinsp;
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
                <div class="tutorial-toggle-container" style="display:inline; margin-left:auto">
                    <Button severity="secondary" text raised @click="toggleTutorial" style="width:fit-content;font-family:Trebuchet MS"> Tutorial </Button>
                </div>
            </h2>
            <!-- <i v-if="!data_fetched" class="pi pi-ellipsis-h" style="position:absolute; left: 50%; top: 50%;font-size: 3rem; z-index: 1000"/> -->
            <ArticleView class="article-view-container" v-model:sst_threshold="segmentation"
                ref="article_view"
                :articles="target_articles" 
                :article_highlights="target_article_highlights"
                @article-selected="(article) => { selected_article=article; article_selected=true }"
                :entity_pair="[selected_entity?.name as string, selected_cooccurr_entity?.name as string]">
            </ArticleView>
            <div class="hexview-note-container" style="display: flex; margin-top: 1%; overflow: hidden">
                <div class="hexview-container" style="display: flex; width: 100%;">
                    <div class="user-hexview-container" style="width: 100%">
                        <div class="hive-header user-hive-header" style="left: 47%">Your belief </div>
                        <HexCooccurrence v-if="data_fetched" class="inpection-user-hexview" 
                            :id="`inspection_user_hexview`" :entity_cooccurrences="inspection_hexview.data"
                            mode="user-fixed"
                            :p_margin="{top:0, right:0, bottom:0, left:0}"
                            :segmentation="segmentation" :highlight_hex_entity="highlight_hex_entity"
                            :show_blink="true"
                            :show_label="true"
                            :user_hex_selection="user_hex_selection"
                            @hex-clicked="handleHexClicked">
                        </HexCooccurrence>
                        </div>
                    <div class="data-hexview-container" style="width: 100%">
                        <div class="hive-header data-hive-header" style="left: 31%">Data suggested</div>
                        <HexCooccurrence v-if="data_fetched" class="inpection-data-hexview" 
                            :id="`inspection_data_hexview`" :entity_cooccurrences="inspection_hexview.data"
                            mode="data"
                            :p_margin="{top:0, right:0, bottom:0, left:0}"
                            :segmentation="segmentation" :highlight_hex_entity="highlight_hex_entity"
                            :show_blink="true"
                            :show_label="true"
                            :show_hex_appear="false"
                            :user_hex_selection="user_hex_selection"
                            @hex-clicked="handleHexClicked">
                        </HexCooccurrence>
                    </div>
                </div>
                <div v-if="data_fetched" class="cooccurr-info-container" style="display: flex; flex-direction: column; font-size: 0.8rem;">
                    <div class=journal-icon-container style="display: flex; padding-left: 2%;">
                        <div :class="['journal-style']">
                            <img :src="`/squared/${selected_outlet}.png`"
                                :class="['journal-image',`${outletIconStyle(selected_outlet)}`]" />
                        </div>
                        <div class="journal-info-container" style="font-size:0.7rem; z-index:99; display: flex; align-items: center;">
                            <span> Did you change your mind on {{ selected_outlet }}?  Write down your thoughts!  </span>
                        </div>
                    </div>
                    <div class="notes" 
                        style="
                            width: 100%;
                            height: 100%;
                            padding-bottom: 3%;
                            display: flex;
                            flex-direction: column;
                            overflow: hidden;
                        ">
                        <h2 class="component-header notes-header">
                            Notes
                            <i class='pi pi-info-circle tooltip'>
                                <span class="tooltiptext right-tooltiptext" style="width: 145px">
                                    <!-- Write down any hypothesis or questions you have.
                                    The system will document that for you. -->
                                    We will record the text you put here for academic user stuy.
                                    We do not collect any other information from you.
                                </span>
                            </i>
                        </h2>
                        <NoteEditor ref="note_editor" class="notes-style" style="width: 100%; height: 100%" @update="handleNoteUpdated" :initial_content="notes?.[selected_outlet]"></NoteEditor>
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
        <SplitterPanel id="article_content_section" class="article-content-panel flex align-items-center justify-content-center"
            style="overflow: hidden;"
            :size="right_section_size">
            <div class="article-content-container" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
                <ArticleAnalysis class="article-analysis-panel"
                    ref="article_content_view"
                    :entity_pair="[selected_entity?.name as string, selected_cooccurr_entity?.name as string]"
                    :selected_article="selected_article"
                    :article_highlights="target_article_highlights"
                    @sentence-clicked="handleSentenceClicked"
                    >
                </ArticleAnalysis>
            </div>
        </SplitterPanel>
    </Splitter>

</template>
<style scoped lang="scss">
// divider style 
:deep(.p-divider.p-divider-vertical::before) {
    border-left: 1px solid #dee2e6 !important;
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
.hive-header {
  align-content: center;
  display: flex;
  justify-content: center;
  font-size: larger;
  font-weight: lighter;
  position: absolute;
}

:deep(.p-button) {
    padding: 0.1rem 1rem;
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

.component-header.notes-header {
    background: #f7f7f7;
    margin: 3% 1% 1% 0%;
    padding-left: 2%;
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
    // width: 50px;
    height: 80px;
    // overflow: hidden;
    border-radius: 50%;
    // border: #d7d7d7 1px solid;
    display: flex;
    justify-content: center;
    align-items: center;
    // bottom: 10%;
    // left: 2%;
}

.journal-image {
    height: 100%;
    display: inline;
    margin: 0 auto;
    width: auto;
}
.disable {
    pointer-events: none;
    opacity: 0.4;
}

:deep(.noteReference) {
    cursor: pointer;
    border: 1px solid grey;
    border-radius: 5px;
    padding-left: 3px;
    font-family: "Trebuchet MS";
}
:deep(.noteReference:hover) {
    background-color: rgba(45, 45, 45, 0.2)
}
</style>