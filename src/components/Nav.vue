<template>
    <div id="nova-navBar">
        <div id="nova-logo">
            <img alt="logo" src="/nova_logo.png" height="40" class="mr-2">
        </div>
        <!-- <StageSelect class='page-steps' /> -->
        <Button class="summary-button" size="small" severity="secondary" text raised @click="openSummary"> Summary </Button>
    </div>
</template>

<script setup lang="ts">
import StageSelect from "./stageSelect.vue";
import { useDialog } from 'primevue/usedialog';
import Summary from "./Summary.vue";
import * as vue from "vue"
import { useUserDataStore } from '../store/userStore'

const store = useUserDataStore()
const dialog = useDialog();
const summary_header = vue.h('div', { class: 'bar', innerHTML: 'Summary' })


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
    width: 20%;
    align-items: center;
    display: flex;
    margin-left: 2%;
}

.summary-button {
    margin-right: 1.1%;
    height: 80%;
}
</style>