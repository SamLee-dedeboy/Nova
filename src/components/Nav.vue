<template>
    <div id="nova-navBar">
        <div id="nova-logo" @click="handleLogoClicked">
            <img alt="logo" src="/nova_logo.png" height="40" class="mr-2">
        </div>
        <!-- <StageSelect class='page-steps' /> -->
        <div class="nav-button-container" style="display: flex; margin-right:1.1%;">
            <Button v-if="route_name=='inspection'" class="try-another-button" severity="secondary" size="small" text raised @click="handleLogoClicked" style="display: ruby;font-family:Trebuchet MS"> Try another </Button>
            <Button v-if="summary_visible" class="summary-button" size="small" severity="secondary" text raised @click="openSummary"> Summary </Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDialog } from 'primevue/usedialog';
import { useUserDataStore } from "../store/userStore"
import Summary from "./Summary.vue";
import { useRoute, useRouter } from 'vue-router'
import * as vue from "vue"

const store = useUserDataStore()
const router = useRouter()
const user_hex_selection = vue.computed(() => store.hex_selection) 
const summary_created = vue.computed(() => {
    if(Object.keys(user_hex_selection.value).length == 0) return false
    let created = false
    Object.keys(user_hex_selection.value).forEach(outlet => {
        const entities_dict = user_hex_selection.value[outlet]
        Object.keys(entities_dict).forEach(entity => {
            if(entities_dict[entity] !== -1) {
                created = true
                return
            }
        })
        if(created) return 
    })
    return created
})
const props = defineProps({
    route_name: String
})


const dialog = useDialog();
const summary_header = vue.h('div', { class: 'summary-header', innerHTML: 'Summary', style:
"background: #f7f7f7; margin: 0% 1% 1% 0%; padding-left: 3px; width: 100%;font-weight: bold; font-size: 1.5rem; border-bottom: 1px solid #b3b3b3;"
 })
const summary_visible = vue.computed(() => summary_created.value && props.route_name != "belief")

function handleLogoClicked() {
    router.push({ name: 'home' })
}

function openSummary() {
    const dialog_instance = dialog.open(Summary, {
        templates: {
            header: summary_header,
        },
    })
}
</script>

<style lang="css" scoped>
#nova-navBar {
    height: 5vh;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
    z-index: 99;
    box-shadow: rgb(0 0 0 / 20%) 0px 25px 20px -20px;
}

#nova-logo {
    align-items: center;
    display: flex;
    cursor: pointer;
    width:fit-content;
    margin-left: 20px;
}

.summary-button, .try-another-button {
    margin-right: 1.1%;
    height: 80%;
}

:deep(.summary-header) {
    background: #f7f7f7;
    margin: 3% 1% 1% 0%;
    padding-left: 2%;
}
</style>