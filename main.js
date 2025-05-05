const songs = [
    "Our Song.mp3",
    "מכה אפורה.mp3",
    "מספיק בן אדם.mp3",
    "צעדים.mp3",
    "Dancing Queen.mp3",
    "רק שלך.mp3",
    "זכיתי לאהוב.mp3",
    "Iris.mp3",
    "Die With A Smile.mp3",
  ];
  
  const player = document.getElementById("player");
  const playBtn = document.getElementById("playBtn");
  const letterBtn = document.getElementById("letterBtn");
  const queue = [];
  
  function shuffle(arr) {
    return arr.map(v => [Math.random(), v])
              .sort((a, b) => a[0] - b[0])
              .map(v => v[1]);
  }
  
  function createHearts() {
    for (let i = 0; i < 18; i++) {
      const heart = document.createElement("div");
      heart.className = "heart";
      heart.textContent = "❤️";
      heart.style.left = Math.random() * 100 + "vw";
      heart.style.animationDuration = (3 + Math.random() * 2) + "s";
      heart.style.fontSize = (16 + Math.random() * 24) + "px";
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 5000);
    }
  }
  function createApprovedExplosions() {
    for (let i = 0; i < 12; i++) {
      const img = document.createElement("img");
      img.src = "./img/approved.png";
      img.className = "approved-explosion";
      img.style.left = Math.random() * 100 + "vw";
      img.style.animationDuration = (3 + Math.random() * 2) + "s";
      img.style.width = (40 + Math.random() * 40) + "px";
      document.body.appendChild(img);
      setTimeout(() => img.remove(), 5000);
    }
  }
  document.getElementById("approvedBtn").addEventListener("click", createApprovedExplosions);

  
  function showToast(text) {
    let toast = document.getElementById("nowPlayingToast");
  
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "nowPlayingToast";
      toast.className = "toast persistent-toast";
      document.body.appendChild(toast);
    }
  
    // Remove the .mp3 suffix from the song name
    const songName = text.replace(".mp3", "");
    toast.textContent = "🎵 " + songName + " 💖";
  }
  
  
  function playNext() {
    if (!queue.length) queue.push(...shuffle([...songs]));
    const next = queue.shift();
    player.src = "./songs/" + next;
    player.play().catch(e => console.warn("Autoplay blocked:", e));
    showToast(next);
    createHearts();
  }
  
  player.addEventListener("ended", playNext);
  playBtn.addEventListener("click", playNext);
  setInterval(createHearts, 10000);
  
  // Gallery & Lightbox
  const gallery = document.getElementById("gallery");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  
  for (let i = 1; i <= 24; i++) {
    const img = document.createElement("img");
    img.src = "./img/" + i + ".jpg";
    img.alt = "תמונה " + i;
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightbox.classList.add("visible");
    });
    gallery.appendChild(img);
  }
  
  function hideLightbox() {
    lightbox.classList.remove("visible");
    lightboxImg.src = "";
  }
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) hideLightbox();
  });
  
  // Letter Popup
  const letterBox = document.getElementById("letterBox");
  letterBtn.addEventListener("click", () => {
    letterBox.classList.add("visible");
  });
  function hideLetter() {
    letterBox.classList.remove("visible");
  }
  letterBox.addEventListener("click", (e) => {
    if (e.target === letterBox) {
      hideLetter();
    }
  });
  
  // Background Transition
  const bg1 = document.getElementById("bg1");
  const bg2 = document.getElementById("bg2");
  let currentBg = 1;
  
  function getRandomImage() {
    return "./img/" + (Math.floor(Math.random() * 24) + 1) + ".jpg";
  }
  
  function switchBackground() {
    const nextBg = currentBg === 1 ? bg2 : bg1;
    const current = currentBg === 1 ? bg1 : bg2;
    nextBg.style.backgroundImage = `url("${getRandomImage()}")`;
    nextBg.classList.add("visible");
    current.classList.remove("visible");
    currentBg = currentBg === 1 ? 2 : 1;
  }
  
  bg1.style.backgroundImage = `url("${getRandomImage()}")`;
  bg2.style.backgroundImage = `url("${getRandomImage()}")`;
  setInterval(switchBackground, 7000);
  
  // 🕒 Timer from 6/3 at 14:26
  const loveTimer = document.getElementById("loveTimer");
  const startDate = new Date("2025-03-06T14:26:00");
  
  function updateLoveTimer() {
    const now = new Date();
    let diff = Math.floor((now - startDate) / 1000);
  
    const days = Math.floor(diff / 86400); diff %= 86400;
    const hours = Math.floor(diff / 3600); diff %= 3600;
    const minutes = Math.floor(diff / 60); diff %= 60;
    const seconds = diff;
  
    loveTimer.textContent =
      `מאוהב קשות כבר ${days} ימים ${hours} שעות ${minutes} דקות ${seconds} שניות`;
  }
  
  setInterval(updateLoveTimer, 1000);
  updateLoveTimer();
  let galleryInterval = null;

  function startGalleryShuffle() {
    const images = Array.from(gallery.querySelectorAll("img"));
    let current = 0;
    const shuffled = shuffle(images);
  
    if (!shuffled.length) return;
  
    lightbox.classList.add("visible");
    lightboxImg.src = shuffled[current++].src; // 🔥 Show first image immediately
  
    galleryInterval = setInterval(() => {
      if (current >= shuffled.length) {
        clearInterval(galleryInterval);
        lightbox.classList.remove("visible");
        return;
      }
      lightboxImg.src = shuffled[current++].src;
    }, 5000); // You already changed this to 5 seconds
  }
  

  shuffleGalleryBtn.addEventListener("click", () => {
    if (galleryInterval) clearInterval(galleryInterval); // so it will not happened twice
    startGalleryShuffle();
  });


  function createLoveNotes() {
    const messages = [
      "את מושלמת 💖",
      "אני אוהב אותך מלאאאאא 😘",
      "את החיים שלי ❤️",
      "נסקוש שלי 🥰",
      "זכיתי בך 💕",
    ];
  
    for (let i = 0; i < 10; i++) {
      const note = document.createElement("div");
      note.className = "love-note";
      note.textContent = messages[Math.floor(Math.random() * messages.length)];
      note.style.left = Math.random() * 100 + "vw";
      note.style.animationDuration = (3 + Math.random() * 2) + "s";
      note.style.fontSize = (16 + Math.random() * 24) + "px";
      document.body.appendChild(note);
      setTimeout(() => note.remove(), 5000);
    }
  }
  
  document.getElementById("approvedBtn").addEventListener("click", () => {
    createApprovedExplosions();
    // createLoveNotes();
  });

