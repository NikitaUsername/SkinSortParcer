const goodEffectsList = ['reduces', 'helps with', 'good for', 'protects from', 'helps fight', 'hydrates', 'helps reduce'];
const badEffectsList = ['can worsen', 'may cause', 'may feed'];
const isAList = ['is a', 'is an'];
const { getHTML, saveToLog } = require('./functions');
const xl = require('excel4node');
const cliProgress = require('cli-progress');

const parse = async () => {
    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true

    }, cliProgress.Presets.shades_grey);
    let log = {
        errors: [],
    };

    try {
        let allElementsQty = 0;
        const $ = await getHTML(`https://skinsort.com/ingredients?page=1`);

        let wb = await new xl.Workbook();
        let ws = wb.addWorksheet('Data');

        const header = [
            'Name',
            'Functions',
            'Good effects',
            'Bad effects',
            'Is a',
            'Form of',
        ];
        for (let [index, field] of header.entries()) {
            ws.cell(1, index + 1).string(field);
        };

        const pageNumber = $('ul>li.page-item').eq(-1).children().attr('href')?.slice(18);
        if (!pageNumber)
            throw ('No page!');

        const b1 = multibar.create(pageNumber, 0);

        for (let i = 1; i <= pageNumber; i++) {
            try {
                const selector = await getHTML(`https://skinsort.com/ingredients?page=${i}`)

                const elements = selector('#ingredients-table>div>a').toArray();

                const b2 = multibar.create(elements.length, 0);
                for (let [elementIdx, element] of elements.entries()) {
                    try {
                        allElementsQty++;
                        let href = selector(element).attr('href');
                        if (!href)
                            throw selector(element).html()

                        const ingredient = await getHTML(`https://skinsort.com${href}`)

                        const name = ingredient('h1.text-center').text()?.slice(1, -1);
                        const functions = ingredient('div>ul.list-disc>li').eq(-1).text().slice(15);

                        if (!name) {
                            throw {
                                ref: href,
                                data: ingredient('h1.text-center').html()
                            }
                        }

                        ws.cell(allElementsQty + 1, 1).string(name);
                        ws.cell(allElementsQty + 1, 2).string(functions);

                        const effects = ingredient('h2:contains("At a glance")+div>div')?.toArray();

                        if (!effects)
                            continue;

                        const goodEffects = [];
                        const badEffects = [];
                        const isA = [];
                        const formOf = [];

                        for (let effect of effects) {
                            let effectType = ingredient(effect).find('div').eq(1).text();
                            let effectName = ingredient(effect).find('div').eq(2).text();

                            if (!effectName || !effectType)
                                continue

                            if (goodEffectsList.includes(effectType)) {
                                goodEffects.push(effectName);
                                continue;
                            }
                            if (badEffectsList.includes(effectType)) {
                                badEffects.push(effectName)
                                continue
                            }
                            if (isAList.includes(effectType)) {
                                isA.push(effectName)
                                continue
                            }
                            if (effectType === 'form of') {
                                formOf.push(effectName)
                                continue
                            }
                        };

                        ws.cell(allElementsQty + 1, 3).string(goodEffects.join(', '));
                        ws.cell(allElementsQty + 1, 4).string(badEffects.join(', '));
                        ws.cell(allElementsQty + 1, 5).string(isA.join(', '));
                        ws.cell(allElementsQty + 1, 6).string(formOf.join(', '));
                    } catch (error) {
                        log.errors.push({
                            type: 3,
                            error
                        })
                        saveToLog(log);
                    }
                    b2.update(elementIdx + 1);
                }
                multibar.remove(b2);
                b1.increment();
                wb.write(`elements.xlsx`);
            } catch (error) {
                log.errors.push({
                    type: 2,
                    error
                })
                saveToLog(log);
            }
        }
    } catch (error) {
        log.errors.push({
            type: 1,
            error
        })
        saveToLog(log);
    }
    multibar.stop();
}

parse();

