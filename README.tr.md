# 🤖 9Jarvis

> Sohbet yapay zekâsını, yerel belleği, araçları ve deneysel Windows masaüstü etkileşimini aşamalı olarak geliştiren modüler kişisel asistan.

**Diller:** English · [فارسی](README.fa.md) · Türkçe

9Jarvis, kişisel yapay zekâ asistanlarının mimarisini araştıran herkese açık bir projedir. Proje geliştirme aşamasındadır: sohbet, yerel bellek ve Agent/araç akışı uygulanmıştır; bilgisayar etkileşimi ise deneysel durumdadır. Otomasyon iş akışları, sesli etkileşim ve grafik arayüz mevcut özellikler değil, gelecek planlarıdır.

## 📑 İçindekiler

- [Genel bakış](#-genel-bakış)
- [Özellikler ve durum](#-özellikler-ve-durum)
- [Mimari](#️-mimari)
- [Gereksinimler ve kurulum](#️-gereksinimler-ve-kurulum)
- [Kullanım](#-kullanım)
- [Testler](#-testler)
- [Güvenlik ve gizlilik](#️-güvenlik-ve-gizlilik)
- [Yol haritası](#️-yol-haritası)
- [Lisans](#-lisans)

## ✨ Genel bakış

9Jarvis modüler mimari ve aşamalı geliştirme yaklaşımını izler:

> **Bir Değişiklik → Test → Sonucu İncele → Sonraki Adım**

Komut satırı uygulaması, OpenRouter üzerinden sohbet modelini yerel Ollama uyumlu Agent ile birleştirir. Agent araçları seçip çalıştırır; araç çağrıları yürütülmeden önce doğrulanır. Seçilen bellek bilgileri yerel bir JSON dosyasında saklanır.

## 🚀 Özellikler ve durum

| Bileşen | Açıklama | Durum |
| --- | --- | --- |
| AI Core | OpenRouter üzerinden sohbet yanıtları | Uygulandı |
| Bellek | Seçilen kullanıcı/proje bilgilerini yerel saklama ve bağlam olarak getirme | Uygulandı |
| Araçlar | Yardımcı araçlar, web araması, hava durumu, döviz ve Windows etkileşimi | Uygulandı; sınırlamaları var |
| Agent | Yerel modelle araç seçimi, doğrulama, yürütme ve sınırlandırılmış çok adımlı döngü | Uygulandı |
| Bilgisayar etkileşimi | Windows uygulama, klavye/fare, ekran görüntüsü ve görsel analiz eylemleri | Deneysel; güvenilirlik değişebilir |
| Otomasyon, ses, GUI | Gelecekteki geliştirmeler | Planlandı |

### Modeller ve servisler

- Sohbet ve son yanıtlar: OpenRouter üzerinden `openai/gpt-oss-20b`.
- Ekran görüntüsü görsel analizi: OpenRouter üzerinden `deepseek/deepseek-v4.1-flash`.
- Agent'ın araç kararları: Yerel Ollama uyumlu API. Varsayılanlar `http://localhost:11434/v1` ve `qwen3:4b-instruct`; ortam değişkenleriyle değiştirilebilir.
- Web araması: Tavily; `TAVILY_API_KEY` gerekir.
- Coğrafi kodlama ve hava durumu: Open-Meteo API'leri.
- Döviz kurları: Frankfurter.

### Kullanılabilir araçlar

`calculator`, `time`, `date`, `random`, `web_search`, `geocode`, `weather`, `currency`, `open_app`, `open_url`, `close_app`, `press_key`, `hotkey`, `focus_app`, `type_text`, `open_default_browser`, `mouse_click`, `mouse_move`, `mouse_double_click`, `scroll` ve `screenshot`.

Uygulama araçları uygulamaları başlatıp kapatabilir; URL araçları adresleri açar, kapatmaz. Metin girişi şu anda Windows UI Automation kullanarak Notepad metin düzenleyicisini hedefler. Bu, tüm masaüstü uygulamalarında genel UI Automation desteği olduğu anlamına gelmez. Görsel algılama ve koordinat tabanlı eylemler hatalı olabilir.

## 🏗️ Mimari

```text
Kullanıcı isteği
    ↓
main.js — CLI, bellek bağlamı ve son yanıt
    ↓
agent.js — yerel Agent araç çağrısına karar verir
    ↓
toolValidator.js — araç ve argümanları doğrular
    ↓
tools.js — işlemi yürütür ve sonucu döndürür
    ↓
Agent döngüsü — devam eder veya biter (adım/yeniden deneme sınırıyla)
```

Temel modüller: `main.js`, `config.js`, `agent.js`, `toolValidator.js`, `tools.js`, `memory.js`, `memoryDetector.js` ve `memoryQueryDetector.js`. Agent, her işlem isteği için en fazla 5 adım ve 2 yeniden denemeyle yapılandırılmıştır.

Bellek, proje çalışma dizinindeki `memory.json` dosyasında tutulur ve kişisel bilgiler içerebilir. Proje klasörünü veya yedeklerini paylaşmadan önce dosyayı inceleyin.

## ⚙️ Gereksinimler ve kurulum

### Gereksinimler

- Windows ve PowerShell (belgelenen masaüstü araçları Windows'a özeldir).
- Node.js ve npm.
- Git.
- OpenRouter API anahtarı.
- Agent'ın araç kararları için yapılandırılmış modelle yerel olarak çalışan Ollama.
- Yalnızca web araması kullanacaksanız Tavily API anahtarı.

### Kurulum

```powershell
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
npm install
Copy-Item .env.example .env
```

Yerel `.env` dosyanızda `OPENROUTER_API_KEY` değerini ayarlayın. `TAVILY_API_KEY` yalnızca web araması kullanacaksanız gerekir. Agent uç noktası ve modeli `OLLAMA_BASE_URL` ve `OLLAMA_MODEL` ile değiştirilebilir; varsayılanlar `http://localhost:11434/v1` ve `qwen3:4b-instruct` şeklindedir.

`.env` dosyasını veya API anahtarlarını commit etmeyin ya da paylaşmayın. Depodaki `.env.example` kullanılabilir kimlik bilgileri değil, yer tutucular içerir.

## 💬 Kullanım

Komut satırı arayüzünü başlatın:

```bash
npm start
```

Kök dizindeki `package.json`, `npm start` komutunu `node main.js` olarak tanımlar. Çıkmak için `exit` yazın.

Örnek istekler:

```text
Saat kaç?
25 * 18
Son haberleri web'de ara
Berlin'de hava nasıl?
Notepad'i aç
```

Web araması Tavily yapılandırması gerektirir. Hava durumu isteği önce coğrafi kodlama, ardından hava durumu API'sini kullanır. Masaüstü örnekleri Windows gerektirir ve gözetim altında kullanılmalıdır.

## 🧪 Testler

Agent ayrıştırma ve yerel araç çağrısı testlerini çalıştırın:

```bash
node test-agent.js
```

Kök dizindeki `npm test` bu betiği **çalıştırmaz**. Şu anda bir yer tutucudur; “Tests have not been configured yet” mesajını yazdırır ve hata koduyla çıkar. Seçili dosyaların sözdizimi `node --check <file>` ile denetlenebilir.

## 🛡️ Güvenlik ve gizlilik

Masaüstü araçları klavye/fare girdisi gönderebilir, uygulamaları başlatabilir ve uygulama süreçlerini zorla kapatabilir. Kullanımı denetleyin; hassas veya geri alınamaz işlemler için bu araçlara güvenmeyin. Görsel analiz için gönderilen ekran görüntüleri yapılandırılmış model sağlayıcısına iletilir. Sağlayıcının veri politikalarını inceleyin ve ekranda özel bilgileri göstermemeye dikkat edin. Yerel bellek `memory.json` dosyasında saklanır ve kişisel bilgiler içerebilir.

## 🗺️ Yol haritası

- Bilgisayar kontrolünün güvenilirliğini artırmak ve eylemlerden sonra sonuçları doğrulamak.
- Daha kapsamlı Windows UI Automation desteğini araştırmak; mevcut Notepad metin girişi dışında bu, tamamlanmış genel bir özellik değildir.
- Otomasyon iş akışları geliştirmek.
- Sesli etkileşimi incelemek.
- Grafik arayüz oluşturmak.

## 📄 Lisans

Depo kökünde şu anda resmi bir lisans dosyası bulunmamaktadır. Kodun yeniden kullanım veya dağıtım için lisanslı olduğunu varsaymayın; önce deponun lisans koşullarını kontrol edin. Hata bildirimleri ve öneriler [GitHub Issues](https://github.com/Aiakos13/9Jarvis/issues) üzerinden iletilebilir.
