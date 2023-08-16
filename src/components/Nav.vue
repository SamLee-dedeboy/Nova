<template>
    <div id="nova-navBar">
        <div id="nova-logo">
            <img alt="logo" src="/nova_logo.png" height="40" class="mr-2" @click="handleNOVAlogoClicked">
        </div>
        <StageSelect class='page-steps' />
    </div>
</template>

<script setup lang="ts">
import StageSelect from "./stageSelect.vue";

import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
function handleNOVAlogoClicked() {
    router.push({ name: 'tutorial' })
}


</script>

<style lang="css" scoped>
#nova-navBar {
    height: 5vh;
    display: flex;
    justify-content: space-between;
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
#nova-logo:hover{
    cursor: pointer;
}

.page-steps {
    margin-right: 2%;
    width: 50%;
    z-index: 1;
}
</style>