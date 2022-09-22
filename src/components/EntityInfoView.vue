<script setup lang="ts">
import { EntityInfo } from "../types"
const props = defineProps({
    title: String,
    entity_info: EntityInfo,
})

</script>
<template>
    <div class="entity-info-view-container">
        <div class="title">{{props.title}}</div>
        <div class="entity-name" :title="props.entity_info?.name">{{"id: " + props.entity_info?.name || "unknown"}}</div>
        <div class="outlet-name">{{"journal: " + props.entity_info?.outlet || "unknown"}}</div>
        <div class="num-of-mention">{{"#mentions: " + props.entity_info?.num_of_mentions || "unknown"}}</div>
    </div>
</template>

<style scoped>
div {
    font-size:small;
    overflow: hidden;
    white-space: nowrap;
}
.entity-info-view-container {
    max-width: 100px;
}
.entity-name {
    overflow:hidden;
}
</style>