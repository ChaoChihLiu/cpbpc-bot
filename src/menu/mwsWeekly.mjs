import puppeteer from 'puppeteer'

async function openPdfInChrome(pdfUrl) {
    // Launch Chrome
    const browser = await puppeteer.launch({
        headless: false, // Run with a visible Chrome window
        args: ['--disable-web-security'] // Optional: Disable web security if needed
    })

    const page = await browser.newPage()
    // Open the PDF link
    await page.goto(pdfUrl)

    // Keep the browser open to view the PDF
    // You can close it after a timeout or based on some other condition
}


const pdfUrl = 'https://cpbpc-documents.s3-ap-southeast-1.amazonaws.com/Worship/pnw.pdf';
export function run(msg) {
    openPdfInChrome(pdfUrl)
    return ''
}