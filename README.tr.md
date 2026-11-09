# 🤖 9Jarvis

**Diller:** [English](README.md) · [فارسی](README.fa.md) · [Türkçe](README.tr.md)

Dil modellerini, kalıcı belleği, araç kullanımını ve Windows masaüstü kontrolünü bir araya getirmek amacıyla geliştirilen modüler bir kişisel yapay zekâ asistanı.

9Jarvis'in amacı anlayabilen, hatırlayabilen, karar verebilen ve işlem gerçekleştirebilen güvenilir bir asistan oluşturmaktır.

## 📑 İçindekiler

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

9Jarvis, modüler mimari ve aşamalı geliştirme yaklaşımıyla oluşturulmaktadır.

**Geliştirme yöntemi:**

`Bir Değişiklik → Test → Sonucu İncele → Sonraki Adım`

## 🚀 Features

| Bileşen          | Açıklama                                                           | Durum          |
| ---------------- | ------------------------------------------------------------------ | -------------- |
| AI Core          | OpenRouter üzerinden yapay zekâ modelleri                          | Uygulandı      |
| Memory           | Yerel kalıcı bellek ve bağlam erişimi                              | Uygulandı      |
| Tools            | Hesap makinesi, web araması, hava durumu, döviz ve sistem araçları | Uygulandı      |
| Agent            | Yerel işlev çağrısı ve çok adımlı görev yürütme                    | Uygulandı      |
| Computer Control | Görüntü analiziyle Windows etkileşimi                              | Geliştiriliyor |
| Automation       | Görev otomasyonu                                                   | Planlandı      |
| Voice            | Sesli etkileşim                                                    | Planlandı      |
| GUI              | Grafik arayüz                                                      | Planlandı      |

**Mevcut Modeller**

- Sohbet: `openai/gpt-oss-20b`
- Görüntü: `deepseek/deepseek-v4.1-flash`

**Teknolojiler ve Servisler:** Node.js · OpenRouter · Tavily · Open-Meteo · Frankfurter

## 🏗️ Architecture

```text
Kullanıcı
  ↓
Yapay Zekâ Çekirdeği
  ↓
Bellek ve Bağlam
  ↓
Agent
  ↓
Araç Doğrulama
  ↓
Araçlar / Bilgisayar Kontrolü
  ↓
Sonuç İşleme
  ↓
Yanıt
```

**Temel Modüller:** `main.js` · `agent.js` · `memory.js` · `tools.js` · `toolValidator.js`

## ⚙️ Installation

**Gereksinimler:** Windows, Node.js, npm, Git, OpenRouter API anahtarı ve Tavily API anahtarı.

**1. Depoyu klonlayın**

```bash
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
```

**2. Bağımlılıkları yükleyin**

```bash
npm install
```

**3. Ortam değişkenlerini yapılandırın**

```powershell
Copy-Item .env.example .env
```

API anahtarlarınızı `.env` dosyasına ekleyin:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
TAVILY_API_KEY=your_tavily_api_key
```

`.env` dosyasını veya API anahtarlarını herkese açık şekilde paylaşmayın.

## 💬 Usage

Asistanı başlatın:

```bash
node main.js
```

Örnek istekler:

```text
Merhaba
Saat kaç?
25 * 18
Web'de arama yap
Bir uygulama aç
```

Çıkmak için `exit` yazın.

## 🧪 Testing

Agent testlerini çalıştırın:

```bash
node test-agent.js
```

**Mevcut test sonucu:** 19/19 başarılı.

JavaScript sözdizimini kontrol edin:

```bash
node --check main.js
node --check agent.js
node --check tools.js
```

## 🗺️ Roadmap

- [x] Yapay zekâ çekirdeği
- [x] Kalıcı bellek
- [x] Araç sistemi
- [x] Agent mimarisi
- [x] Temel bilgisayar kontrolü
- [ ] Windows UI Automation
- [ ] İşlem doğrulama
- [ ] Gelişmiş otomasyon
- [ ] Sesli etkileşim
- [ ] Grafik arayüz

## 📄 License

Proje için henüz resmi bir açık kaynak lisansı eklenmemiştir.
