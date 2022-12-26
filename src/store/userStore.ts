import { defineStore } from "pinia"
import * as typeUtils from "../types"


export const useUserDataStore = defineStore('userData', {
    state: () => ({
        selected_entity: typeUtils.EntityInfo,
        selected_cooccurr_entity: typeUtils.CooccurrEntityInfo,
        outlet_weight_dict: { "CNN": 1, "Washington Post": 1, "FoxNews": 1, "New York Times": 1, "Breitbart": 1, "ABC News": 1 },
        segmentation: { pos: 0.5, neg: 0.5 },
        hexview_grid: undefined,
        clicked_hexview: undefined,
        constraints: {},
        notes: "",
        marked_articles: []
    }),
    getters: {},
    actions: {
        setEntity(entity) {
            this.selected_entity = entity
        },
        setCooccurrEntity(cooccurr_entity) {
            this.selected_cooccurr_entity = cooccurr_entity
        },
        resetOutletWeight(weight_dict) {
            this.outlet_weight_dict = weight_dict
        },
        setOutletWeight(outlet, weight) {
            this.outlet_weight_dict[outlet] = weight
        },
        setSegmentation(segmentation) {
            this.segmentation = segmentation
        },
        setHexViewGrid(grid) {
            this.hexview_grid = grid
        },
        setClickedHexView(hexview) {
            this.clicked_hexview = hexview
        },
        addConstraint(constraint) {
            if (!this.constraints[constraint.target])
            this.constraints[constraint.target] = {}
            this.constraints[constraint.target][constraint.outlet] = constraint.sentiment
        },
        removeConstraint( constraint) {
            delete this.constraints[constraint.target][constraint.outlet]
        },
        setNotes(notes) {
            this.notes = notes
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
        }
    }
})