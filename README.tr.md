# 9Jarvis 🤖

> Sohbet yapay zekâsı, yerel bellek, araçlar ve deneysel Windows masaüstü etkileşimi sunan modüler kişisel asistan.

**Diller:** [English](README.md) · [فارسی](README.fa.md) · Türkçe

9Jarvis, istekleri anlayabilen, ilgili bağlamı getirebilen, araçları kullanabilen ve Windows masaüstüyle etkileşim kurabilen kişisel bir yapay zekâ asistanını inceleyen herkese açık bir projedir. Bazı özellikler uygulanmıştır; masaüstü etkileşimi hâlâ deneysel olup uygulamaya göre farklı davranabilir.

## Özellikler ve durum

- **Sohbet:** Yanıtlar, mevcut kodda yapılandırılmış `openai/gpt-oss-20b` modeliyle OpenRouter üzerinden üretilir.
- **Agent:** Araçlarla ilgili kararlar, yerel Ollama uyumlu bir uç nokta üzerinden alınır. Varsayılan uç nokta `http://localhost:11434/v1`, varsayılan model ise `qwen3:4b-instruct` şeklindedir.
- **Bellek:** Seçilen kullanıcı ve proje bilgileri yerel `memory.json` dosyasında saklanır ve ilgili bağlamda kullanılabilir.
- **Araçlar:** Hesap makinesi, saat, tarih, rastgele sayı, web araması, coğrafi kodlama, hava durumu, döviz kurları, uygulama ve tarayıcı başlatma, uygulama kapatma ve odaklama, klavye ve fare girişi, kaydırma ve ekran görüntüsü.
- **Görsel analiz:** Ekran görüntüleri, mevcut kodda yapılandırılmış `deepseek/deepseek-v4.1-flash` modeli kullanılarak OpenRouter üzerinden analiz edilebilir.
- **Masaüstü etkileşimi (deneysel):** Windows'a özgü araçlar uygulamaları başlatıp kapatabilir, URL'leri açabilir, ekran görüntüsü alıp analiz edebilir ve desteklenen fare/klavye eylemlerini gerçekleştirebilir. Uygulamalar başlatılıp kapatılabilir; URL'ler yalnızca açılır. Metin girişi, Windows UI Automation kullanarak Notepad metin düzenleyicisini hedefler.

Web araması Tavily kullanır ve API anahtarı gerektirir. Coğrafi kodlama ve hava durumu Open-Meteo API'lerini kullanır. Döviz kurları Frankfurter üzerinden alınır.

## Gereksinimler

- PowerShell yüklü Windows.
- Node.js ve npm.
- Git.
- OpenRouter API anahtarı.
- Agent'ın araç kararları için yapılandırılmış modelle yerel olarak çalışan Ollama.
- Web araması kullanacaksanız Tavily API anahtarı.

Diğer işletim sistemlerinin desteklendiği belgelenmemiştir.

## Kurulum ve yapılandırma

```powershell
git clone https://github.com/Aiakos13/9Jarvis.git
cd 9Jarvis
npm install
Copy-Item .env.example .env
```

Yerel `.env` dosyanızda `OPENROUTER_API_KEY` değerini ayarlayın. Web araması gerekiyorsa `TAVILY_API_KEY` değerini de ekleyin. Agent ayarları `OLLAMA_BASE_URL` ve `OLLAMA_MODEL` değişkenleriyle değiştirilebilir; varsayılan değerler sırasıyla `http://localhost:11434/v1` ve `qwen3:4b-instruct` şeklindedir.

`.env` dosyasını commit etmeyin ve API anahtarlarınızı paylaşmayın. Belgelerde veya ekran görüntülerinde gizli bilgi bulundurmayın.

## Çalıştırma

```bash
npm start
```

Kök dizindeki `package.json` bu komutu `node main.js` olarak tanımlar. Doğrudan `node main.js` komutunu da çalıştırabilirsiniz.

## Testler

Agent test betiğini çalıştırmak için:

```bash
node test-agent.js
```

Betik, ayrıştırma ve yerel araç çağrısı testlerinin sonuçlarını yazdırır. Kök dizindeki `npm test` bu testleri çalıştırmaz; şu anda bir yer tutucudur, mesaj yazdırır ve hata koduyla çıkar.

## Güvenlik ve gizlilik

Masaüstü araçları klavye ve fare girdisi gönderebilir, uygulamaları başlatabilir ve uygulama süreçlerini zorla kapatabilir. Kullanım sırasında denetleyin; hassas veya geri alınamaz işlemler için bu araçlara güvenmeyin. Görsel analiz için gönderilen ekran görüntüleri yapılandırılmış model sağlayıcısı üzerinden işlenir; kullanmadan önce sağlayıcının veri politikalarını inceleyin. Bellek, kişisel bilgiler içerebilecek yerel `memory.json` dosyasında saklanır.

## Sınırlamalar ve yol haritası

Bilgisayar etkileşimi geliştirilmeye devam ediyor. Görsel öğe algılama ve koordinat tabanlı eylemler hatalı olabilir. Mevcut UI Automation uygulaması metin girişi için özellikle Notepad metin düzenleyicisini hedefler; bu, tüm masaüstü uygulamalarında genel UI Automation desteği olduğu anlamına gelmez. Otomasyon iş akışları, sesli etkileşim ve grafik arayüz planlanmıştır; mevcut özellikler değildir.

## Proje lisansı

Depo kökünde şu anda bir lisans dosyası bulunmamaktadır. Kodun yeniden kullanım veya dağıtım için lisanslı olduğunu varsaymayın; önce deponun lisans koşullarını kontrol edin.

Hata bildirimlerinizi ve önerilerinizi [GitHub Issues](https://github.com/Aiakos13/9Jarvis/issues) üzerinden iletebilirsiniz.
