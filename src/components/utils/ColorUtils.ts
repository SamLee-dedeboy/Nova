import * as d3 from "d3"
import { SentimentType } from "../../types"
const brightness = 100
const offset = 0.15
const sst_range = d3.interpolateBrBG
const neg_color = '#f4c49c' //sst_range(0+offset)
const pos_color = '#baf0f5' //sst_range(1-offset)
const neu_color = '#dddddd' //"#c4c3c3"
const mixed_color = 'url(#diagonalHatch)'  //"#a54dd9"
const entity_selected_color = "#007bff"
export const topic_fill_color = "#4baaf5"
export const topic_main_color = "white"
export const topic_color_dict = {
    "main": topic_main_color,
    "co-occur": topic_fill_color,
}

const key_color_dict = {
        "positive": pos_color, //pos_color,
        "negative": neg_color,
        "neutral": neu_color,
        "mixed": mixed_color, 
    } 
export const hive_color_dict = {
        "positive": pos_color, //pos_color,
        "negative": neg_color,
        "neutral": neu_color,
        "mixed": mixed_color, 
        "not covered": "white"
    } 
const color_dict = {
    "pos": pos_color,
    "neg": neg_color,
    "neu": neu_color,
    "mixed": mixed_color, 
}
const enum_color_dict = {}
enum_color_dict[SentimentType.neu] = neu_color
enum_color_dict[SentimentType.neg] = neg_color
enum_color_dict[SentimentType.pos] = pos_color
enum_color_dict[SentimentType.mix] = mixed_color
enum_color_dict[SentimentType.unknown] = "white"

const outlet_color_dict = {
    "CNN": "rgb(205 0 0)",
    "FoxNews": "rgb(0 51 102)",
    "Breitbart": "rgb(247 82 0)",
    "ABC News": "rgb(115 155 205)",
    "New York Times": "rgb(17 17 17)",
    "Washington Post": "#b7b7b8"
}
const scale_offset = 0.3
const article_num_color_scale = (x) => d3.interpolateReds(scale_offset+x*(1-scale_offset))
export {
    brightness,
    sst_range,
    neg_color,
    pos_color,
    neu_color,
    mixed_color,
    entity_selected_color,
    key_color_dict,
    color_dict,
    enum_color_dict,
    outlet_color_dict,
    article_num_color_scale,
}