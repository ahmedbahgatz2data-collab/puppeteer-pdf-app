const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium-min');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// واجهة بسيطة للاختبار
app.get('/api', (req, res) => {
    res.send(`
        <div style="font-family:sans-serif; text-align:center; margin-top:50px; background:#f4f4f9; padding:40px; border-radius:10px; max-width:500px; margin-left:auto; margin-right:auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="color:#333;">🚀 محول المواقع إلى PDF السحابي (Vercel)</h2>
            <p style="color:#666;">ضع رابط الموقع بالأسفل ليتم تحويله فوراً وتحميله</p>
            <form action="/api/convert" method="GET">
                <input type="url" name="url" placeholder="https://example.com" style="padding:12px; width:80%; border:1px solid #ccc; border-radius:5px; margin-bottom:15px;" required>
                <br>
                <button type="submit" style="padding:12px 25px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; font-size:16px;">تحويل وتحميل PDF</button>
            </form>
        </div>
    `);
});

app.get('/api/convert', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('برجاء إضافة رابط الموقع');
    }

    let browser;
    try {
        // إعداد متصفح Chromium المخفف المخصص لـ Vercel
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath('https://github.com/sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar'),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.emulateMediaType('screen');

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });

        await browser.close();

        res.contentType("application/pdf");
        res.setHeader('Content-Disposition', `attachment; filename="website.pdf"`);
        return res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        if (browser) await browser.close();
        return res.status(500).send('حدث خطأ في السيرفر: ' + error.message);
    }
});

// تصدير التطبيق ليناسب بيئة Serverless الخاصة بـ Vercel
module.exports = app;
