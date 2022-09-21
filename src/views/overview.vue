<template>
    <EntitySelection :view="view" :view_index="index" :id="`${compare_part}-scatter-${index}-expanded`"
        :class="{compare: compare_mode, not_compare: !compare_mode}" :expanded="true" :panel_class="compare_part"
        :article_num_threshold="article_num_threshold" :segment_mode="segment_mode" :segmentation="segmentation"
        :highlight_nodes="highlightNodes" @update:segmentation="updateSegmentation" @node_clicked="handleEntityClicked"
        @update-weight-ended="$emit('update-weight-ended')"></EntitySelection>

</template>


<script setup lang="ts">
    import EntitySelection from '../components/overviewComponents/entitySelection.vue';
    
</script>


<style scoped>

</style>