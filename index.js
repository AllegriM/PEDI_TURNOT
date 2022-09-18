
const { chromium } = require('playwright');

// const NOT_AVAILABLE_DAYS = []

// async function selectAvailableDayOrChangeMonth(page) {
// }

async function initializeResearch() {
    const AVAILABLE_DAYS_ARRAY = []
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto('https://citymis.co/sanisidro/public?sch=26')
        // Click option 1 (Solicitar NUEVO TURNO) and wait for modal to open //
        await page.click('.option1')
        await page.waitForSelector('#process_type_id_select')
        await page.screenshot({ path: `example1.png` })
        // Click procedure type option 'RENOVACION (ATENCION POR LA MAÑANA)'
        await page.selectOption('#process_type_id_select', '1')
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `example2.png` })
        // Click input to open datepicker
        await page.click('#schedule_new_process_date')
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: `example3.png` })
        // Select available day or change month
        const selectAvailableDayOrChangeMonth = async (page) => {
            const month = await page.$eval('.datepicker-switch', (month) => month.innerText)
            // Wait for id = loading_warning to disappear
            await page.waitForSelector('#loading_warning', { state: 'hidden' })
            await page.screenshot({ path: `example${month}.png` })
            const AVAILABLE_DAYS = await page.$$eval('.day', (days) => days.map((day) => {
                return { class: day.className, text: day.innerText }
            }))
            const AVAILABLE_DAY = AVAILABLE_DAYS.map((day) => {
                if (!(day.class.includes('disabled disabled-date'))) {
                    AVAILABLE_DAYS_ARRAY.push(`TURNO LIBRE: DIA ${day.text} - MES ${month}`)
                }
            })
            AVAILABLE_DAYS.push(AVAILABLE_DAY)
            if (AVAILABLE_DAYS.length !== 0) {
                await page.click('thead tr th[class="next"]')
                const month = await page.$eval('.datepicker-switch', (month) => month.innerText)
                if (month === 'Diciembre 2022') {
                    return
                }
                await selectAvailableDayOrChangeMonth(page)
            }
            await browser.close();
        }
        await selectAvailableDayOrChangeMonth(page)
        console.log(AVAILABLE_DAYS_ARRAY)
    } catch (e) {
        console.error(e)
    }

}

(async () => {
    try {
        initializeResearch()
    } catch (error) {
        console.error(error)
    }
})();