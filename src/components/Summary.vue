<script setup lang="ts">
/**
 * libraries
 */
import * as vue from "vue"
import NoteEditor from '../components/NoteEditor.vue';


/**
 * vue components
 */
import HexCooccurrence from "./HexCooccurrence.vue"
import { useUserDataStore } from "../store/userStore"
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()

const store = useUserDataStore()
const clicked_hexview = vue.computed(() => Object.keys(store.clicked_hexview).map(title => store.clicked_hexview[title]))
const user_hex_selection = vue.computed(() => store.hex_selection) 
const segmentation = vue.computed(() => store.segmentation)
const notes = vue.computed(() => store.notes)
const summary_created = vue.computed(() => 
                        {
                            console.log(user_hex_selection.value)
                            if(Object.keys(user_hex_selection.value).length !== 0)
                                return true;
                        })

const image_path = vue.computed(() => route.name === 'home'? "" : "../../")
vue.onMounted(() => {
    console.log('summary mounted: ', notes.value)
    // console.log(user_hex_selection.value)
    console.log(route.name)
})
</script>

<template>

<div v-if="!summary_created" class="page-container" style="display: flex; width: 80vw; height: 60vh; z-index:1000; background-color: white">
    No summary created yet.
</div>
<div v-else class="page-container" style="display: flex; width: 80vw; height: 60vh; z-index:1000; background-color: white">
    <div class="summary-container" style="display: flex; flex-direction: column; width: 100%">
        <div class="content-container" style="display: flex; flex-direction: column; flex: 1; width: 100%; height: 100%; ">
            <div v-for="hexview, index in clicked_hexview" class="item-container" :key="hexview.title" style="display: flex; flex-direction: column;  width: 100%; min-width: 50%;height: 420px;margin-bottom: 1rem;">
                <div class="hexview-header" style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; height: 10%; box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.5)">
                    <div class="hexview-title" style="display: flex; flex-direction: row; align-items: center; height: 100%; width: 100%;">
                        <div :class="['journal-style']">
                            <img :src="`${image_path}squared/${hexview.outlet}.png`"
                                :class="['journal-image',`${hexview.outlet}`]" />
                        </div>
                        <div class="hexview-title-text" style="font-size: 1.2em; font-weight: bold; margin-left: 0.5em;">{{hexview.center_entity}}</div>
                    </div>
                </div>
                <div class="hexview-container" style="display: flex; width: 100%;height:100%;">
                    <div class="user-hexview-container" style="
                        flex:1;
                        display: flex; 
                        flex-direction: column;
                        align-items: center; 
                        justify-content: center;
                        ">
                        <div class="hive-header user-hive-header" style="width: fit-content;">Your belief </div>
                        <HexCooccurrence  class="summary-user-hexview" 
                            :id="`summary_user_hexview_${index}`" :entity_cooccurrences="hexview.data"
                            mode="user-fixed"
                            :p_margin="{top:0, right:0, bottom:0, left:0}"
                            :font_size="1.3"
                            :segmentation="segmentation" 
                            :show_blink="true"
                            :show_label="true"
                            :user_hex_selection="user_hex_selection[hexview.outlet]?.[hexview.center_entity]">
                        </HexCooccurrence>
                        </div>
                    <div class="data-hexview-container" style="flex:1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div class="hive-header data-hive-header" style="width: fit-content">Data suggested</div>
                        <HexCooccurrence class="summary-data-hexview" 
                            :id="`summary_data_hexview_${index}`" :entity_cooccurrences="hexview.data"
                            mode="data"
                            :p_margin="{top:0, right:0, bottom:0, left:0}"
                            :font_size="1.3"
                            :segmentation="segmentation" 
                            :show_blink="true"
                            :show_label="true"
                            :show_hex_appear="false"
                            :user_hex_selection="user_hex_selection[hexview.outlet]?.[hexview.center_entity]">
                        </HexCooccurrence>
                    </div>
                    <div class="summary-notes-container" style=" flex: 1.5; display: flex; flex-direction: column;height: 100%;">
                        <h2 class="component-header notes-header">
                            Notes
                            <i class='pi pi-info-circle tooltip'>
                                <span class="tooltiptext right-tooltiptext" style="width: 145px">
                                    <!-- Write down any hypothesis or questions you have.
                                    The system will document that for you. -->
                                    We will record the text you put here for academic user study.
                                    We do not collect any other information from you.
                                </span>
                            </i>
                        </h2>
                        <NoteEditor class="notes-style" style="height: 100%" :initial_content="notes[hexview.outlet]?.[hexview.center_entity]" :showRaw="true"></NoteEditor>
                    </div>
                </div>
            </div>
            <br>
            <br>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.component-header.notes-header {
    background: #f7f7f7;
    margin: 3px 1% 1% 0%;
    padding-left: 2%;
}
.journal-style{
    // width: 50px;
    height: 80px;
    // overflow: hidden;
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
.hive-header {
    position: absolute;
    z-index: 1000;
    top: 0;
}
</style>