# 🤖 9Jarvis

**زبان‌ها:** [English](README.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md)

دستیار هوش مصنوعی شخصی و ماژولاری که با هدف ترکیب مدل‌های زبانی، حافظهٔ پایدار، استفاده از ابزارها و کنترل محیط ویندوز توسعه داده می‌شود.

هدف 9Jarvis ساخت دستیار قابل‌اعتمادی است که بتواند درخواست‌ها را درک کند، اطلاعات را به خاطر بسپارد، تصمیم بگیرد و اقدام کند.

## 📑 فهرست مطالب

- [✨ Overview](#-overview)
- [🚀 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [⚙️ Installation](#️-installation)
- [💬 Usage](#-usage)
- [🧪 Testing](#-testing)
- [🗺️ Roadmap](#️-roadmap)
- [📄 License](#-license)

---

## ✨ Overview

9Jarvis بر پایهٔ معماری ماژولار و توسعهٔ مرحله‌ای ساخته می‌شود.

**روش توسعه:**

`یک تغییر ← آزمایش ← بررسی نتیجه ← مرحله بعد`

## 🚀 Features

| بخش              | توضیحات                                                | وضعیت           |
| ---------------- | ------------------------------------------------------ | --------------- |
| AI Core          | اتصال به مدل‌های هوش مصنوعی از طریق OpenRouter         | پیاده‌سازی شده  |
| Memory           | حافظهٔ محلی و بازیابی اطلاعات                          | پیاده‌سازی شده  |
| Tools            | ماشین‌حساب، جست‌وجوی وب، آب‌وهوا، ارز و ابزارهای سیستم | پیاده‌سازی شده  |
| Agent            | فراخوانی ابزارها و اجرای وظایف چندمرحله‌ای             | پیاده‌سازی شده  |
| Computer Control | تعامل با ویندوز با کمک بینایی ماشین                    | در حال توسعه    |
| Automation       | خودکارسازی وظایف                                       | برنامه‌ریزی‌شده |
| Voice            | تعامل صوتی                                             | برنامه‌ریزی‌شده |
| GUI              | رابط گرافیکی                                           | برنامه‌ریزی‌شده |

**مدل‌های فعلی**

- گفت‌وگو: `openai/gpt-oss-20b`
- بینایی: `deepseek/deepseek-v4.1-flash`

**فناوری‌ها و سرویس‌ها:** Node.js · OpenRouter · Tavily · Open-Meteo · Frankfurter

## 🏗️ Architecture

```text
کاربر
  ↓
هسته هوش مصنوعی
  ↓
حافظه و زمینه
  ↓
Agent
  ↓
اعتبارسنجی ابزار
  ↓
ابزارها و کنترل کامپیوتر
  ↓
پردازش نتیجه
  ↓
پاسخ نهایی
```

**ماژول‌های اصلی:** `main.js` · `agent.js` · `memory.js` · `tools.js` · `toolValidator.js`

## ⚙️ Installation

**پیش‌نیازها:** ویندوز، Node.js، npm، Git، کلید API از OpenRouter و کلید API از Tavily.

**۱. دریافت پروژه**

```bash
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
```

**۲. نصب وابستگی‌ها**

```bash
npm install
```

**۳. تنظیم متغیرهای محیطی**

```powershell
Copy-Item .env.example .env
```

کلیدهای API را در فایل `.env` قرار دهید:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavily_api_key
```

فایل `.env` و کلیدهای API را منتشر نکنید.

## 💬 Usage

اجرای دستیار:

```bash
node main.js
```

نمونه درخواست‌ها:

```text
سلام
ساعت چنده؟
25 * 18
در وب جست‌وجو کن
یک برنامه را باز کن
```

برای خروج، دستور `exit` را وارد کنید.

## 🧪 Testing

اجرای آزمون‌های Agent:

```bash
node test-agent.js
```

**نتیجه فعلی آزمون‌ها:** 19 از 19 موفق.

بررسی صحت دستورات JavaScript:

```bash
node --check main.js
node --check agent.js
node --check tools.js
```

## 🗺️ Roadmap

- [x] هسته هوش مصنوعی
- [x] حافظه پایدار
- [x] سیستم ابزارها
- [x] معماری Agent
- [x] کنترل پایه کامپیوتر
- [ ] Windows UI Automation
- [ ] بررسی و تأیید عملکرد اقدامات
- [ ] خودکارسازی پیشرفته
- [ ] تعامل صوتی
- [ ] رابط گرافیکی

## 📄 License

هنوز مجوز رسمی متن‌باز برای پروژه انتخاب و اضافه نشده است.
