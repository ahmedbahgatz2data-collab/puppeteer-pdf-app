const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// واجهة بسيطة للاختبار
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family:sans-serif; text-align:center; margin-top:50px; background:#f4f4f9; padding:40px; border-radius:10px; max-width:500px; margin-left:auto; margin-right:auto; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h2 style="color:#333;">🚀 محول المواقع إلى PDF السحابي الاحترافي</h2>
            <p style="color:#666;">ضع رابط الموقع بالأسفل ليتم تحويله فوراً وتحميله</p>
            <form action="/convert" method="GET">
                <input type="url" name="url" placeholder="https://example.com" style="padding:12px; width:80%; border:1px solid #ccc; border-radius:5px; margin-bottom:15px;" required>
                <br>
                <button type="submit" style="padding:12px 25px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer; font-size:16px;">تحويل وتحميل PDF</button>
            </form>
        </div>
    `);
});

app.get('/convert', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('برجاء إضافة رابط الموقع في الـ URL');
    }

    let browser;
    try {
        // تشغيل Puppeteer بالإعدادات الخاصة بالسيرفرات لتجنب مشاكل الصلاحيات
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ]
        });

        const page = await browser.newPage();
        
        // تعيين وقت انتظار مناسب لتحميل الموقع (60 ثانية)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // لتظهر الصفحة بشكلها الحقيقي الموجه للشاشات
        await page.emulateMediaType('screen');

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });

        await browser.close();

        // إرسال الملف مباشرة للمتصفح ليتم تحميله
        res.contentType("application/pdf");
        res.setHeader('Content-Disposition', `attachment; filename="converted_website.pdf"`);
        return res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        if (browser) await browser.close();
        return res.status(500).send('حدث خطأ أثناء معالجة الموقع: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
