import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";
// DEĞİŞTİRİLDİ: Vite constructor hatalarını önlemek için doğrudan paketi çağırdık.
import SimpleLightbox from "simplelightbox"; 
import "simplelightbox/dist/simple-lightbox.min.css";
// YENİ EKLENDİ: Fetch yerine HTTP istekleri için Axios kütüphanesini kullanıyoruz.
import axios from "axios";

const form = document.querySelector(".search-form");
const gallery = document.querySelector(".gallery");
const loader = document.querySelector(".loader");
// YENİ EKLENDİ: Sayfalandırma için "Load More" butonunu seçtik.
const loadMoreBtn = document.querySelector(".load-more"); 

// YENİ EKLENDİ: Uygulamanın hafızasını (Global State) oluşturduk.
// Sayfalandırma yapabilmek için hangi kelimeyi arattığımızı ve kaçıncı sayfada olduğumuzu aklımızda tutmalıyız.
let lightbox = null;
let currentPage = 1; 
let currentSearchQuery = "";
const perPage = 40; // API'den her istekte 40 resim getirmesini isteyeceğiz.

// DEĞİŞMEDİ: Gelen veriyle HTML kartı oluşturan şablon fonksiyonumuz aynı kaldı.
function createGalleryCard(image) {
  return `
    <li class="gallery-item">
      <a class="gallery-link" href="${image.largeImageURL}">
        <img class="gallery-image" src="${image.webformatURL}" alt="${image.tags}" />
        <div class="info">
          <p>❤️ ${image.likes}</p>
          <p>👁️ ${image.views}</p>
          <p>💬 ${image.comments}</p>
          <p>⬇️ ${image.downloads}</p>
        </div>
      </a>
    </li>
  `;
}

// DEĞİŞTİRİLDİ: Fetch zincirleri (.then/.catch) yerine modern asenkron (async/await) yapıya geçildi.
// YENİ EKLENDİ: URL parametrelerine "page" ve "per_page" özellikleri eklendi.
async function fetchImages(searchTerm, page) {
  const params = new URLSearchParams({
    key: "55936108-136129e505e09c12d0f22cc5e",
    q: searchTerm,
    image_type: "photo",
    orientation: "horizontal",
    safesearch: true,
    page: page,
    per_page: perPage,
  });

  // Axios ile istek atıp cevabı bekliyoruz, ardından doğrudan datayı döndürüyoruz.
  const response = await axios.get(`https://pixabay.com/api/?${params}`);
  return response.data;
}

// YENİ EKLENDİ: DOM'a çizim yapma işini ayrı bir fonksiyona çıkartarak kodu modülerleştirdik.
function renderGallery(images) {
  const markup = images.map(image => createGalleryCard(image)).join("");
  gallery.insertAdjacentHTML("beforeend", markup);
}

// YENİ EKLENDİ: Koleksiyonun (Arama sonuçlarının) bitip bitmediğini kontrol eden fonksiyon.
function checkIfMoreAvailable(totalHits) {
  // Toplam sonuç sayısını bir sayfadaki resim sayısına bölüp yukarı yuvarlıyoruz (Örn: 100 / 40 = 3 sayfa)
  const maxPage = Math.ceil(totalHits / perPage);
  
  // Eğer bulunduğumuz sayfa maksimum sayfaya ulaştıysa veya onu geçtiyse butonu sakla, uyarı ver.
  if (currentPage >= maxPage) {
    loadMoreBtn.classList.add("hidden");
    iziToast.info({
      message: "We're sorry, but you've reached the end of search results.",
      position: "topRight",
    });
  } else {
    // Hala sayfa varsa butonu görünür yap.
    loadMoreBtn.classList.remove("hidden");
  }
}

