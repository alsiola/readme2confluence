#!/usr/bin/env node

import program from "commander";
import axiosLib from "axios";
import * as fs from "fs-extra";
import * as path from "path";
import marked from "marked";
import { promisify } from "util";

const convertToHTML: (a: string) => Promise<string> = promisify(marked) as any;

// Setup
program
    .version("1.0.0")
    .option("-u --username [username]", "Username")
    .option("-k --apikey [apikey]", "API Key")
    .option("-s --space [space]", "Confluent Space")
    .option("-c --company [company]", "Company name (url slug)")
    .option("-a --ancestor [ancestor]", "Parent page ID")
    .parse(process.argv);

const {
    username = process.env.RTC_USERNAME,
    apikey = process.env.RTC_APIKEY,
    space = process.env.RTC_SPACE,
    company = process.env.RTC_COMPANY,
    ancestor = process.env.RTC_ANCESTOR
} = program;

[username, apikey, space, company].forEach(arg => {
    if (!arg) {
        throw new Error(`Invalid arguments`);
    }
});

const axios = axiosLib.create({
    baseURL: `https://${company}.atlassian.net/wiki/rest/api/content`,
    auth: {
        username,
        password: apikey
    }
});

// Types
interface Page {
    id: string;
    title: string;
}

interface PageDetail {
    id: string;
    title: string;
    version: { number: number };
}

interface ContentGetResult {
    results: Page[];
}

const generateContent = (readme: string) =>
    convertToHTML(`### This page was generated by readme2confluence, do not edit it directly
    
${readme}`);

// Utils
const createPage = async (pkg: any, readme: string) => {
    console.log("Creating new page");
    return axios.post("/", {
        space: {
            key: space
        },
        ...(ancestor ? { ancestors: [{ id: ancestor }] } : {}),
        type: "page",
        title: pkg.name,
        body: {
            editor: {
                value: await generateContent(readme),
                representation: "editor"
            }
        }
    });
};

const updatePage = async (prev: PageDetail, readme: string) => {
    console.log("Updating existing page");
    return axios.put(`/${prev.id}`, {
        space: {
            key: space
        },
        ...(ancestor ? { ancestors: [{ id: ancestor }] } : {}),
        type: "page",
        title: prev.title,
        version: { number: prev.version.number + 1 },
        body: {
            editor: {
                value: await generateContent(readme),
                representation: "editor"
            }
        }
    });
};

// Main
(async () => {
    try {
        const [pkg, readme] = await Promise.all([
            fs.readFile(path.join(process.cwd(), "package.json")),
            fs.readFile(path.join(process.cwd(), "readme.MD"))
        ]).then(files =>
            files
                .map(file => file.toString())
                .map((file, i) => (i ? file : JSON.parse(file)))
        );

        console.log("Retrieving existing pages");

        const { data: currentContent } = await axios.get<ContentGetResult>(
            `/`,
            {
                params: {
                    spaceKey: space
                }
            }
        );

        const existingContent = currentContent.results.find(
            ({ title }) => title === pkg.name
        );

        if (existingContent) {
            console.log("Found existing content, fetching details");
            const previousContent = await axios.get(`/${existingContent.id}`);
            console.log(
                `Existing page version ${previousContent.data.version.number}`
            );
            await updatePage(previousContent.data, readme);
        } else {
            await createPage(pkg, readme);
        }

        console.log("Success!");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
