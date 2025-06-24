/* ---------------------------------------------------
   main.js  —  Dynamic S‑3 version (with toast player)
   Author:  Dvir Pashut
---------------------------------------------------- */

const BUCKET   = "https://nessy-site.s3.eu-central-1.amazonaws.com";
const IMG_DIR  = "img/";
const VID_DIR  = "videos/";
const SONG_DIR = "songs/";
const APPROVED_ICON = `./img/approved.png`;

const $ = (id) => document.getElementById(id);
const shuffle = (arr) => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

const player            = $("player");
const playBtn           = $("playBtn");
const letterBtn         = $("letterBtn");
const shuffleGalleryBtn = $("shuffleGalleryBtn");
const gallery           = $("gallery");
const videoGallery      = $("videoGallery");
const videosTab         = $("videosTab");
const imagesTab         = $("imagesTab");
const lightbox          = $("lightbox");
const lightboxImg       = $("lightbox-img");
const lightboxVid       = $("lightbox-video");
const letterBox         = $("letterBox");
const bg1               = $("bg1");
const bg2               = $("bg2");
const loveTimer         = $("loveTimer");
const sofSofTimer       = $("sofSofTimer");
const thailandTimer     = $("thailandTimer");

let songs = [];
let images = [];
let videos = [];
const queue = [];
let currentBg = 1;
let galleryInterval = null;


/* ===================================================
   1) S3 LISTING
=================================================== */
async function listS3Objects(prefix, exts) {
  const url = `${BUCKET}/?list-type=2&prefix=${encodeURIComponent(prefix)}`;
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`S‑3 list failed for ${prefix}`);
  const xml = new DOMParser().parseFromString(await res.text(), "application/xml");
  return Array.from(xml.getElementsByTagName("Key"))
    .map(n => n.textContent)
    .filter(k => exts.some(ext => k.toLowerCase().endsWith(ext)));
}

/* ===================================================
   2) INIT
=================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    [songs, images, videos] = await Promise.all([
      listS3Objects(SONG_DIR, [".mp3"]),
      listS3Objects(IMG_DIR , [".jpg", ".jpeg", ".png", ".gif", ".webp"]),
      listS3Objects(VID_DIR , [
        ".mp4", ".webm", ".ogg", ".mov", ".mkv", ".avi"
      ])
    ]);

    songs  = songs.map(k => k.replace(SONG_DIR, ""));
    images = images.map(k => k.replace(IMG_DIR , ""));
    videos = videos.map(k => k.replace(VID_DIR , ""));

    populateGallery();
    populateVideoGallery();
    showImages();
    initBackgrounds();
    wireEvents();
    updateLoveTimer();
    updateCountdown(sofSofTimer, sofSofDate, "סוף סוף");
    updateCountdown(thailandTimer, thailandDate, "תאילנד");
    setInterval(updateLoveTimer, 1000);
    setInterval(() => updateCountdown(sofSofTimer, sofSofDate, "סוף סוף"), 1000);
    setInterval(() => updateCountdown(thailandTimer, thailandDate, "תאילנד"), 1000);
    setInterval(createHearts,      7000);
    setInterval(createLoveNotes, 11000);
  } catch (err) {
    alert("⚠️ לא הצלחתי לקרוא את הקבצים מה‑S3, בדוק הרשאות‑CORS/Policy");
    console.error(err);
  }
});

/* ===================================================
   3) GALLERY
=================================================== */
function populateGallery() {
  images.forEach(file => {
    const img = document.createElement("img");
    img.src  = `${BUCKET}/${IMG_DIR}${file}`;
    img.alt  = `תמונה מתוך הגלריה - ${file}`;
    img.loading = "lazy";
    img.addEventListener("click", () => showLightbox(img.src));
    gallery.appendChild(img);
  });
}

function populateVideoGallery() {
  videos.forEach(file => {
    const vid = document.createElement("video");
    vid.src = `${BUCKET}/${VID_DIR}${file}`;
    vid.controls = true;
    vid.style.maxWidth = "100%";
    vid.style.borderRadius = "16px";
    vid.addEventListener("click", () => showLightbox(vid.src, true));
    videoGallery.appendChild(vid);
  });
}

