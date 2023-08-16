<script setup lang=ts>
import ScrollPanel from 'primevue/scrollpanel'
import Panel from 'primevue/panel'
import * as vue from "vue"
import { Ref, ref } from 'vue'
import { Article } from "../types"
import { useUserDataStore } from '../store/userStore'
import * as ColorUtils from "./utils/ColorUtils"

const server_address = vue.inject("server_address")
const store = useUserDataStore()
const props = defineProps({
    entity_pair: Object as () => String[],
    selected_article: Object as () => Article,
    article_highlights: Object as () => any,
})

const emit = defineEmits(['sentence-clicked'])

const indexed_content: Ref<Any[]> = ref([])

vue.watch(() => props.selected_article, async () => {
    console.log("selected article changed!")
    document.querySelector('.scroll-panel').scrollTop = 0
    
    await splitArticleSentences(props.selected_article.content)
    // initAnalysisPanel(props.selected_article.id)
})

async function splitArticleSentences(content) {
    await fetch(`${server_address}/splitSentences`, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(content)
    })
        .then(res => res.json())
        .then(json => {
            indexed_content.value = json
        })

}

function initAnalysisPanel(article_id: number|undefined=undefined) {
    if(article_id === undefined) {
        selected_article.value = undefined
        return
    }
    // find article in marked articles
    // let found = marked_articles.value.find(existed_article_info => existed_article_info.article_id === article_id)
    // if(!found) {
    //     selected_article_mark.value = undefined
    // // notes.value = ""
    // } else {
    //     selected_article_mark.value = found.mark
    // // notes.value = found.description
    // }
}

function removeTags(content) {
    const res = content.replaceAll("<n>", "\n")
    return res
}

// indexed_content: {0: s0, 1: s1, 2: s2 ...}
// highlight: {0: entities, 1: entities}
function addContentHighlights(indexed_content: any[], highlights: any) {
    let res = ""
    Object.keys(indexed_content).forEach(sentence_index => {
        const sentence = indexed_content[sentence_index]
        const entities = highlights[sentence_index] // list of entity data
        if(entities) {
            res += `<div id='s-${sentence_index}' class="sentence">` + add_highlights(sentence, entities, true) + '</div>'
        } else { // no entities to highlight
            res += `<div id='s-${sentence_index}' class="sentence">` + sentence + '</div>'
        }
        // res += "\n\n"
        // res += '<br>'
    })
    return res
}

function handleSentenceClicked(e) {
    const clicked_sentence_id = e.target.id
    const clicked_sentence_index = clicked_sentence_id.split('-')[1]
    const sentence_content = indexed_content.value[clicked_sentence_index]
    // console.log({sentence_content})
    emit('sentence-clicked', sentence_content, clicked_sentence_index, props.selected_article.id)
    document.querySelector('#'+clicked_sentence_id).classList.add('animate')
}

function add_highlights(raw_text: string, highlights: any[], filter=false) {
    if(!highlights || highlights?.length === 0) return raw_text
    let non_highlight_start = 0
    let divided_text: any[] = []
    // values:
    // 0 (highlight)
    // undefined
    // positive
    // negative
    // neutral
    let divided_marks: any[] = []
    highlights.forEach(highlight => {
        // console.log(highlight.wiki_id, props.entity_pair, filter)
        const highlight_start = highlight.start_pos
        const highlight_end = highlight_start + highlight.length
        // add normal text
        if(non_highlight_start !== highlight_start) {
            divided_text.push(raw_text.substring(non_highlight_start, highlight_start))
            divided_marks.push(0)
        }
        // add highlight
        divided_text.push(raw_text.substring(highlight_start, highlight_end))

        // devided_marks.push(1)
        if(filter && (highlight.wiki_id == props.entity_pair[0] || highlight.wiki_id == props.entity_pair[1])) {
            divided_marks.push(highlight.sentiment)
        } else {
            divided_marks.push(0)
        }
        non_highlight_start = highlight_end 
    })
    if(non_highlight_start < raw_text.length) {
        divided_text.push(raw_text.substring(non_highlight_start))
        divided_marks.push(0)
    }
    let res = ""
    divided_text.forEach((sub_text, index) => {
        if(divided_marks[index] === 0)
            res += sub_text
        else
            res += highlight_element(sub_text, ColorUtils.hive_color_dict[divided_marks[index]] || undefined)
    })
    return res

}

