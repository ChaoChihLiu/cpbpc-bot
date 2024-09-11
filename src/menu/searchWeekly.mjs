
const pnw = `https://d13vhl06g9ql7i.cloudfront.net/weekly/pnw`
const sgh = `https://d13vhl06g9ql7i.cloudfront.net/weekly/sgh`
export function run(msg) {
    // openPdfInChrome(pdfUrl)
    return { text: `MWS: ${pnw} \n SGH: ${sgh}` };
}