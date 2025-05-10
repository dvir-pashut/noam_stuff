/* ---------------------------------------------------
   main.js  —  Dynamic S‑3 version
   Author:  Dvir Pashut
---------------------------------------------------- */

const BUCKET   = "https://nessy-site.s3.eu-central-1.amazonaws.com";
const IMG_DIR  = "img/";
const SONG_DIR = "songs/";
const APPROVED_ICON = `./img/approved.png`;

/* ---------- tiny helpers ---------- */
const $ = (id) => document.getElementById(id);
const shuffle = (arr) => arr
  .map(v => [Math.random(), v])
  .sort((a, b) => a[0] - b[0])
  .map(v => v[1]);

/* ---------- DOM refs ---------- */
const player            = $("player");
const playBtn           = $("playBtn");
const letterBtn         = $("letterBtn");
const shuffleGalleryBtn = $("shuffleGalleryBtn");
const gallery           = $("gallery");
const lightbox          = $("lightbox");
const lightboxImg       = $("lightbox-img");
const letterBox         = $("letterBox");
const bg1               = $("bg1");
const bg2               = $("bg2");
const loveTimer         = $("loveTimer");

/* ---------- state ---------- */
let   songs   = [];          // ["Our Song.mp3", ...]
let   images  = [];          // ["1.jpg", "2.jpg", ...]
const queue   = [];          // music shuffle queue
let   currentBg = 1;
let   galleryInterval = null;

/* ===================================================
   1) PUBLIC LIST‑OBJECTS  (XML) ➜ arrays
=================================================== */
async function listS3Objects(prefix, exts) {
  const url = `${BUCKET}/?list-type=2&prefix=${encodeURIComponent(prefix)}`;
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`S‑3 list failed for ${prefix}`);
  const xml  = new DOMParser().parseFromString(await res.text(), "application/xml");
  return Array.from(xml.getElementsByTagName("Key"))
    .map(n => n.textContent)
    .filter(k => exts.some(ext => k.toLowerCase().endsWith(ext)));
}

/* ===================================================
   2)  INITIAL BOOTSTRAP
=================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    [songs, images] = await Promise.all([
      listS3Objects(SONG_DIR, [".mp3"]),
      listS3Objects(IMG_DIR , [".jpg", ".jpeg", ".png", ".gif", ".webp"])
    ]);

    // strip prefixes
    songs  = songs .map(k => k.replace(SONG_DIR, ""));
    images = images.map(k => k.replace(IMG_DIR , ""));

    populateGallery();
    initBackgrounds();
    wireEvents();
    updateLoveTimer();
    setInterval(updateLoveTimer, 1_000);
    setInterval(createHearts,      7_000);
    setInterval(createLoveNotes,  11_000);

  } catch (err) {
    alert("⚠️  לא הצלחתי לקרוא את הקבצים מה‑S3, בדוק הרשאות‑ CORS/Policy");
    console.error(err);
  }
});

/* ===================================================
   3)  GALLERY + LIGHTBOX
=================================================== */
function populateGallery() {
  images.forEach(file => {
    const img = document.createElement("img");
    img.src  = `${BUCKET}/${IMG_DIR}${file}`;
    img.alt  = `תמונה ${file}`;
    img.loading = "lazy";
    img.addEventListener("click", () => showLightbox(img.src));
    gallery.appendChild(img);
  });
}

function showLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add("visible");
}
function hideLightbox() {
  lightbox.classList.remove("visible");
  lightboxImg.src = "";
}
lightbox.addEventListener("click", (e) => e.target === lightbox && hideLightbox());

/* ===================================================
   4)  MUSIC PLAYER
=================================================== */
function showToast(text) {
  let toast = $("nowPlayingToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "nowPlayingToast";
    toast.className = "toast persistent-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = `🎵 ${text.replace(".mp3", "")} 💖`;
}

function playNext() {
  if (!songs.length) return;
  if (!queue.length) queue.push(...shuffle([...songs]));
  const next = queue.shift();
  player.src = `${BUCKET}/${SONG_DIR}${next}`;
  player.play().catch(err => console.warn("Autoplay block:", err));
  showToast(next);
  createHearts();
}
player.addEventListener("ended", playNext);

/* ===================================================
   5)  BACKGROUND CROSS‑FADE
=================================================== */
function getRandomImage() {
  return `${BUCKET}/${IMG_DIR}${images[Math.floor(Math.random()*images.length)]}`;
}
function switchBackground() {
  const next   = currentBg === 1 ? bg2 : bg1;
  const curr   = currentBg === 1 ? bg1 : bg2;
  next.style.backgroundImage = `url("${getRandomImage()}")`;
  next.classList.add("visible");
  curr.classList.remove("visible");
  currentBg = currentBg === 1 ? 2 : 1;
}
function initBackgrounds() {
  bg1.style.backgroundImage = `url("${getRandomImage()}")`;
  bg2.style.backgroundImage = `url("${getRandomImage()}")`;
  setInterval(switchBackground, 7_000);
}

/* ===================================================
   6)  HEARTS ❤️ & LOVE NOTES 💌
=================================================== */
function createHearts() {
  for (let i = 0; i < 22; i++) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = "❤️";
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = 3 + Math.random()*2 + "s";
    heart.style.fontSize = 16 + Math.random()*24 + "px";
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 5_000);
  }
}

