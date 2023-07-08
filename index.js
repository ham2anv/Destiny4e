import express from "express";
import { marked } from "marked";
import YAML from "yaml";
import path from "path";
import fs from "fs/promises";

marked.use({ mangle: false, headerIds: false });

const app = express();

const fmRegex = /---[\n\r]+([^]+)[\n\r]+---/g;
const DIR = path.join(process.cwd(), "docs");

app.set("view engine", "ejs").use(express.static("static"));

app.get("/", (_, response) => {
  fs.readdir(DIR, { encoding: "utf-8" })
    .then(
      async (list) =>
        await Promise.all(
          list.map((file) =>
            fs
              .readFile(path.join(DIR, file), {
                encoding: "utf-8",
              })
              .then((contents) =>
                YAML.parse(contents.match(fmRegex)[0].replaceAll("---", ""))
              )
              .then(({ title }) => ({
                title,
                href: file.slice(0, file.lastIndexOf(".")),
              }))
          )
        )
    )
    .then((pages) => response.render("index", { pages }));
});

app.get("/:name", (request, response) => {
  fs.readFile(path.join(DIR, request.params.name + ".md"), {
    encoding: "utf-8",
  })
    .then((contents) => {
      const body = marked.parse(contents.replaceAll(fmRegex, "").trim());
      const frontMatter = YAML.parse(
        contents.match(fmRegex)[0].replaceAll("---", "")
      );
      return { body, ...frontMatter };
    })
    .then((results) => response.render("page", { ...results, marked }));
});

app.listen(3000, () => console.log("listening on port 3000"));