//video gallery stuff to add next release 

//   const videoGalleryBtn = document.getElementById("videoGalleryBtn");
// const videoLightbox = document.getElementById("videoLightbox");
// const lightboxVideo = document.getElementById("lightbox-video");

// videoGalleryBtn.addEventListener("click", () => {
//   lightboxVideo.src = "./vid/1.mp4"; // default to first video
//   videoLightbox.classList.add("visible");
// });

// // Click outside video to close
// videoLightbox.addEventListener("click", e => {
//   if (e.target === videoLightbox) hideVideoLightbox();
// });

// function hideVideoLightbox() {
//   videoLightbox.classList.remove("visible");
//   lightboxVideo.pause(); // stop playback
//   lightboxVideo.src = "";
// }

// const videoGallery = document.getElementById("videoGallery");

// for (let i = 1; i <= 5; i++) {
//   const videoThumb = document.createElement("video");
//   videoThumb.src = `./vid/${i}.mp4`;
//   videoThumb.controls = false;
//   videoThumb.muted = true;
//   videoThumb.loop = true;
//   videoThumb.classList.add("video-thumb");

//   videoThumb.addEventListener("click", () => {
//     lightboxVideo.src = `./vid/${i}.mp4`;
//     videoLightbox.classList.add("visible");
//     lightboxVideo.play();
//   });

//   videoThumb.addEventListener("mouseenter", () => videoThumb.play());
//   videoThumb.addEventListener("mouseleave", () => {
//     videoThumb.pause();
//     videoThumb.currentTime = 0;
//   });

//   videoGallery.appendChild(videoThumb);
// }
