<div align="center">
  <h1>syahmi-pod</h1>
  <p><strong>syahmi aof — Interactive Dual-Canvas Product Animation & Scrollytelling Experience</strong></p>
  <p>
    <a href="https://pod.syahmiaof.my"><img src="https://img.shields.io/badge/Demo-Live-60E1B5?style=for-the-badge&logoColor=60E1B5&labelColor=101713" alt="Demo"></a>
    <a href="https://github.com/syahmiaof/syahmi-pod"><img src="https://img.shields.io/badge/Source-GitHub-60E1B5?style=for-the-badge&logo=github&logoColor=60E1B5&labelColor=101713" alt="GitHub"></a>
    <a href="https://github.com/syahmiaof/syahmi-pod/actions"><img src="https://img.shields.io/badge/CI-Passing-60E1B5?style=for-the-badge&logo=githubactions&logoColor=60E1B5&labelColor=101713" alt="CI"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-All_Rights_Reserved-60E1B5?style=for-the-badge&logoColor=60E1B5&labelColor=101713" alt="License"></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/GSAP-ScrollTrigger-101713?style=for-the-badge&logo=greensock&logoColor=60E1B5" alt="GSAP ScrollTrigger">
    <img src="https://img.shields.io/badge/HTML5-Canvas%202D-101713?style=for-the-badge&logo=html5&logoColor=60E1B5" alt="HTML5 Canvas 2D">
    <img src="https://img.shields.io/badge/WebP-Sequence-101713?style=for-the-badge&logoColor=60E1B5&labelColor=101713" alt="WebP Sequence">
    <img src="https://img.shields.io/badge/Next.js-Static%20Export-101713?style=for-the-badge&logo=nextdotjs&logoColor=60E1B5" alt="Next.js">
  </p>
</div>

---

<div align="center">
  <img src="public/og-preview.jpg" alt="syahmi aof Interactive Canvas Experience Preview" width="100%">
</div>

---

## 🎧 Overview & Visual Engineering

**syahmi-pod** (`pod.syahmiaof.my`) is a high-performance interactive scrollytelling web application engineered by Muhammad Syahmi. It harnesses a synchronized dual-canvas rendering architecture to present photorealistic hardware product reveals and continuous 360-degree rotation scrubbed directly by the user's scroll position.

### Key Value Pillars:
- **Functionality**: Scrub-driven dual-engine canvas system providing seamless transitions between cinematic emergence (274 high-resolution 2200×1120 WebP frames) and interactive 360° product rotation (194 turntable frames) without layout jumps or dropped frames.
- **Aesthetic Excellence**: Organic capsule-to-fullscreen morphing, precision kinetic typography reveals with character-level SplitText animations, and a rich, atmospheric dark palette.
- **Business Impact**: Provides luxury hardware and consumer tech brands with an immersive product showcase that outperforms conventional video embeds through responsive, user-directed pacing.

---

## ⚙️ Architecture & Animation Mechanics

- **Dual-Engine Canvas Architecture**:
  - **Emergence Stage (Canvas 1)**: 274 WebP frames orchestrated via GSAP ScrollTrigger timeline interpolation with custom ease dampening.
  - **Turntable Stage (Canvas 2)**: 194 interactive rotation frames maintaining continuous rotational velocity and memory-efficient bitmap disposal.
- **Kinetic Layout Coordination**: Responsive pinning and scrubbed camera motion synchronized with Next.js static asset pipelines.
- **Technical Analysis**: For mathematical formulas, frame budgets, and bundle performance metrics, see **[BEDAH_TEKNIKAL.md](BEDAH_TEKNIKAL.md)**.

---

## 🚀 Live Production & Infrastructure

- **Live Production URL**: [https://pod.syahmiaof.my](https://pod.syahmiaof.my)
- **Deployment Platform**: Vercel Global Edge Network with Cloudflare DNS
- **Continuous Validation**: Automated GitHub Actions CI workflow executing syntax and build integrity checks on every commit.

---

## 📄 License & Intellectual Property

Proprietary Software. Copyright &copy; 2026 Muhammad Syahmi (`syahmiaof`). All rights reserved.  
Created solely for demonstration and portfolio showcase purposes. See [LICENSE](LICENSE) for details.