function createLoveNotes() {
  const msgs = [
    "את מושלמת 💖", "אני אוהב אותך מלאאאאא 😘", "את החיים שלי ❤️",
    "נסקוש שלי 🥰", "זכיתי בך 💕", "כבר אמרתי שאני מאוהב קשות? 😍"
  ];
  for (let i = 0; i < 15; i++) {
    const note = document.createElement("div");
    note.className = "love-note";
    note.textContent = msgs[Math.floor(Math.random()*msgs.length)];
    note.style.left = Math.random()*100 + "vw";
    note.style.animationDuration = 3 + Math.random()*2 + "s";
    note.style.fontSize = 16 + Math.random()*24 + "px";
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 5_000);
  }
}

/* --------------------------------------------------
   🎉 Approved explosions
-------------------------------------------------- */
function createApprovedExplosions() {
  for (let i = 0; i < 12; i++) {
    const img = document.createElement("img");
    img.src = APPROVED_ICON;
    img.className = "approved-explosion";
    img.style.left = Math.random()*100 + "vw";
    img.style.animationDuration = 3 + Math.random()*2 + "s";
    img.style.width = 40 + Math.random()*40 + "px";
    document.body.appendChild(img);
    setTimeout(() => img.remove(), 5_000);
  }
}

/* ===================================================
   7)  SHUFFLE‑GALLERY SLIDESHOW
=================================================== */
function startGalleryShuffle() {
  if (!images.length) return;
  const shuffled = shuffle([...images]);
  let idx = 0;
  showLightbox(`${BUCKET}/${IMG_DIR}${shuffled[idx++]}`);

  galleryInterval = setInterval(() => {
    if (idx >= shuffled.length) {
      clearInterval(galleryInterval);
      hideLightbox();
      return;
    }
    lightboxImg.src = `${BUCKET}/${IMG_DIR}${shuffled[idx++]}`;
  }, 5_000);
}

/* ===================================================
   8)  MISC  (letter, timer, wiring)
=================================================== */
function hideLetter()   { letterBox.classList.remove("visible"); }
function wireEvents() {
  playBtn          .addEventListener("click", playNext);
  letterBtn        .addEventListener("click", () => letterBox.classList.add("visible"));
  shuffleGalleryBtn.addEventListener("click", () => {
    if (galleryInterval) clearInterval(galleryInterval);
    startGalleryShuffle();
  });
  $("approvedBtn") .addEventListener("click", createApprovedExplosions);
}

const startDate = new Date("2025-03-06T14:26:00");
function updateLoveTimer() {
  const now  = new Date();
  let diff   = Math.floor((now - startDate)/1_000);
  const days    = Math.floor(diff/86_400); diff %= 86_400;
  const hours   = Math.floor(diff/3_600);  diff %= 3_600;
  const mins    = Math.floor(diff/60);     diff %= 60;
  const secs    = diff;
  loveTimer.textContent =
    `מאוהב קשות כבר ${days} ימים ${hours} שעות ${mins} דקות ${secs} שניות`;
}

/* --------------------------------------------------
   9)  UPLOADS  (unique‑name version)
-------------------------------------------------- */

function wireEvents() {
  playBtn          .addEventListener("click", playNext);
  letterBtn        .addEventListener("click", () => letterBox.classList.add("visible"));
  shuffleGalleryBtn.addEventListener("click", () => {
    if (galleryInterval) clearInterval(galleryInterval);
    startGalleryShuffle();
  });
  $("approvedBtn") .addEventListener("click", createApprovedExplosions);

  // ⭐ NEW:
  $("uploadImgBtn") .addEventListener("click", () => uploadFiles("img"));
  $("uploadSongBtn").addEventListener("click", () => uploadFiles("songs"));
}

async function uploadFiles(type) {
  const input = document.createElement("input");
  input.type      = "file";
  input.multiple  = true;
  input.accept    = type === "img" ? "image/*" : "audio/mpeg";

  input.onchange = async () => {
    for (const file of input.files) {
      // --- Build a unique key ------------------------------------------------
      const dir   = type === "img" ? IMG_DIR : SONG_DIR;
      const ext   = file.name.substring(file.name.lastIndexOf("."));          // ".jpg"
      const base  = file.name.substring(0, file.name.lastIndexOf("."));       // "myPic"
      let   key   = `${base}${ext}`;                                          // default
      let   idx   = 1;

      const nameList = type === "img" ? images : songs;                       // existing names
      while (nameList.includes(key)) {                                        // clash?
        key = `${base}_${idx++}${ext}`;                                       // myPic_1.jpg …
      }
      const url  = `${BUCKET}/${dir}${key}`;

      // --- Upload (PUT) ------------------------------------------------------
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (!res.ok) {                                                          // failure
        alert(`❌ Upload failed: ${file.name}`);
        continue;
      }

      // --- Success UX --------------------------------------------------------
      if (type === "img") {
        images.push(key);
        const img = document.createElement("img");
        img.src = url;
        img.loading = "lazy";
        img.alt = "תמונה חדשה";
        img.addEventListener("click", () => showLightbox(img.src));
        gallery.prepend(img);
      } else {
        songs.push(key);
        showToast(`התווסף שיר: ${base}`);
      }
    }
  };

  input.click();
}