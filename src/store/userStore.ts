import { defineStore } from "pinia"
import * as typeUtils from "../types"

// selected_entity: typeUtils.EntityInfo,
// selected_cooccurr_entity: typeUtils.CooccurrEntityInfo,

export const useUserDataStore = defineStore('userData', {
    state: () => ({
        selected_entity: undefined,
        selected_cooccurr_entity: undefined,
        selected_outlet: undefined,
        outlet_weight_dict: { "CNN": 1, "Washington Post": 1, "FoxNews": 1, "New York Times": 1, "Breitbart": 1, "ABC News": 1 },
        article_num_threshold: 20,
        segmentation: { pos: 0.5, neg: 0.5 } as typeUtils.Sentiment2D,
        hexview_grid: undefined,
        clicked_hexview: {},
        inspection_hexview: undefined,
        constraints: {},
        notes: {},
        raw_notes: {},
        marked_articles: [],
        user_outlet_segmentations: {},
        hex_selection: {},
        conflict_hex: {},
        overview_first_access: true,
        belief_first_access: true,
        inspection_first_access: true,
        hiveExplanation: {}
    }),
    getters: {},
    actions: {
        setEntity(entity) {
            // console.log("UPDATED STATE", entity)
            this.selected_entity = entity
        },
        setCooccurrEntity(cooccurr_entity) {
            this.selected_cooccurr_entity = cooccurr_entity
            if(this.selected_cooccurr_entity && this.selected_cooccurr_entity.name === this.selected_entity.name)
                this.selected_cooccurr_entity = undefined
        },
        setSelectedOutlet(outlet) { 
            this.selected_outlet = outlet
        },
        setArticleNumThreshold(threshold) {
            this.article_num_threshold = threshold
        },
        setSegmentation(segmentation : typeUtils.Sentiment2D, leaning='general')  {
            if(leaning == "general")
                this.segmentation = segmentation
            else if (leaning == 'left')
                this.left_leaning_segmentation = segmentation
            else if (leaning == 'right')
                this.right_leaning_segmentation = segmentation
        },
        setUserOutletSegmentations(segmentation, outlet) {
            this.user_outlet_segmentations[outlet] = segmentation
        },
        setHexViewGrid(grid) {
            this.hexview_grid = grid
        },
        setClickedHexView(hexview) {
            this.clicked_hexview[hexview.title] = hexview
        },
        setInspectionHexView(hexview) {
            this.inspection_hexview = hexview
        },
        addConstraint(constraint) {
            if (!this.constraints[constraint.target])
            this.constraints[constraint.target] = {}
            this.constraints[constraint.target][constraint.outlet] = constraint.sentiment
        },
        removeConstraint( constraint) {
            delete this.constraints[constraint.target][constraint.outlet]
        },
        setNotes(notes, outlet, entity) {
            if(this.notes[outlet] === undefined) this.notes[outlet] = {}
            this.notes[outlet][entity] = notes
        },
        setRawNotes(notes, outlet, entity) {
            if(this.raw_notes[outlet] === undefined) this.raw_notes[outlet] = {}
            this.raw_notes[outlet][entity] = notes
        },
        setMarkedArticle( article_info) {
            let found = this.marked_articles.find(existed_article_info => existed_article_info.article_id === article_info.article_id)
            if (!found) {
                this.marked_articles.push(article_info)
            }
            found = article_info
        },
        addMarkedArticle(article_info) {
            this.marked_articles.push(article_info)
        },
        removeMarkedArticle(article_id) {
            const index = this.marked_articles.map(pair => pair.article_id).indexOf(article_id);
            if (index !== -1) {
                this.marked_articles.splice(index, 1);
            }
        },
        setHexSelection(hex_selection, outlet, entity) {
            if (!this.hex_selection[outlet]) this.hex_selection[outlet] = {}
            this.hex_selection[outlet][entity] = hex_selection
        },
        setConflictHex(conflict_hex) {
            this.conflict_hex = conflict_hex
        },
        setOverviewFirstAccess(first_access) {
            this.overview_first_access = first_access
        },
        setBeliefFirstAccess(first_access) {
            this.belief_first_access = first_access
        },
        setInspectionFirstAccess(first_access) {
            this.inspection_first_access = first_access
        },
        setHiveExplanation(explanation, outlet, entity) {
            if(this.hiveExplanation[outlet] === undefined) this.hiveExplanation[outlet] = {}
            this.hiveExplanation[outlet][entity] = explanation
        }
    }
})