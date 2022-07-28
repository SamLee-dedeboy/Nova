import * as d3 from "d3"
const brightness = 140
const offset = 0.15
const sst_range = d3.interpolateBrBG
const neg_color = sst_range(0+offset)
const pos_color = sst_range(1-offset)
const neu_color = "grey"
const mixed_color = "#125f3b"
const entity_selected_color = "#007bff"
const key_color_dict = {
                "positive": pos_color,
                "negative": neg_color,
                "neutral": neu_color,
                "mixed": mixed_color, 
                "no mention": "white"
            } 
const color_dict = {
    "pos": pos_color,
    "neg": neg_color,
    "neu": neu_color,
    "mixed": mixed_color, 
}
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
    outlet_color_dict,
    article_num_color_scale,
}