function highlight_element(text, highlight_color='#f4e12c5c') {
    return `<span style='background-color:${highlight_color};'>${text}</span>`
}

function scrollToSentence(sentence_index) {
    document.querySelector(`#s-${sentence_index}`).scrollIntoView({ behavior: 'smooth'})
    setTimeout(() => {
        console.log('The browser has (theoretically) finished scrolling');
        vue.nextTick(() => document.querySelector(`#s-${sentence_index}`).classList.add("highlighted"))
        setTimeout(() => {
            document.querySelector(`#s-${sentence_index}`).classList.remove("highlighted")
        }, 1000); 
    }, 500)

}

defineExpose({
    initAnalysisPanel,
    scrollToSentence
})


</script>
<template>
<div class="analysis-container" style="display: flex; overflow: hidden; flex: 1 1 0; height: 100%">
    <div class="analysis-left" style="width: 100%; overflow: hidden; display: flex; flex-direction: column">
        <h2 class="component-header analysis-header" style="background: #f7f7f7; padding-left: 1%">
            Article Reviewer
        </h2>
        <div class="analysis-content" style="display: flex; height: 100%; flex: 1 1 0; overflow: hidden; margin: 1%;">
            <div class="scroll-panel" style="width: 100%; height: 100%; overflow-y: auto">
                <div class="summary" v-if="selected_article" style="height: 100%; flex-direction: column">
                    <div class="articleHeadline" style="text-align: center; margin: 2%">
                        <h4 class="selected-article-headline" style="font-weight: 600; font-size: 1.3rem; border-bottom: 1px solid black; border-radius: unset;" v-html="add_highlights(selected_article.headline, props.article_highlights?.headline_entities?.[selected_article.id])"/>
                    </div>
                    <!-- <div class="articleSummary">
                        <span class="selected-article-summary" v-html="removeTags(add_highlights(selected_article.summary, props.article_highlights?.summary_entities?.[selected_article.id]))"/>
                        <span class="selected-article-summary" v-html="removeTags(selected_article.content)"/>
                    </div> -->
                    <div class="articleContent" style="margin-left: 8%; margin-right: 8%;  ">
                        <span class="selected-article-content" @click="handleSentenceClicked" v-html="addContentHighlights(indexed_content, props.article_highlights?.content_entities?.[selected_article.id])"/>
                        <!-- <span class="selected-article-content" v-html="selected_article.content"/> -->
                    </div>
                    <div style="height: 30px"></div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped>
:deep(.sentence) {
    cursor: pointer;
    padding: 2% 1% 2% 1%;
}
:deep(.sentence:hover) {
    background-color: rgba(45, 45, 45, 0.2);
    border: 1px solid #f4f4f4;
    border-radius: 5px;
}
:deep(.animate.sentence::before) {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid black;
  opacity: 0;
  z-index: 100;
  pointer-events: none;
  /* animation: moveBorderAnimation 1s ease-out; */
}

@keyframes moveBorderAnimation {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-1000px) translateY(1000px); /* Adjust the distance between original and target divs */
    opacity: 0;
  }
}


.selected-article-summary, .selected-article-content {
    margin-left: 1%;
}
:deep(.p-splitter-gutter) {
    pointer-events: none;
}
:deep(.p-scrollpanel .p-scrollpanel-bar) {
    background: #838585;
}
:deep(.highlighted) {
    border-radius: 5px;
    background-color: rgba(45, 45, 45, 0.2);
    transition: background-color 0.5s ease;
}
:deep(:not(.highlighted)) {
    border-radius: 5px;
    transition: background-color 0.5s ease;
}
</style>
