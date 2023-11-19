import express from "express";
const app = express.Router();
import functions from "../utilities/structs/functions.js";

app.post("/api/v1/fortnite-br/surfaces/motd/target", async (req, res) => {
    const motdTarget = JSON.parse(JSON.stringify(require("./../responses/motdTarget.json")));

    var Language = "en";

    if (req.body.language) {
        if (req.body.language.includes("-") && req.body.language != "es-419" && req.body.language != "pt-BR") {
            Language = req.body.language.split("-")[0];
        } else {
            Language = req.body.language;
        }
    }

    try {
        motdTarget.contentItems.forEach(item => {
            item.contentFields.title = item.contentFields.title[Language];
            item.contentFields.body = item.contentFields.body[Language];
        })
    } catch (err) {}

    res.json(motdTarget)
})

app.get("/content/api/pages/*", async (req, res) => {
    const contentpages = functions.getContentPages(req);
    res.json(contentpages);
});
export default app;
//# sourceMappingURL=contentpages.js.map