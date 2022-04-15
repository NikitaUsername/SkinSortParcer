const cheerio = require("cheerio");
const axios = require("axios");
const axiosRetry = require('axios-retry');
const fs = require('fs');

const client = axios.create({
    timeout: 10000,
});
axiosRetry(client, { retries: 10 });

module.exports.getHTML = async (url) => {
    const { data } = await client.get(url).catch(() => {
        throw url
    })
    return cheerio.load(data);
}

module.exports.saveToLog = (log) => {
    let data = JSON.stringify(log);
    fs.writeFileSync('log.json', data);
}