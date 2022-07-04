<template>
    <div ref="tooltip" class="tooltip" v-html="content" 
    :style="{scale: showTooltip}"></div>  
</template>

<script>
export default {
    props: ["content"],
    data() {
        return {
            showTooltip: 0,
        }
    },
    methods: {
        show() {
            this.showTooltip = 1
        },
        hide() {
            this.showTooltip = 0
        }
    }
}
</script>

<style scoped>
.tooltip {
    position: absolute;
    background-color: white;
    border: solid;
    border-width: 2px;
    border-radius: 5px;
    padding: 5px;
    pointer-events: none;
    transform-origin: top left;
}
</style>