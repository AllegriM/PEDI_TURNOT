
const { chromium } = require('playwright');
const notifier = require('node-notifier');
const cron = require('node-cron');
const inquirer = require('inquirer');

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

inquirer.prompt({
    type: 'list',
    name: 'tramite',
    message: 'Que tramite desea realizar?',
    choices: ['Ampliación', 'Duplicado', 'Licencia (Primera vez)', 'Original', 'Reemplazo', 'Renovación(Tarde)', 'Renovación(Mañana)'],
    default: 'Renovación(Mañana)'
}).then((answers) => {
    // Ampliacion = 6 // Duplicado = 4 // Licencia (Primera vez) = 5 // Original = 8 // Reemplazo = 3 // Renovación(Tarde) = 130 // Renovación(Mañana) = 1
    if (answers.tramite == 'Ampliación') console.log(`Usted eligio ${answers.tramite} como tramite`), console.log(`Buscando el turno mas cercano para tramite: ${answers.tramite}`), answers.tramite = '6';
    if (answers.tramite == 'Duplicado') console.log(`Usted eligio ${answers.tramite} como tramite`), console.log(`Buscando el turno mas cercano para tramite: ${answers.tramite}`), answers.tramite = '4';
    if (answers.tramite == 'Licencia (Primera vez)') console.log(`Usted eligio ${answers.tramite} como tramite`), console.log(`Buscando el turno mas cercano para tramite: ${answers.tramite}`), answers.tramite = '5';
    if (answers.tramite == 'Original') console.log(`Usted eligio ${answers.tramite} como tramite`), console.log(`Buscando el turno mas cercano para tramite: ${answers.tramite}`), answers.tramite = '8';
    if (answers.tramite == 'Reemplazo') console.log(`Usted eligio ${answers.tramite} como tramite`), console.log(`Buscando el turno mas cercano para tramite: ${answers.tramite}`), answers.tramite = '3';
    if (answers.tramite == 'Renovación(Tarde)') console.log(`Usted eligio ${answers.tramite} como tramite`), console.log(`Buscando el turno mas cercano para tramite: ${answers.tramite}`), answers.tramite = '130';
    if (answers.tramite == 'Renovación(Mañana)') console.log(`Usted eligio ${answers.tramite} como tramite`), console.log(`Buscando el turno mas cercano para tramite: ${answers.tramite}`), answers.tramite = '1';

    // Obtener la fecha dentro de 2 meses
    const date = new Date();
    date.setMonth(date.getMonth() + 2);
    const TWO_MONTHS_AHEAD = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    // // Run every 1 hour
    cron.schedule('0 */1 * * *', () => {
        console.log('Buscando algun turno disponible...');
        initializeResesarch({ TIPO_TRAMITE: answers.tramite, TWO_MONTHS_AHEAD: TWO_MONTHS_AHEAD });
    })
})

async function initializeResesarch({ TIPO_TRAMITE, TWO_MONTHS_AHEAD }) {

    const AVAILABLE_DAYS_ARRAY = []
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto('https://citymis.co/sanisidro/public?sch=26')
        // Click option 1 (Solicitar NUEVO TURNO) and wait for modal to open //
        await page.click('.option1')
        await page.waitForSelector('#process_type_id_select')
        // Click procedure type option 'RENOVACION (ATENCION POR LA MAÑANA)'
        await page.selectOption('#process_type_id_select', TIPO_TRAMITE)
        await page.waitForLoadState('networkidle');
        // Click input to open datepicker
        await page.click('#schedule_new_process_date')
        await page.waitForLoadState('networkidle');
        // Select available day or change month
        const selectAvailableDayOrChangeMonth = async (page) => {
            const month = await page.$eval('.datepicker-switch', (month) => month.innerText)
            // Wait for id = loading_warning to disappear
            await page.waitForSelector('#loading_warning', { state: 'hidden' })
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
                if (month === TWO_MONTHS_AHEAD) {
                    console.log(`No se encontraron turnos antes de la fecha: ${TWO_MONTHS_AHEAD}`)
                    return
                }
                await selectAvailableDayOrChangeMonth(page)
            }
            await browser.close();
        }
        await selectAvailableDayOrChangeMonth(page)
        if (AVAILABLE_DAYS_ARRAY[0]) {
            notifier.notify({
                title: 'TURNO DISPONIBLE!!',
                message: `${AVAILABLE_DAYS_ARRAY[0]}`
            })
        } else {
            console.log("No hay turnos disponibles")
            return
        }
    } catch (e) {
        console.error(e)
    }
}