// YENİ EKLENDİ: Yeni resimler yüklendiğinde sayfayı yumuşak bir şekilde aşağı kaydıran fonksiyon.
function smoothScroll() {
  const galleryItem = document.querySelector('.gallery-item');
  if (!galleryItem) return; // Galeride eleman yoksa hata vermemesi için işlemden çık.

  // getBoundingClientRect() ile mevcut bir kartın ekrandaki piksel yüksekliğini buluyoruz.
  const { height: cardHeight } = galleryItem.getBoundingClientRect();
  
  // Bulduğumuz yüksekliğin iki katı kadar (2 kart boyu) sayfayı aşağı kaydırıyoruz.
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

// DEĞİŞTİRİLDİ: Lightbox kurulumunu Vite hatalarını engelleyecek şekilde ayrı bir fonksiyona çıkardık.
function initOrUpdateLightbox() {
  if (!lightbox) {
    const LightboxClass = typeof SimpleLightbox === "function" ? SimpleLightbox : SimpleLightbox.default;
    
    lightbox = new LightboxClass(".gallery-link", {
      captionsData: "alt",
      captionDelay: 250,
    });
  } else {
    lightbox.refresh(); // Eski ödevde de olan mevcut lightbox'u güncelleme metodu.
  }
}

// DEĞİŞTİRİLDİ: İlk arama formu gönderimi asenkron (async) hale getirildi.
form.addEventListener("submit", async event => {
  event.preventDefault();

  currentSearchQuery = form.elements.searchQuery.value.trim();
  if (!currentSearchQuery) return;

  // YENİ EKLENDİ: Yeni bir kelime arandığında eski aramaya ait sayfa hafızasını 1'e ve galeriyi sıfırlıyoruz.
  currentPage = 1;
  gallery.innerHTML = "";
  loadMoreBtn.classList.add("hidden"); // İstek atılırken butonu gizle.
  loader.classList.remove("hidden"); // İstek atılırken animasyonu göster.

  // YENİ EKLENDİ: Hata yakalama işlemleri için Try...Catch bloğu kullanıldı.
  try {
    const data = await fetchImages(currentSearchQuery, currentPage);

    if (data.hits.length === 0) {
      iziToast.error({
        message: "Sorry, there are no images matching your search query. Please try again!",
        position: "topRight",
      });
      return;
    }

    renderGallery(data.hits); // Yeni fonksiyonu çağırdık
    initOrUpdateLightbox(); // Lightbox'ı başlattık
    checkIfMoreAvailable(data.totalHits); // Başka sayfa var mı diye kontrol ettik
  } catch (error) {
    iziToast.error({
      message: `Error: ${error.message}`,
      position: "topRight",
    });
  } finally {
    // İstek ister başarılı olsun ister hatalı çöksün, en sonunda loader animasyonunu kapat.
    loader.classList.add("hidden");
  }
});

// TAMAMEN YENİ EKLENDİ: "Load More" (Daha Fazla Yükle) butonuna basıldığında çalışacak olay dinleyicisi.
loadMoreBtn.addEventListener("click", async () => {
  currentPage += 1; // Hafızadaki sayfa numarasını 1 artır.
  loadMoreBtn.classList.add("hidden"); // Yüklenirken butonu geçici olarak gizle.
  loader.classList.remove("hidden"); // Loader animasyonunu başlat.

  try {
    // Aratılan aynı kelimeyle ama artırılmış YENİ sayfa numarasıyla API'ye tekrar istek at.
    const data = await fetchImages(currentSearchQuery, currentPage);
    renderGallery(data.hits); // Gelen YENİ resimleri HTML'deki ESKİ resimlerin BİTİMİNE ekle.
    initOrUpdateLightbox(); // Eklenen yeni resimleri tıklanabilir yapmak için Lightbox'ı güncelle.
    
    smoothScroll(); // Kullanıcı rahat görsün diye sayfayı hafifçe aşağı kaydır.
    checkIfMoreAvailable(data.totalHits); // Sayfalar tamamen bittiyse butonu bir daha açılmamak üzere gizle.
  } catch (error) {
    iziToast.error({
      message: `Error: ${error.message}`,
      position: "topRight",
    });
  } finally {
    loader.classList.add("hidden");
  }
});