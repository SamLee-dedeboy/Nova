<template>
    <div id="nova-navBar">
        <div id="nova-logo">
            <img alt="logo" src="/nova_logo.png" height="40" class="mr-2">
        </div>
        <StageSelect class='page-steps' />
    </div>
</template>

<script setup lang="ts">
import StageSelect from "./stageSelect.vue";



</script>

<style lang="css" scoped>
#nova-navBar {
    height: 5vh;
    display: flex;
    justify-content: space-between;
}

#nova-logo {
    width: 20%;
    align-items: center;
    display: flex;
    margin-left: 2%;
}

.page-steps {
    margin-right: 2%;
    width: 50%;
    z-index: 1;
}
</style>