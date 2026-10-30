# syahmi aof — Interactive Canvas Web Experience

Projek ini merupakan pembinaan semula (*reverse-engineered production experience*) berinspirasikan teknologi visual interaktif moden, dijenamakan semula untuk identiti peribadi **syahmi aof**.

🌐 **Live URL:** [https://pod.syahmiaof.my](https://pod.syahmiaof.my)  
⚡ **Mirror URL:** [https://syahmi-pod.vercel.app](https://syahmi-pod.vercel.app)  
👤 **Portfolio:** [https://syahmiaof.my](https://syahmiaof.my)  
🐙 **GitHub:** [https://github.com/syahmiaof](https://github.com/syahmiaof)

---

## 🚀 Ciri Utama

* **Dual-Engine Canvas Animation:**
  * **Canvas 1 (Pod Emerges):** 274 bingkai jujukan WebP diselaraskan dengan GSAP ScrollTrigger (2200×1120).
  * **Canvas 2 (360° Rotation):** 194 bingkai putaran produk 3D interaktif yang lancar mengikut skrol pengguna.
* **GSAP ScrollTrigger & Kinetic Typography:** Morfologi kapsul ke skrin penuh, pinning, dan animasi SplitText karakter demi karakter.
* **Production Rebrand:** Penjenamaan penuh ke identiti syahmi aof tanpa memecahkan hidrasi Next.js SSG.
* **Zero Runtime Overhead:** Disediakan sebagai static deployment berprestasi tinggi di Vercel dengan Cloudflare DNS.

---

## 🛠️ Cara Menjalankan Secara Lokal

```bash
# Clone repo
git clone https://github.com/syahmiaof/syahmi-pod.git
cd syahmi-pod

# Pasang dependency & jalankan server lokal
npm install
npm run dev
```

Buka pelayar di **`http://127.0.0.1:4182`**.

---

## 📜 Dokumentasi & Arkitektur

Sila rujuk `BEDAH_TEKNIKAL.md` untuk perincian seni bina teknikal, saluran frame canvas, formula GSAP scrub, dan analisis bundle.
