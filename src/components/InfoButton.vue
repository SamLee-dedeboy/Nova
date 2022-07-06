<script>
import Tooltip from './Tooltip.vue';
export default {
    components: {
        Tooltip,
    },
    props:["info_content"],
}
</script>

<template>
    <div class="info-button-container">
        <Button 
        class="p-button-rounded p-button-outlined p-button-text"
        icon="pi pi-info-circle"
        @mouseover="() => this.$refs.entity_tooltip.show()"
        @mouseleave="() => this.$refs.entity_tooltip.hide()"
        ></Button>
        <Tooltip 
        ref="entity_tooltip"
        :content="info_content"
        style="font-size:smaller; "></Tooltip>
    </div>
</template>
<style>

</style>