function showLightbox(src, isVideo = false) {
  if (galleryInterval) {
    clearInterval(galleryInterval);
    galleryInterval = null;
  }
  if (isVideo) {
    lightboxImg.style.display = "none";
    lightboxVid.style.display = "block";
    lightboxVid.src = src;
    lightboxVid.play();
  } else {
    lightboxVid.pause();
    lightboxVid.style.display = "none";
    lightboxImg.style.display = "block";
    lightboxImg.src = src;
  }
  lightbox.classList.add("visible");
}
function hideLightbox() {
  lightbox.classList.remove("visible");
  lightboxImg.src = "";
  lightboxVid.pause();
  lightboxVid.src = "";
  if (galleryInterval) {
    clearInterval(galleryInterval);
    galleryInterval = null;
  }
}
lightbox.addEventListener("click", (e) => e.target === lightbox && hideLightbox());

/* ===================================================
   4) MUSIC PLAYER WITH TOAST
=================================================== */
function showPlayerToast(songName) {
  let toast = $("nowPlayingToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "nowPlayingToast";
    toast.className = "toast persistent-toast";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <button id="prevBtn">⏮️</button>
    <button id="togglePlayBtn">⏸️</button>
    <button id="nextBtn">⏭️</button>
    <span><strong>${songName.replace(".mp3", "")}</strong> 💖</span>
  `;

  $("togglePlayBtn").onclick = () => {
    if (player.paused) {
      player.play();
      $("togglePlayBtn").textContent = "⏸️";
    } else {
      player.pause();
      $("togglePlayBtn").textContent = "▶️";
    }
  };

  $("nextBtn").onclick = playNext;

  $("prevBtn").onclick = () => {
    if (player.currentTime > 5) {
      player.currentTime = 0;
    } else {
      if (player.src) {
        const currentSong = decodeURIComponent(player.src.split("/").pop());
        queue.unshift(currentSong);
      }
      queue.unshift(...shuffle([...songs]));
      playNext();
    }
  };
}

function playNext() {
  if (!songs.length) return;
  if (!queue.length) queue.push(...shuffle([...songs]));
  const next = queue.shift();
  player.src = `${BUCKET}/${SONG_DIR}${next}`;
  player.play().catch(err => console.warn("Autoplay block:", err));
  showPlayerToast(next);
  createHearts();
}
player.addEventListener("ended", playNext);

/* ===================================================
   5) BACKGROUND FADE
=================================================== */
function getRandomImage() {
  return `${BUCKET}/${IMG_DIR}${images[Math.floor(Math.random()*images.length)]}`;
}
function switchBackground() {
  const next = currentBg === 1 ? bg2 : bg1;
  const curr = currentBg === 1 ? bg1 : bg2;
  next.style.backgroundImage = `url("${getRandomImage()}")`;
  next.classList.add("visible");
  curr.classList.remove("visible");
  currentBg = currentBg === 1 ? 2 : 1;
}
function initBackgrounds() {
  bg1.style.backgroundImage = `url("${getRandomImage()}")`;
  bg2.style.backgroundImage = `url("${getRandomImage()}")`;
  setInterval(switchBackground, 7000);
}

/* ===================================================
   6) HEARTS + NOTES
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
    setTimeout(() => heart.remove(), 5000);
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
    setTimeout(() => note.remove(), 5000);
  }
}

/* ===================================================
   7) SHUFFLE GALLERY
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
  }, 5000);
}

/* ===================================================
   8) MISC
=================================================== */
function hideLetter() {
  letterBox.classList.remove("visible");
}
function wireEvents() {
  playBtn.addEventListener("click", playNext);
  letterBtn.addEventListener("click", () => letterBox.classList.add("visible"));
  shuffleGalleryBtn.addEventListener("click", () => {
    if (galleryInterval) clearInterval(galleryInterval);
    startGalleryShuffle();
  });
  $("approvedBtn").addEventListener("click", createApprovedExplosions);
  $("uploadImgBtn").addEventListener("click", () => uploadFiles("media"));
  $("uploadSongBtn").addEventListener("click", () => uploadFiles("songs"));
  videosTab.addEventListener("click", showVideos);
  imagesTab.addEventListener("click", showImages);
}

const startDate = new Date("2025-03-06T14:26:00");
const sofSofDate = new Date("2025-10-01T10:00:00");
const thailandDate = new Date("2025-10-09T22:00:00");
function updateLoveTimer() {
  const now = new Date();
  let diff = Math.floor((now - startDate)/1000);
  const days = Math.floor(diff/86400); diff %= 86400;
  const hours = Math.floor(diff/3600); diff %= 3600;
  const mins = Math.floor(diff/60); diff %= 60;
  const secs = diff;
  loveTimer.textContent = `מאוהב קשות כבר ${days} ימים ${hours} שעות ${mins} דקות ${secs} שניות`;
}

function updateCountdown(elem, targetDate, label) {
  const now = new Date();
  let diff = Math.floor((targetDate - now)/1000);
  if (diff < 0) {
    elem.textContent = `${label} הגיע!`;
    return;
  }
  const days = Math.floor(diff/86400); diff %= 86400;
  const hours = Math.floor(diff/3600); diff %= 3600;
  const mins = Math.floor(diff/60); diff %= 60;
  const secs = diff;
  elem.textContent = `${label} בעוד ${days} ימים ${hours} שעות ${mins} דקות ${secs} שניות`;
}

function createApprovedExplosions() {
  for (let i = 0; i < 12; i++) {
    const img = document.createElement("img");
    img.src = APPROVED_ICON;
    img.className = "approved-explosion";
    img.style.left = Math.random()*100 + "vw";
    img.style.animationDuration = 3 + Math.random()*2 + "s";
    img.style.width = 40 + Math.random()*40 + "px";
    document.body.appendChild(img);
    setTimeout(() => img.remove(), 5000);
  }
}

function showVideos() {
  videosTab.classList.add("active");
  imagesTab.classList.remove("active");
  videoGallery.style.display = "grid";
  gallery.style.display = "none";
}

function showImages() {
  imagesTab.classList.add("active");
  videosTab.classList.remove("active");
  gallery.style.display = "grid";
  videoGallery.style.display = "none";
}

/* ===================================================
   9) UPLOAD SUPPORT
=================================================== */
async function uploadFiles(type) {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  if (type === "media") {
    input.accept = "image/*,video/*";
  } else if (type === "img") {
    input.accept = "image/*";
  } else {
    input.accept = "audio/mpeg";
  }

  input.onchange = async () => {
    for (const file of input.files) {
      let dir;
      if (type === "media") {
        dir = file.type.startsWith("video") ? VID_DIR : IMG_DIR;
      } else {
        dir = type === "img" ? IMG_DIR : SONG_DIR;
      }
      const ext = file.name.substring(file.name.lastIndexOf("."));
      const base = file.name.substring(0, file.name.lastIndexOf("."));
      let key = `${base}${ext}`;
      let idx = 1;
      const nameList = dir === IMG_DIR ? images : dir === SONG_DIR ? songs : videos;
      while (nameList.includes(key)) {
        key = `${base}_${idx++}${ext}`;
      }
      const url = `${BUCKET}/${dir}${key}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (!res.ok) {
        alert(`❌ Upload failed: ${file.name}`);
        continue;
      }

      if (dir === IMG_DIR) {
        images.push(key);
        const img = document.createElement("img");
        img.src = url;
        img.loading = "lazy";
        img.alt = "תמונה חדשה";
        img.addEventListener("click", () => showLightbox(img.src));
        gallery.prepend(img);
      } else if (dir === VID_DIR) {
        videos.push(key);
        const vid = document.createElement("video");
        vid.src = url;
        vid.controls = true;
        vid.style.maxWidth = "100%";
        vid.style.borderRadius = "16px";
        vid.addEventListener("click", () => showLightbox(vid.src, true));
        videoGallery.prepend(vid);
      } else {
        songs.push(key);
        showPlayerToast(key);
      }
    }
  };

  input.click();
}
