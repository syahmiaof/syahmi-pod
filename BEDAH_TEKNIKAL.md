# Bedah Seni & Seni Bina: Sofi Health (Interactive Canvas Video Scrubbing)

Dokumen ini membedah secara menyeluruh struktur kejuruteraan, seni bina frontend, enjin animasi, dan teknik interaktif laman web rasmi **[Sofi - Sofi Health](https://www.sofihealth.com/)** yang telah di-reverse engineer dan dibina semula ke dalam direktori `ui-sofi`.

---

## 1. Seni Bina Sistem (Architecture Overview)

Laman web Sofi menggabungkan estetika reka bentuk minimalis mewah (*luxury wellness*) dengan keupayaan **Interactive Scroll-Scrubbed Canvas Video**. Elemen produk tidak menggunakan video `<video>` biasa mahupun GIF bersaiz berat, sebaliknya menggunakan **dua saluran kanvas 2D beranimasi tinggi yang dipacu oleh urutan bingkai WebP (Frame Sequences) dan enjin GSAP ScrollTrigger**.

### Ringkasan Stack Teknologi:
* **Asas Framework:** Next.js (SSG / Static Site Generation) dengan rehidrasi reaktif React 18.
* **Pengurusan Kandungan (Headless CMS):** Faust.js + Apollo Client (bersepadu dengan GraphQL backend WordPress).
* **Enjin Animasi & Timeline:** GreenSock Animation Platform (GSAP v3) + **ScrollTrigger** + **SplitText Plugin**.
* **Responsive Breakpoints Engine:** `gsap.matchMedia()` dengan kawalan bersyarat `isMobile` (<=550px / <=650px), `isTablet` (551-1050px), dan `isDesktop` (>=1051px).
* **Enjin Paparan Video:** HTML5 2D Canvas (`<canvas>`) dengan teknik *dynamic aspect-ratio scaling* dan *preloaded image buffer array*.
* **Format Imej & Bingkai:** Google WebP (*lossy compression* dengan alpha transparency) beresolusi tinggi.
* **Tipografi:** *Helvetica Now Display Medium* yang dimampatkan ke format WOFF2 (diiringi fallback sistem sans-serif).

---

## 2. Bedah Dua Enjin Kanvas Utama (Dual-Canvas Scrubbing Pipelines)

Rahsia utama kelicinan visual laman web ini terletak pada dua bahagian kanvas berikut:

```
┌────────────────────────────────────────────────────────────────────────┐
│  SOFI DUAL-CANVAS PIPELINE                                             │
├────────────────────────────────┬───────────────────────────────────────┤
│  CANVAS 1: WaterStickVideo     │  CANVAS 2: Stick (360° Rotation)      │
│  - 274 Bingkai WebP            │  - 194 Bingkai WebP                   │
│  - Resolusi Dalaman: 2200x1120 │  - Resolusi Dalaman: 298x1250         │
│  - Morfologi Pill ke Fullscreen│  - Pinning Statik & Feature Callouts  │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

### A. Kanvas 1: "WaterStickVideo" (Pod Emergence dari Air)

* **Elemen DOM:** `<canvas class="WaterStickVideo_canvas01__VBd88"></canvas>`
* **Lokasi Urutan Bingkai:** `/images/video_pod_emerges/0007.webp` hingga `0280.webp` (sejumlah **274 bingkai berkembar**).
* **Resolusi Render Asal:** Lebar `2200px`, Tinggi `1120px` (nisbah `~1.96:1`).
* **Mekanisme Morfologi Bentuk (Morphing Container):**
  1. Kontainer pembungkus kanvas (`.canvas__holder`) bermula sebagai bentuk kapsul (*pill*) bersaiz `800px x 1640px` dengan `borderRadius: 400px`.
  2. Apabila pengguna menatal ke bawah:
     * Teks tajuk `#fillText1` dan `#fillText` dipecahkan kepada karakter demi karakter menggunakan **GSAP SplitText** (`lines, words, chars`).
     * Warna teks disongsangkan (*invert scrub*) daripada telus kepada putih padu mengikut laju skrol.
     * Logo bulan sabit (*Sofi Moon SVG*) memudar masuk secara serentak.
     * Kontainer kapsul membesar daripada `width: 800px` menjadi `width: 100vw` (skrin penuh) dan `borderRadius` bertukar daripada `400px` kepada `0px`.
     * Objek kawalan `{ frame: 0 }` dianimasikan sehingga bingkai `273` dengan parameter `{ snap: "frame", delay: -0.2, duration: 2.5 }`.
     * Setiap kali bingkai berubah (`onUpdate`), fungsi melukis membersihkan kanvas (`ctx.clearRect`) dan melukis bingkai aktif (`ctx.drawImage`).

---

### B. Kanvas 2: "Stick" (Anatomi Pod & Putaran 360°)

* **Elemen DOM:** `<canvas class="Stick_canvas02__3LIvl"></canvas>`
* **Lokasi Urutan Bingkai:** `/images/video_pod_rotation/0001.webp` hingga `0194.webp` (sejumlah **194 bingkai putaran 3D penuh**).
* **Resolusi Render Asal:** Lebar `298px`, Tinggi `1250px` (nisbah pod menegak yang sangat ramping).
* **Mekanisme Penatalan Bersilang (Cross-Scrubbed Callouts):**
  1. Seksyen `.stick__pin__holder` dipasak (*pinned*) selama `+550%` jarak tatalan desktop atau `+480%` tablet/mobile.
  2. Apabila skrol bergerak:
     * Kanvas memutarkan batang pod (*smart stick*) mengelilingi paksi Y.
     * Garisan penunjuk dan titik interaktif (`.featureDividerDot` & `.featureDividerLine`) memanjang menyentuh ciri-ciri peranti:
       - **Sentuhan Dos Pintar (*Touch to dose*)**
       - **Sambungan Bluetooth Tenaga Rendah (*BLE Connectivity*)**
       - **Kapsul Botani Boleh Tukar (*Interchangeable Pod*)**
       - **Bateri Tahan Berminggu-minggu (*Long Life Battery*)**
     * Teks penerangan bergerak secara serentak masuk dan keluar dengan kesan paralaks berasaskan kelas CSS `Stick_stickParagraphOne__6xbxH` dan `Stick_stickParagraphTwo__YL8Uc`.

---

## 3. Bedah Tipografi & Seni Bina Visual Lain

1. **Tipografi Eksklusif:**
   * Menggunakan muka taip **Helvetica Now Display Medium** (`font.588583f4.woff2`).
   * Saiz tajuk besar menggunakan skala `clamp(2.5rem, 5vw, 6rem)` dengan `letter-spacing: -0.04em` untuk memberikan aura editorial majalah mewah.
2. **Koleksi Botani / Formulations Section:**
   * Memaparkan 3 ramuan teras:
     - **Valerian (*Valeriana officinalis*):** Fokus tidur dengan peningkatan kualiti ~51%.
     - **Passiflora (*Passiflora incarnata*):** Ketenangan minda + tidur dengan kesan 2.1× ganda.
     - **Ashwagandha (*Withania somnifera*):** Melegakan tekanan dengan skor >95%.
   * Ilustrasi passiflora dengan ikon (`passiflora_with_icons.webp`) menggunakan tata letak grid berlapis dengan bayang-bayang lembut (*ambient occlusion blur*).
3. **Ekosistem Aplikasi Sofi (Mobile App Sync):**
   * Antara muka aplikasi telefon pintar (`iphone_mockup.982a2e38.webp`) digabungkan dengan gelembung data harian (`app_bubbles_no_mockup.6cc97de2.webp`) dan graf skor tidur (`app_score_no_mockup.cf4d0b9a.webp`).
4. **Program Langganan Komuniti (*Pioneer Program*):**
   * Blok kad pelan interaktif untuk kit permulaan dan bekalan bulanan dengan lencana status aktif.

---

## 4. Cara Menjalankan & Bereksperimen Secara Lokal

Semua kod, fail konfigurasi, bundle pengeluaran, fail fon, serta **508+ aset WebP & urutan bingkai lengkap** telah dibina semula dan diselaraskan ke dalam subfolder:
`c:\Users\USER\Desktop\ui-gempak\ui-sofi`

### Langkah Menjalankan:

1. Buka terminal (PowerShell atau Command Prompt) di dalam folder `ui-sofi`:
   ```powershell
   cd C:\Users\USER\Desktop\ui-gempak\ui-sofi
   npm run dev
   ```
2. Buka pelayar web pilihan anda:
   👉 **`http://127.0.0.1:4182`**

Server lokal khusus (`server.js`) yang dibina sedia mengendalikan:
* Resolusi imej segera bagi endpoint Next.js `/_next/image?url=...` tanpa perlukan enjin pemprosesan luaran.
* Penghantaran fon format WOFF2 dengan tajuk MIME `font/woff2`.
* Pengepala CORS terbuka untuk membolehkan eksperimen kanvas WebGL/2D tanpa sekatan *tainted canvas*.

---

## 5. Idea Eksperimen yang Boleh Anda Cuba

1. **Ubah Kelajuan Scrubbing Kanvas (Timeline Tuning):**
   * Buka fail `public/_next/static/chunks/pages/_app-25ad7f4542810d4b.js`.
   * Cari perkataan `scrub:.5` atau `end:"+=350%"`.
   * Tukar nilai `scrub: 1.2` untuk rasa seretan yang lebih lembap (*buttery inertial drag*), atau tukar jarak `end` untuk memendekkan/memanjangkan durasi animasi.
2. **Ubah Suai Salinan Teks (Copywriting):**
   * Cari frasa `"sofi measures the impact of plants to improve the way we feel & sleep"` di dalam fail `public/index.html` dan `_app-25ad7f4542810d4b.js`.
   * Gantikan dengan jenama atau teks slogan anda sendiri (cth: *"herba pintar untuk kesihatan minda anda"*).
3. **Tukar Palet Warna & Tema Gelap/Cerah:**
   * Buka `public/_next/static/css/a977a075aa37aa9e.css`.
   * Ubah warna latar belakang `.WaterStickVideo_waterStickVideo__cc5Zt` atau kecerunan butang `.CtaButton_ctaButton__6Nprt`.
4. **Gantikan Bingkai Kanvas Sendiri:**
   * Masukkan fail WebP anda sendiri ke dalam `public/images/video_pod_rotation/` dengan nama nombor berturutan (`0001.webp` hingga `0194.webp`) untuk menghasilkan efek pusingan produk 3D anda sendiri!
