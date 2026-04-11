/**
 * Donde en - Application Logic
 * Este archivo manejará la búsqueda, interacciones de la UI,
 * y la comunicación con la API de Google Maps Places.
 */

// NOTA PARA EL USUARIO: Debes rellenar esto antes de usar.
const GOOGLE_MAPS_API_KEY = 'AIzaSyCI2yXSznLRd1eUVjBKQRCtftJlEjG3MdE'; 

// ==========================================
// Variables de estado y elementos del DOM
// ==========================================
let map; // Hidden map for PlacesService
let appMap; // Visible map for Map View
let placesService;
let userLocation = null;
let currentResults = []; // Store current results to toggle views easily
let mapMarkers = [];
let isMapView = false;

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsGrid = document.getElementById('resultsGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const placeModal = document.getElementById('placeModal');
const closeModalBtn = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');
const searchSuggestions = document.querySelectorAll('.suggestion-chip');

// Inputs Search
const btnUseLiveLocation = document.getElementById('btnUseLiveLocation');
const btnClearLocation = document.getElementById('btnClearLocation');
const btnClearSearch = document.getElementById('btnClearSearch');

// Modales y Refresco de Mapa
const btnOpenLocationModal = document.getElementById('btnOpenLocationModal');
const customLocationDisplay = document.getElementById('customLocationDisplay');
const locationModal = document.getElementById('locationModal');
const closeLocationModal = document.getElementById('closeLocationModal');
const locationForm = document.getElementById('locationForm');
const locCityInput = document.getElementById('locCityInput');
const locStreetInput = document.getElementById('locStreetInput');
const btnRefreshMap = document.getElementById('btnRefreshMap');

// Favoritos DOM
const btnOpenFavorites = document.getElementById('btnOpenFavorites');
const favoritesModal = document.getElementById('favoritesModal');
const closeFavoritesModalBtn = document.getElementById('closeFavoritesModal');
const favoritesModalGrid = document.getElementById('favoritesModalGrid');
const emptyFavoritesState = document.getElementById('emptyFavoritesState');

// Auth DOM
const userGreeting = document.getElementById('userGreeting');
const btnAuthLogin = document.getElementById('btnAuthLogin');
const btnAuthLogout = document.getElementById('btnAuthLogout');
const btnUserProfile = document.getElementById('btnUserProfile');
const btnAdminPanel = document.getElementById('btnAdminPanel');

const authModal = document.getElementById('authModal');
const closeAuthModalBtn = document.getElementById('closeAuthModal');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const registerFields = document.getElementById('registerFields');
const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
const btnForgotPassword = document.getElementById('btnForgotPassword');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authName = document.getElementById('authName');
const authPhone = document.getElementById('authPhone');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authTitle = document.getElementById('authTitle');

// Nuevos Elementos Auth 2 Pasos
const authChoiceView = document.getElementById('authChoiceView');
const authFormView = document.getElementById('authFormView');
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const btnShowEmailForm = document.getElementById('btnShowEmailForm');
const btnBackToChoice = document.getElementById('btnBackToChoice');
const btnTogglePassword = document.getElementById('btnTogglePassword');
const eyeOpen = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');

// Dashboards DOM
const searchSection = document.querySelector('.search-section');
const resultsSection = document.querySelector('.results-section');
const userDashboardSection = document.getElementById('userDashboardSection');
const adminDashboardSection = document.getElementById('adminDashboardSection');
const btnBackHomeList = document.querySelectorAll('.btn-back-home');

const userProfileForm = document.getElementById('userProfileForm');
const profileName = document.getElementById('profileName');
const profileEmailText = document.getElementById('profileEmailText');
const profilePhone = document.getElementById('profilePhone');
const btnChangePassword = document.getElementById('btnChangePassword');
const adminUsersTableBody = document.getElementById('adminUsersTableBody');

// View Controls
const viewControls = document.getElementById('viewControls');
const btnListView = document.getElementById('btnListView');
const btnMapView = document.getElementById('btnMapView');
const mapViewContainer = document.getElementById('mapViewContainer');
const resultsMapDiv = document.getElementById('resultsMap');

// Auth State
let currentUser = null; // Guardará el objeto completo del usuario de Firebase
let currentUserData = null; // Guardará el documento de Firestore del usuario
let currentAuthMode = 'login'; 

// Bases de Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================
// i18n
// ==========================================
const i18n = {
    es: {
        subtitle: "Descubre los mejores lugares a tu alrededor",
        search_placeholder: "Ej. empanadas, restaurantes, boliches...",
        search_btn: "Buscar",
        chip_restaurants: "Restaurantes",
        chip_bars: "Bares",
        chip_cafes: "Cafeterías",
        chip_clubs: "Boliches",
        favorites_title: "Tus Favoritos",
        view_list: "Lista",
        view_map: "Mapa",
        loading: "Buscando lugares increíbles...",
        empty_title: "¿Qué se te antoja hoy?",
        empty_subtitle: "Busca cualquier tipo de comida, plan o entretenimiento arriba.",
        error_no_results: "No encontramos lugares con esa búsqueda.",
        error_api: "La conexión con Google Cloud falló u ocurrió un error.",
        login_btn: "Iniciar Sesión",
        logout_btn: "Salir",
        auth_title: "Inicia Sesión o Regístrate",
        auth_submit: "Ingresar",
        auth_mock_note: "Si el email no existe, se creará tu cuenta automáticamente.",
        hello_prefix: "Hola, "
    },
    en: {
        subtitle: "Discover the best places around you",
        search_placeholder: "e.g. burgers, restaurants, clubs...",
        search_btn: "Search",
        chip_restaurants: "Restaurants",
        chip_bars: "Bars",
        chip_cafes: "Cafes",
        chip_clubs: "Clubs",
        favorites_title: "Your Favorites",
        view_list: "List",
        view_map: "Map",
        loading: "Searching for amazing places...",
        empty_title: "What are you craving today?",
        empty_subtitle: "Search for any kind of food, plan or entertainment above.",
        error_no_results: "We couldn't find any places for that search.",
        error_api: "Connection to Google Cloud failed or an error occurred.",
        login_btn: "Login",
        logout_btn: "Logout",
        auth_title: "Log in or Register",
        auth_submit: "Enter",
        auth_mock_note: "If the email doesn't exist, it will be automatically created.",
        hello_prefix: "Hello, "
    }
};

const userLang = (navigator.language || navigator.userLanguage).split('-')[0] === 'en' ? 'en' : 'es';

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[userLang][key]) {
            el.innerHTML = i18n[userLang][key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18n[userLang][key]) {
            el.setAttribute('placeholder', i18n[userLang][key]);
        }
    });

    document.querySelectorAll('[data-query-i18n]').forEach(el => {
        const key = el.getAttribute('data-query-i18n');
        if(userLang === 'en') {
             if(key==='restaurants') el.dataset.query = 'Restaurants';
             if(key==='bars') el.dataset.query = 'Bars';
             if(key==='cafes') el.dataset.query = 'Cafes';
             if(key==='clubs') el.dataset.query = 'Nightclubs';
        } else {
             if(key==='restaurants') el.dataset.query = 'Restaurantes';
             if(key==='bars') el.dataset.query = 'Bares';
             if(key==='cafes') el.dataset.query = 'Cafeterías';
             if(key==='clubs') el.dataset.query = 'Boliches';
        }
    });
}

// Clave para localStorage
const FAVORITES_KEY = 'dondeen_favorites';

// ==========================================
// Inicialización
// ==========================================
function initApp() {
    applyTranslations();

    // Pedir ubicación al usuario opcionalmente en el inicio
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                // Si la API no está lista, guardamos un objeto simple temporal
                userLocation = google?.maps?.LatLng ? new google.maps.LatLng(lat, lng) : { lat, lng };
            }, 
            (error) => console.warn("Geolocalización no disponible:", error.message)
        );
    }
    // Injectar el script de Google Maps dinámicamente si hay una API Key
    if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'TU_API_KEY_AQUI') {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=${userLang}&callback=initMapService`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    } else {
        console.warn("Falta la API KEY de Google Maps. Usando datos de prueba (Mock).");
        // Habilitamos búsqueda simulada
        setupMockEnvironment();
    }

    // Event Listeners
    searchForm.addEventListener('submit', handleSearch);
    
    // Event Listeners for new Location Modal
    if (btnOpenLocationModal) btnOpenLocationModal.addEventListener('click', () => {
        if(locationModal) locationModal.classList.remove('hidden');
    });
    if (closeLocationModal) closeLocationModal.addEventListener('click', () => {
        if(locationModal) locationModal.classList.add('hidden');
    });
    if (locationModal) locationModal.addEventListener('click', (e) => {
        if (e.target === locationModal) locationModal.classList.add('hidden');
    });

    if (locationForm) {
        locationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const city = locCityInput.value.trim();
            const street = locStreetInput.value.trim();
            const fullAddress = street ? `${street}, ${city}` : city;
            
            if (city) {
                if (customLocationDisplay) {
                    customLocationDisplay.textContent = fullAddress;
                    customLocationDisplay.dataset.address = fullAddress;
                    customLocationDisplay.style.display = 'inline';
                }
                if (btnOpenLocationModal) btnOpenLocationModal.textContent = "🌍 Modificar ciudad";
                if (btnClearLocation) btnClearLocation.style.display = 'inline';
                if (locationModal) locationModal.classList.add('hidden');
                if (btnUseLiveLocation) btnUseLiveLocation.textContent = "📍 Usar ubicación actual";
            }
        });
    }

    if (btnClearLocation) {
        btnClearLocation.addEventListener('click', () => {
            if (customLocationDisplay) {
                customLocationDisplay.textContent = '';
                customLocationDisplay.dataset.address = '';
                customLocationDisplay.style.display = 'none';
            }
            if (btnOpenLocationModal) btnOpenLocationModal.textContent = "🌍 Ingresar dirección manual";
            btnClearLocation.style.display = 'none';
            userLocation = null;
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            btnClearSearch.style.display = searchInput.value ? 'block' : 'none';
        });
    }
    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            searchInput.value = '';
            btnClearSearch.style.display = 'none';
            searchInput.focus();
        });
    }
    if (btnUseLiveLocation) {
        btnUseLiveLocation.addEventListener('click', () => {
            if (navigator.geolocation) {
                btnUseLiveLocation.textContent = "Obteniendo...";
                navigator.geolocation.getCurrentPosition((position) => {
                    userLocation = google?.maps?.LatLng ? new google.maps.LatLng(position.coords.latitude, position.coords.longitude) : { lat: position.coords.latitude, lng: position.coords.longitude };
                    if(appMap) appMap.setCenter(userLocation);
                    btnUseLiveLocation.textContent = "📍 Ubicación detectada";
                    if(btnClearLocation) btnClearLocation.style.display = 'none';
                }, () => {
                    btnUseLiveLocation.textContent = "📍 Fallo al obtener ubicación";
                });
            }
        });
    }

    closeModalBtn.addEventListener('click', closeModal);
    placeModal.addEventListener('click', (e) => {
        if (e.target === placeModal) closeModal();
    });
    // Cerrar modal con la tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !placeModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Chips de sugerencia
    searchSuggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            searchInput.value = chip.dataset.query;
            handleSearch(new Event('submit'));
        });
    });

    // Cargar favoritos al inicio
    initAuth();
    loadFavorites();

    // View Controls
    btnListView.addEventListener('click', () => switchView('list'));
    btnMapView.addEventListener('click', () => switchView('map'));

    // Auth Listeners
    btnAuthLogin.addEventListener('click', () => openAuthModal('login'));
    btnAuthLogout.addEventListener('click', handleLogout);
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
    authForm.addEventListener('submit', handleAuthSubmit);
    if(btnForgotPassword) btnForgotPassword.addEventListener('click', handleForgotPassword);
    
    tabLogin.addEventListener('click', () => switchAuthTab('login'));
    tabRegister.addEventListener('click', () => switchAuthTab('register'));

    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });

    // Dashboard Listeners
    btnUserProfile.addEventListener('click', openUserDashboard);
    btnAdminPanel.addEventListener('click', openAdminDashboard);
    btnBackHomeList.forEach(btn => btn.addEventListener('click', showHome));

    userProfileForm.addEventListener('submit', handleProfileUpdate);
    btnChangePassword.addEventListener('click', changeUserPassword);
    
    btnOpenFavorites.addEventListener('click', () => { favoritesModal.classList.remove('hidden'); loadFavorites(); });
    closeFavoritesModalBtn.addEventListener('click', () => favoritesModal.classList.add('hidden'));
    
    favoritesModal.addEventListener('click', (e) => {
        if(e.target === favoritesModal) favoritesModal.classList.add('hidden');
    });
}

// Callback de Google Maps
window.initMapService = function() {
    // Creamos un mapa oculto necesario para inicializar el PlacesService
    const hiddenMapDiv = document.createElement('div');
    map = new google.maps.Map(hiddenMapDiv, {
        center: { lat: -31.4201, lng: -64.1888 }, // Coordenadas por defecto (Centro de Córdoba)
        zoom: 13
    });
    placesService = new google.maps.places.PlacesService(map);
    
    // Configuración del Mapa Visible (Dark Mode, Sin POIs nativos)
    const darkModeStyle = [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
        { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
        { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
    ];

    appMap = new google.maps.Map(resultsMapDiv, {
        center: { lat: -31.4201, lng: -64.1888 },
        zoom: 13,
        styles: darkModeStyle,
        disableDefaultUI: true,
        zoomControl: true,
    });
    
    // Si tenemos geo, nos aseguramos que sea LatLng
    if (userLocation) {
        if (!userLocation.lat.bind) {
            userLocation = new google.maps.LatLng(userLocation.lat, userLocation.lng);
        }
        appMap.setCenter(userLocation);
    }
    
    // Listeners del mapa interactivo para el Refresh
    if (appMap && btnRefreshMap) {
        appMap.addListener('dragend', () => {
            btnRefreshMap.classList.remove('hidden');
        });
        appMap.addListener('zoom_changed', () => {
            btnRefreshMap.classList.remove('hidden');
        });
        
        btnRefreshMap.addEventListener('click', () => {
            userLocation = appMap.getCenter();
            btnRefreshMap.classList.add('hidden');
            if(searchInput.value.trim()) {
                executeSearch(searchInput.value.trim()); // Refresca comercios con nueva coord
            }
        });
    }
    
    console.log("Servicio de Google Maps inicializado correctamente.");
};

// ==========================================
// Utils & Helpers
// ==========================================
function getMockData(query) {
    if (query.toLowerCase().includes("empanada")) {
        return mockPlacesData.filter(p => p.name.toLowerCase().includes("empanada"));
    }
    return mockPlacesData;
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
}

// Funciones de Carrusel y Lightbox
window.scrollCarousel = function(amount) {
    const carousel = document.getElementById('modalCarousel');
    if (carousel) {
        carousel.scrollLeft += amount;
    }
};

window.openLightbox = function(url) {
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImg');
    if (modal && img) {
        img.src = url;
        modal.classList.remove('hidden');
    }
};

window.closeLightbox = function() {
    const modal = document.getElementById('lightboxModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Cerrar Lightbox con click fuera de la imagen
document.getElementById('lightboxModal').addEventListener('click', (e) => {
    if (e.target.id === 'lightboxModal') closeLightbox();
});

// ==========================================
// Lógica de Búsqueda
// ==========================================
function handleSearch(e) {
    if(e) e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    emptyState.classList.add('hidden');
    viewControls.classList.add('hidden');
    resultsGrid.innerHTML = '';
    loadingIndicator.classList.remove('hidden');

    const locQuery = (customLocationDisplay && customLocationDisplay.dataset.address) ? customLocationDisplay.dataset.address.trim() : '';

    if (locQuery && window.google) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: locQuery }, (results, status) => {
            if (status === 'OK' && results[0]) {
                userLocation = results[0].geometry.location;
                if(appMap) {
                    appMap.setCenter(userLocation);
                    appMap.setZoom(15);
                }
            }
            executeSearch(query);
        });
    } else {
        executeSearch(query);
    }
}

function executeSearch(query) {
    const searchQuery = query;
    const searchRadius = 2000;
    let allResultsMap = new Map();

    // Fallback: Centro de Córdoba si no hay ubicación del usuario
    const searchCenter = userLocation || { lat: -31.4167, lng: -64.1833 };

    if (placesService) {
        const textSearchRequest = {
            query: searchQuery,
            fields: ['name', 'geometry', 'formatted_address', 'place_id', 'rating', 'user_ratings_total', 'photos', 'opening_hours', 'business_status'],
            locationBias: { radius: searchRadius, center: searchCenter }
        };

        const nearbyKeywordRequest = {
            location: searchCenter,
            radius: searchRadius,
            keyword: searchQuery
        };

        const nearbyTypeRequest = {
            location: searchCenter,
            radius: searchRadius,
            type: ['cafe', 'restaurant', 'food', 'establishment']
        };

        const fetchTextSearch = () => {
            return new Promise((resolve) => {
                placesService.textSearch(textSearchRequest, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        results.forEach(r => allResultsMap.set(r.place_id, r));
                    }
                    resolve();
                });
            });
        };

        const fetchNearbyKeyword = () => {
            return new Promise((resolve) => {
                placesService.nearbySearch(nearbyKeywordRequest, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        results.forEach(r => {
                            if (!allResultsMap.has(r.place_id)) allResultsMap.set(r.place_id, r);
                        });
                    }
                    resolve();
                });
            });
        };

        const fetchNearbyType = () => {
            const isFoodQuery = /cafe|café|comida|restaurante|pizza|bar/i.test(searchQuery);
            if (!isFoodQuery) return Promise.resolve();

            return new Promise((resolve) => {
                placesService.nearbySearch(nearbyTypeRequest, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                        results.forEach(r => {
                            const matchesKeyword = r.name.toLowerCase().includes(searchQuery.toLowerCase());
                            if (matchesKeyword && !allResultsMap.has(r.place_id)) {
                                allResultsMap.set(r.place_id, r);
                            }
                        });
                    }
                    resolve();
                });
            });
        };

        // Timeout de seguridad para no quedar buscando indefinidamente en móviles (8 segundos)
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 8000));

        Promise.race([
            Promise.all([fetchTextSearch(), fetchNearbyKeyword(), fetchNearbyType()]),
            timeoutPromise
        ]).then((val) => {
            loadingIndicator.classList.add('hidden');
            if (val === 'timeout') {
                console.warn("La búsqueda tardó demasiado, mostrando resultados parciales.");
            }
            
            const mergedResults = Array.from(allResultsMap.values());
            if (mergedResults.length > 0) {
                processAndRenderResults(mergedResults);
            } else {
                renderError(i18n[userLang].error_no_results);
            }
        });

    } else {
        setTimeout(() => {
            loadingIndicator.classList.add('hidden');
            let mockData = getMockData(query);
            processAndRenderResults(mockData);
        }, 1500);
    }
}

function processAndRenderResults(results) {
    const referenceLocation = userLocation || { lat: -31.4167, lng: -64.1833 };
    let uLat = typeof referenceLocation.lat === 'function' ? referenceLocation.lat() : referenceLocation.lat;
    let uLng = typeof referenceLocation.lng === 'function' ? referenceLocation.lng() : referenceLocation.lng;

    results.forEach(p => {
        if(p.geometry && p.geometry.location) {
            let pLat = typeof p.geometry.location.lat === 'function' ? p.geometry.location.lat() : p.geometry.location.lat;
            let pLng = typeof p.geometry.location.lng === 'function' ? p.geometry.location.lng() : p.geometry.location.lng;
            p.distanceKm = getDistance(uLat, uLng, pLat, pLng);
        } else {
            p.distanceKm = 9999;
        }
        p.weightedScore = (p.rating || 0) + (Math.log10((p.user_ratings_total || 0) + 1) * 0.4);
    });
    
    results.sort((a,b) => {
        const aClose = a.distanceKm < 0.6;
        const bClose = b.distanceKm < 0.6;
        if(aClose && !bClose) return -1;
        if(!aClose && bClose) return 1;
        return b.weightedScore - a.weightedScore;
    });
    
    currentResults = results;
    viewControls.classList.remove('hidden');
    
    if(appMap && results.length > 0) {
        appMap.setCenter(referenceLocation || results[0].geometry.location);
    }
    
    renderCurrentView();
}

// ==========================================
// Renderizado UI y Vistas
// ==========================================
function renderCurrentView() {
    if (isMapView) {
        resultsGrid.classList.add('hidden');
        mapViewContainer.classList.remove('hidden');
        renderMarkers();
    } else {
        resultsGrid.classList.remove('hidden');
        mapViewContainer.classList.add('hidden');
        renderResultsList();
    }
}

function switchView(view) {
    if (view === 'map') {
        isMapView = true;
        btnMapView.classList.add('active');
        btnListView.classList.remove('active');
    } else {
        isMapView = false;
        btnListView.classList.add('active');
        btnMapView.classList.remove('active');
    }
    renderCurrentView();
}

function renderResultsList() {
    resultsGrid.innerHTML = '';
    const places = currentResults;

    if (places.length === 0) {
        renderError(i18n[userLang].error_no_results);
        return;
    }

    places.forEach((place, index) => {
        // Obtener la URL de foto, si existe
        let photoUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'; // Fallback genérico
        if (place.photos && place.photos.length > 0) {
            // Si es un objeto real de la API
            if (typeof place.photos[0].getUrl === 'function') {
                photoUrl = place.photos[0].getUrl({ maxWidth: 400 });
            } else {
                photoUrl = place.photos[0]; // (Para el Mock data)
            }
        }

        // Estado abierto/cerrado
        let openStatusHtml = '';
        if (place.opening_hours) {
            const isOpen = typeof place.opening_hours.isOpen === 'function' 
                ? place.opening_hours.isOpen() 
                : place.opening_hours.open_now;
            
            if (isOpen === true) {
                openStatusHtml = '<span class="status-badge open">Abierto Ahora</span>';
            } else if (isOpen === false) {
                openStatusHtml = '<span class="status-badge closed">Cerrado</span>';
            } else {
                openStatusHtml = '<span class="status-badge unknown">Horario no disponible</span>';
            }
        } else {
            openStatusHtml = '<span class="status-badge unknown">Horario no disponible</span>';
        }

        const ratingHTML = place.rating 
            ? `<div class="place-rating">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                 ${place.rating.toFixed(1)} <span style="color:#94a3b8; font-weight:normal; font-size:0.8rem;">(${place.user_ratings_total || 0})</span>
               </div>`
            : '';

        const card = document.createElement('div');
        card.className = 'place-card';
        card.style.animation = `fade-in-up 0.5s ease-out ${index * 0.1}s both`;
        
        const isFav = isFavorite(place.place_id);
            
        // Guardamos los datos completos del lugar en un data-attribute (o scope) para usarlos en el modal.
        card.innerHTML = `
            <img src="${photoUrl}" alt="${place.name}" class="card-image" loading="lazy">
            <button class="favorite-btn ${isFav ? 'is-favorite' : ''}" data-id="${place.place_id}" aria-label="Guardar Favorito">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </button>
            <div class="card-content" style="cursor: pointer;">
                <div class="card-header">
                    <h3 class="place-name">${place.name}</h3>
                    ${ratingHTML}
                </div>
                ${place.distanceKm != null && place.distanceKm < 9999 ? `
                    <div style="font-size:0.85rem; font-weight:bold; margin-bottom:0.8rem; color:${place.distanceKm < 0.6 ? '#10b981' : 'var(--text-muted)'}; display:flex; align-items:center; gap:0.3rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        ${place.distanceKm < 0.6 ? `¡Muy Cerca! A solo ${(place.distanceKm*1000).toFixed(0)} metros` : `${place.distanceKm.toFixed(1)} km de distancia`}
                    </div>
                ` : ''}
                <p class="place-address">${place.formatted_address || place.vicinity || 'Córdoba, Argentina'}</p>
                <div class="card-footer">
                    ${openStatusHtml}
                </div>
            </div>
        `;

        card.querySelector('.card-content').addEventListener('click', () => openPlaceDetails(place, photoUrl, openStatusHtml, ratingHTML));
        card.querySelector('.card-image').addEventListener('click', () => openPlaceDetails(place, photoUrl, openStatusHtml, ratingHTML));
        
        // Manejador del favorito
        card.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(place, photoUrl, openStatusHtml, ratingHTML);
            const btn = e.currentTarget;
            btn.classList.toggle('is-favorite');
        });

        resultsGrid.appendChild(card);
    });
}

function renderError(msg) {
    resultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
            <p>${msg}</p>
        </div>
    `;
    resultsGrid.classList.remove('hidden');
    mapViewContainer.classList.add('hidden');
}

// Markers del Mapa
function clearMarkers() {
    mapMarkers.forEach(m => m.setMap(null));
    mapMarkers = [];
}

function renderMarkers() {
    if (!appMap) return;
    clearMarkers();
    
    // Si no hay resultados, no hace nada extra
    if (!currentResults || currentResults.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    if (userLocation) {
        const userMarker = new google.maps.Marker({
            map: appMap,
            position: userLocation,
            title: "Ubicación Actual",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeWeight: 3,
                strokeColor: "#ffffff"
            },
            zIndex: 999
        });
        mapMarkers.push(userMarker);
        
        // Centrar fuerte al usuario con zoom íntimo
        appMap.setCenter(userLocation);
        appMap.setZoom(17);
    }

    if (!currentResults || currentResults.length === 0) return;

    currentResults.forEach((place) => {
        if (!place.geometry || !place.geometry.location) return;
        
        let photoUrl = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        if (place.photos && place.photos.length > 0) {
            photoUrl = typeof place.photos[0].getUrl === 'function' ? place.photos[0].getUrl({ maxWidth: 400 }) : place.photos[0];
        }

        let openStatusHtml = '';
        if (place.opening_hours) {
            const isOpen = typeof place.opening_hours.isOpen === 'function' ? place.opening_hours.isOpen() : place.opening_hours.open_now;
            openStatusHtml = isOpen === true ? '<span class="status-badge open">Abierto Ahora</span>' : 
                             isOpen === false ? '<span class="status-badge closed">Cerrado</span>' : 
                             '<span class="status-badge unknown">Horario no disponible</span>';
        }

        const ratingHTML = place.rating ? `<div class="place-rating">★ ${place.rating.toFixed(1)}</div>` : '';

        // Extraer formato corto de nombre
        const shortName = place.name.split(' ').slice(0,2).join(' ') + (place.name.split(' ').length > 2 ? '...' : '');

        const rating = place.rating || 0;
        let markerColor = "#94a3b8"; // Default gris
        if (rating >= 4.4) markerColor = "#10b981"; // Verde
        else if (rating >= 4.0) markerColor = "#f59e0b"; // Naranja
        else if (rating > 0) markerColor = "#ef4444"; // Rojo

        const marker = new google.maps.Marker({
            map: appMap,
            position: place.geometry.location,
            title: place.name,
            label: {
                text: rating > 0 ? rating.toFixed(1) : "?",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "bold"
            },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: markerColor,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff"
            }
        });

        marker.addListener("click", () => {
            openPlaceDetails(place, photoUrl, openStatusHtml, ratingHTML);
        });

        mapMarkers.push(marker);
        bounds.extend(place.geometry.location);
    });
    
    if(!bounds.isEmpty()){
        appMap.fitBounds(bounds);
        
        // Listener de una sola vez para ajustar el zoom si fitBounds lo alejó demasiado
        const listener = google.maps.event.addListener(appMap, 'idle', () => {
            if (appMap.getZoom() < 15) {
                appMap.setZoom(16);
                if (userLocation) appMap.setCenter(userLocation);
            }
            google.maps.event.removeListener(listener);
        });
    }
}

// ==========================================
// Detalles del Lugar (Modal)
// ==========================================
function openPlaceDetails(placeContext, imageUrl, statusHtml, ratingHTML) {
    // Si tenemos el servicio, podemos hacer un getDetails para traer número de télefono, website, etc.
    if (placesService && placeContext.place_id) {
        modalBody.innerHTML = '<div class="spinner" style="margin:4rem auto;"></div>';
        placeModal.classList.remove('hidden');

        placesService.getDetails({
            placeId: placeContext.place_id,
            fields: ['name', 'geometry', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'user_ratings_total', 'reviews', 'opening_hours', 'url', 'photos']
        }, (placeDetails, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                renderModalContent(placeDetails, imageUrl, statusHtml, ratingHTML);
            } else {
                // Fallback a info básica si falla el getDetails
                renderModalContent(placeContext, imageUrl, statusHtml, ratingHTML);
            }
        });
    } else {
        // En caso del Mock o si no hay servicio
        renderModalContent(placeContext, imageUrl, statusHtml, ratingHTML);
        placeModal.classList.remove('hidden');
    }
}

function renderModalContent(place, imageUrl, statusHtml, ratingHTML) {
    const phoneHtml = place.formatted_phone_number 
        ? `<li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <a href="tel:${place.formatted_phone_number}">${place.formatted_phone_number}</a>
           </li>` : '';
           
    const webHtml = place.website 
        ? `<li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            <a href="${place.website}" target="_blank">Sitio Web Oficial</a>
           </li>` : '';

    // Direcciones y Mapa Estático
    let mapSnippetHtml = '';
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.formatted_address || place.name)}`;
    
    if (place.geometry && place.geometry.location) {
        const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
        const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
        
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=18&size=600x300&markers=color:red%7C${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
        
        mapSnippetHtml = `
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="map-snippet-container" style="display:block; text-decoration:none; position:relative;">
                <img src="${staticMapUrl}" class="map-snippet-img" alt="Recorte de mapa de ${place.name}">
                <div class="map-snippet-overlay">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>Ver indicaciones en Google Maps</span>
                </div>
            </a>
        `;
    }

    const mapHtml = `<li>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span style="flex-grow:1;">${place.formatted_address || 'Córdoba, Argentina'}</span>
          </li>`;

    // Reseñas
    let reviewsHtml = '';
    window.currentPlaceReviews = [];
    if (place.reviews && place.reviews.length > 0) {
        window.currentPlaceReviews = place.reviews;
        let previewReviews = place.reviews.slice(0, 3);
        
        previewReviews.forEach(r => {
            const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
            reviewsHtml += `
                <div class="review-item" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; margin-bottom: 1rem;">
                    <div style="display:flex; justify-content: space-between; align-items:center;">
                        <strong>${r.author_name}</strong>
                        <span style="color: #fbbf24;">${stars}</span>
                    </div>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-muted);">${r.text}</p>
                </div>
            `;
        });
        
        reviewsHtml += `<button class="primary-btn outline-btn w-100" style="width: 100%; margin-top:1rem;" onclick="openReviewsModal()">Ver Todas las Reseñas</button>`;
    }

    // Horarios
    let scheduleHtml = '';
    if (place.opening_hours && place.opening_hours.weekday_text) {
        scheduleHtml = `<ul style="list-style:none; font-size:0.9rem; color:var(--text-muted); margin-bottom: 1rem;">
            ${place.opening_hours.weekday_text.map(day => `<li style="margin-bottom:0.3rem;">${day}</li>`).join('')}
        </ul>`;
    }

    let photosCarousel = `<img src="${imageUrl}" alt="${place.name}" class="modal-header-img" style="object-fit:cover; width:100%; height:200px; cursor:pointer;" onclick="openLightbox('${imageUrl}')">`;
    if (place.photos && place.photos.length > 1) {
        let extraPhotos = place.photos.slice(0, 8).map(p => {
            let url = typeof p.getUrl === 'function' ? p.getUrl({ maxWidth: 800 }) : p;
            return `<img src="${url}" alt="Foto de ${place.name}" onclick="openLightbox('${url}')" style="height:200px; width:auto; border-radius:12px; flex-shrink:0; object-fit:cover; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">`;
        }).join('');
        
        photosCarousel = `
            <div style="position:relative; background:rgba(0,0,0,0.4);">
                <button onclick="scrollCarousel(-300)" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); z-index:10; background:rgba(0,0,0,0.6); border:none; color:white; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">&#10094;</button>
                <div id="modalCarousel" style="display:flex; overflow-x:auto; gap:1rem; padding:1rem 3.5rem; scroll-behavior:smooth; -ms-overflow-style:none; scrollbar-width:none;">
                    ${extraPhotos}
                </div>
                <button onclick="scrollCarousel(300)" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); z-index:10; background:rgba(0,0,0,0.6); border:none; color:white; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">&#10095;</button>
            </div>
            <style>#modalCarousel::-webkit-scrollbar { display:none; }</style>
        `;
    }

    modalBody.innerHTML = `
        ${photosCarousel}
        <div class="modal-body-content">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h2 class="modal-title">${place.name}</h2>
                    <div class="modal-tags">
                        ${ratingHTML}
                        ${statusHtml}
                    </div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:2rem;">
                
                <!-- Info Section -->
                <div class="detail-section">
                    <h3>Contacto y Acceso</h3>
                    <ul class="contact-list">
                        ${mapHtml}
                        ${phoneHtml}
                        ${webHtml}
                    </ul>
                    
                    ${scheduleHtml ? `
                        <h3 style="margin-top:2rem;">Horarios</h3>
                        ${scheduleHtml}
                    ` : ''}

                    ${mapSnippetHtml}
                </div>

                <!-- Reviews Section -->
                <div class="detail-section">
                    <h3>Reseñas Recientes</h3>
                    ${reviewsHtml ? reviewsHtml : '<p style="color:var(--text-muted);">Aún no hay reseñas o no están disponibles.</p>'}
                </div>

            </div>
        </div>
    `;
}

function closeModal() {
    placeModal.classList.add('hidden');
}

// ==========================================
// EXPANDED REVIEWS MODAL
// ==========================================
const reviewsModal = document.getElementById('reviewsModal');
const closeReviewsModal = document.getElementById('closeReviewsModal');
const reviewsExpandedBody = document.getElementById('reviewsExpandedBody');
const reviewFilterSelect = document.getElementById('reviewFilterSelect');

if(closeReviewsModal) closeReviewsModal.addEventListener('click', () => reviewsModal.classList.add('hidden'));
if(reviewFilterSelect) reviewFilterSelect.addEventListener('change', renderExpandedReviews);
if(reviewsModal) {
    reviewsModal.addEventListener('click', (e) => {
        if(e.target === reviewsModal) reviewsModal.classList.add('hidden');
    });
}

window.openReviewsModal = function() {
    if(reviewsModal) {
        reviewsModal.classList.remove('hidden');
        renderExpandedReviews();
    }
};

function renderExpandedReviews() {
    if(!window.currentPlaceReviews || window.currentPlaceReviews.length === 0) return;
    
    let revs = [...window.currentPlaceReviews];
    const filter = reviewFilterSelect ? reviewFilterSelect.value : 'relevant';
    
    if(filter === 'highest') {
        revs.sort((a,b) => b.rating - a.rating);
    } else if (filter === 'lowest') {
        revs.sort((a,b) => a.rating - b.rating);
    } // relevant / newest can be default fallback for Google places sort behavior

    let html = '';
    revs.forEach(r => {
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        html += `
            <div class="review-item" style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 1rem;">
                <div style="display:flex; justify-content: space-between; align-items:center;">
                    <strong style="color: var(--text-main); font-size:1.1rem;">${r.author_name}</strong>
                    <span style="color: #fbbf24; font-size:1.1rem;">${stars}</span>
                </div>
                <p style="font-size: 0.85rem; color: var(--primary); margin: 0.2rem 0 0.8rem 0;">${r.relative_time_description || 'Hace poco'}</p>
                <p style="font-size: 1rem; color: var(--text-muted); line-height: 1.5;">${r.text || 'Sin comentario escrito.'}</p>
            </div>
        `;
    });
    
    if(reviewsExpandedBody) reviewsExpandedBody.innerHTML = html;
}


// ==========================================
// Base de Datos Simulada y Autenticación
// ==========================================

function getUsers() {
    const users = localStorage.getItem('dondeen_users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('dondeen_users', JSON.stringify(users));
}

function initAuth() {
    // Escuchar cambios de estado en Firebase
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            // Cargar datos extra del perfil desde Firestore
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists) {
                currentUserData = doc.data();
            } else {
                // Si no tiene perfil (ej. migrado recientemente), crear uno básico
                currentUserData = { name: user.displayName || user.email.split('@')[0], email: user.email, role: 'user' };
            }
            
            // Lógica de Migración Automática: Buscar favoritos viejos en PC
            await migrateLocalFavorites(user.email, user.uid);
            
            updateUIForLogin();
            loadFavorites();
        } else {
            currentUser = null;
            currentUserData = null;
            updateUIForLogin();
            loadFavorites();
        }
    });
}

async function migrateLocalFavorites(email, uid) {
    const oldKey = `dondeen_favorites_${email}`;
    const oldFavs = localStorage.getItem(oldKey);
    
    if (oldFavs) {
        try {
            const favsArray = JSON.parse(oldFavs);
            if (favsArray && favsArray.length > 0) {
                console.log("Migrando favoritos locales a la nube para:", email);
                const batch = db.batch();
                favsArray.forEach(fav => {
                    const docRef = db.collection('users').doc(uid).collection('favorites').doc(fav.place_id);
                    batch.set(docRef, fav);
                });
                await batch.commit();
                console.log("Migración completada exitosamente.");
            }
            // Borramos de localStorage para no volver a migrar
            localStorage.removeItem(oldKey);
        } catch (e) {
            console.error("Error en migración:", e);
        }
    }
}

function updateUIForLogin() {
    if (currentUser) {
        const nameToShow = currentUserData ? currentUserData.name.split(' ')[0] : currentUser.email.split('@')[0];
        
        userGreeting.textContent = i18n[userLang].hello_prefix + nameToShow;
        userGreeting.classList.remove('hidden');
        btnAuthLogin.classList.add('hidden');
        btnAuthLogout.classList.remove('hidden');
        btnUserProfile.classList.remove('hidden');
        btnOpenFavorites.classList.remove('hidden');

        // Lógica de Admin
        if (currentUserData && currentUserData.role === 'admin') {
            btnAdminPanel.classList.remove('hidden');
        } else {
            btnAdminPanel.classList.add('hidden');
        }

        // Lógica de Influencer
        const influencerPanel = document.getElementById('influencerPanel');
        if (currentUserData && currentUserData.is_influencer && currentUserData.is_approved) {
            if(influencerPanel) {
                influencerPanel.classList.remove('hidden');
                loadInfluencerDashboardData();
            }
        } else if(influencerPanel) {
            influencerPanel.classList.add('hidden');
        }

    } else {
        userGreeting.classList.add('hidden');
        btnAuthLogin.classList.remove('hidden');
        btnAuthLogout.classList.add('hidden');
        btnUserProfile.classList.add('hidden');
        btnOpenFavorites.classList.add('hidden');
        btnAdminPanel.classList.add('hidden');
    }
}

async function loadInfluencerDashboardData() {
    if (!currentUser) return;
    document.getElementById('influencerInsta').value = currentUserData.instagramHandle || '';
    document.getElementById('influencerPhoto').value = currentUserData.photoUrl || '';
    loadMyRecommendations();
}

async function loadMyRecommendations() {
    const list = document.getElementById('myRecommendationsList');
    if (!list) return;
    list.innerHTML = 'Cargando tus recomendaciones...';
    
    try {
        const snapshot = await db.collection('influencer_recs')
            .where('influencerId', '==', currentUser.uid)
            .get();
        
        if (snapshot.empty) {
            list.innerHTML = '<p style="color:var(--text-muted);">Aún no has cargado recomendaciones.</p>';
            return;
        }

        let html = '<h5 style="margin-bottom:1rem;">Tus recomendaciones actuales:</h5>';
        snapshot.forEach(doc => {
            const r = doc.data();
            html += `
                <div class="res-card" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:var(--primary);">${r.placeName}</strong>
                        <p style="font-size:0.8rem; margin:0;">${r.comment.substring(0, 50)}...</p>
                    </div>
                    <button class="action-btn delete" onclick="deleteRecommendation('${doc.id}')">🗑</button>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (e) {
        list.innerHTML = 'Error al cargar.';
    }
}

window.deleteRecommendation = async function(id) {
    if (confirm("¿Borrar esta recomendación?")) {
        await db.collection('influencer_recs').doc(id).delete();
        loadMyRecommendations();
    }
};

// Event Listeners para Influencers
document.getElementById('influencerMetaForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const insta = document.getElementById('influencerInsta').value.trim();
    const photo = document.getElementById('influencerPhoto').value.trim();
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            instagramHandle: insta,
            photoUrl: photo
        });
        currentUserData.instagramHandle = insta;
        currentUserData.photoUrl = photo;
        alert("Información actualizada.");
        loadInfluencers(); // Refrescar carrusel inicio
    } catch (e) {
        alert("Error: " + e.message);
    }
});

document.getElementById('addRecommendationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const placeName = document.getElementById('recPlaceName').value.trim();
    const comment = document.getElementById('recComment').value.trim();
    const videoUrl = document.getElementById('recVideoUrl').value.trim();
    
    try {
        await db.collection('influencer_recs').add({
            influencerId: currentUser.uid,
            placeName,
            comment,
            videoUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        e.target.reset();
        alert("¡Recomendación subida con éxito!");
        loadMyRecommendations();
    } catch (e) {
        alert("Error: " + e.message);
    }
});

// ==========================================
// Lógica de Autenticación Rediseñada
// ==========================================

function openAuthModal(mode = 'login') {
    authModal.classList.remove('hidden');
    resetAuthViews(mode);
}

function resetAuthViews(mode = 'login') {
    authChoiceView.classList.remove('hidden');
    authFormView.classList.add('hidden');
    switchAuthTab(mode);
}

function switchToEmailForm() {
    authChoiceView.classList.add('hidden');
    authFormView.classList.remove('hidden');
}

function closeAuthModal() {
    authModal.classList.add('hidden');
    authForm.reset();
}

btnShowEmailForm?.addEventListener('click', switchToEmailForm);
btnBackToChoice?.addEventListener('click', () => resetAuthViews(currentAuthMode));

// Google Login
btnGoogleLogin?.addEventListener('click', handleGoogleLogin);

async function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Verificar si el usuario ya existe en Firestore para no sobreescribir datos como 'role'
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                phone: "-",
                role: "user",
                is_influencer: false,
                is_approved: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        closeAuthModal();
        alert("¡Bienvenido, " + user.displayName + "!");
    } catch (error) {
        if (error.code === 'auth/operation-not-allowed') {
            alert("Error: El inicio de sesión con Google no está habilitado en Firebase Console.");
        } else {
            alert("Error al iniciar con Google: " + error.message);
        }
    }
}

// Toggle Visibilidad Contraseña
btnTogglePassword?.addEventListener('click', togglePasswordVisibility);

function togglePasswordVisibility() {
    const type = authPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    authPassword.setAttribute('type', type);
    
    if (type === 'text') {
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    }
}

function switchAuthTab(mode) {
    currentAuthMode = mode;
    if (mode === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        registerFields.classList.add('hidden');
        if(forgotPasswordContainer) forgotPasswordContainer.classList.remove('hidden');
        authTitle.textContent = "Inicia Sesión";
        authSubmitBtn.textContent = "Ingresar";
        authName.removeAttribute('required');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerFields.classList.remove('hidden');
        if(forgotPasswordContainer) forgotPasswordContainer.classList.add('hidden');
        authTitle.textContent = "Crear Cuenta";
        authSubmitBtn.textContent = "Registrarme";
        authName.setAttribute('required', 'true');
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (currentAuthMode === 'login') {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            closeAuthModal();
        } catch (error) {
            alert("Error al iniciar sesión: " + error.message);
        }
    } else {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Guardar perfil en Firestore
            const name = authName.value.trim();
            const phone = authPhone.value.trim();
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                phone: phone,
                role: "user",
                is_influencer: false,
                is_approved: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert("Cuenta creada con éxito.");
            closeAuthModal();
        } catch (error) {
            alert("Error al registrarse: " + error.message);
        }
    }
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = prompt("Por favor, ingrese su correo electrónico para recibir el enlace de recuperación:");
    if (!email || email.trim() === "") return;
    
    auth.sendPasswordResetEmail(email.trim()).then(() => {
        alert("Enlace enviado! Revisa tu bandeja de entrada (y la de SPAM) para cambiar tu contraseña.");
    }).catch(error => {
        alert("Error: " + error.message);
    });
}

function loginSuccess(email) {
    currentUser = email;
    localStorage.setItem('dondeen_currentUser', email);
    updateUIForLogin();
    closeAuthModal();
    loadFavorites();
}

function handleLogout() {
    auth.signOut().then(() => {
        showHome();
    });
}

// ==========================================
// Integración de Dashboards Front
// ==========================================

function hideAllSections() {
    if(searchSection) searchSection.classList.add('hidden');
    if(resultsSection) resultsSection.classList.add('hidden');
    if(userDashboardSection) userDashboardSection.classList.add('hidden');
    if(adminDashboardSection) adminDashboardSection.classList.add('hidden');
}

function showHome() {
    hideAllSections();
    if(searchSection) searchSection.classList.remove('hidden');
    if(resultsSection) resultsSection.classList.remove('hidden');
}

async function openUserDashboard() {
    if (!currentUser || !currentUserData) return;
    
    profileName.value = currentUserData.name || "";
    profileEmailText.textContent = currentUser.email || "";
    profilePhone.value = currentUserData.phone || "";
    
    hideAllSections();
    userDashboardSection.classList.remove('hidden');
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    const newName = profileName.value.trim();
    const newPhone = profilePhone.value.trim();
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            name: newName,
            phone: newPhone
        });
        currentUserData.name = newName;
        currentUserData.phone = newPhone;
        updateUIForLogin();
        alert("Perfil actualizado correctamente.");
    } catch (error) {
        alert("Error al actualizar perfil: " + error.message);
    }
}

function changeUserPassword() {
    if (!currentUser) return;
    auth.sendPasswordResetEmail(currentUser.email).then(() => {
        alert("Se ha enviado un correo a tu cuenta para que cambies la contraseña de forma segura.");
    });
}

function openAdminDashboard() {
    hideAllSections();
    adminDashboardSection.classList.remove('hidden');
    renderAdminTable();
}

async function renderAdminTable() {
    adminUsersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center">Cargando usuarios de la nube...</td></tr>';
    
    try {
        const snapshot = await db.collection('users').get();
        adminUsersTableBody.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const user = doc.data();
            const id = doc.id;
            const row = document.createElement('tr');
            
            const influencerStatus = user.is_influencer ? (user.is_approved ? '✅ Aprobado' : '⏳ Pendiente') : '❌ No';

            row.innerHTML = `
                <td>${user.name || '-'}</td>
                <td>${user.email}</td>
                <td>${user.phone || '-'}</td>
                <td><span class="status-badge ${user.role === 'admin' ? 'open' : 'closed'}" style="padding:0.2rem 0.5rem">${user.role}</span></td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:0.2rem; align-items:center;">
                        <span style="font-size:0.8rem">${influencerStatus}</span>
                        <button class="action-btn" onclick="toggleInfluencerStatus('${id}', ${user.is_influencer || false}, ${user.is_approved || false})" style="font-size:0.7rem; padding:2px 5px;">
                            ${user.is_influencer ? 'Revocar' : 'Hacer Influencer'}
                        </button>
                    </div>
                </td>
                <td>
                    ${(user.email !== currentUser.email) 
                        ? `<button class="action-btn delete" onclick="deleteCloudUser('${id}', '${user.email}')" aria-label="Eliminar" title="Eliminar Usuario">🗑</button>` 
                        : '-'}
                </td>
            `;
            adminUsersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error al cargar admin table:", error);
    }
}

window.toggleInfluencerStatus = async function(uid, currentlyIsInfluencer, currentlyIsApproved) {
    try {
        const newStatus = !currentlyIsInfluencer;
        await db.collection('users').doc(uid).update({
            is_influencer: newStatus,
            is_approved: newStatus // Por simplificacion, al hacerlo influencer desde admin queda aprobado
        });
        renderAdminTable();
        alert(newStatus ? "Usuario ahora es Influencer." : "Estatus de Influencer revocado.");
    } catch (e) {
        alert("Error: " + e.message);
    }
};

window.deleteCloudUser = async function(uid, email) {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${email}? Tendrás que borrarlo manualmente también de Firebase Auth para que no pueda entrar.`)) {
        try {
            await db.collection('users').doc(uid).delete();
            renderAdminTable();
            alert("Usuario eliminado de Firestore.");
        } catch (error) {
            alert("Error: " + error.message);
        }
    }
};

// ==========================================
// Lógica de Favoritos Configuradas con Usuario
// ==========================================
function isFavorite(placeId) {
    if (!placeId) return false;
    return window.currentFavsData ? window.currentFavsData.some(f => f.place_id === placeId) : false;
}

async function toggleFavorite(place, photoUrl = '', statusHtml = '', ratingHTML = '') {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    if (!place.place_id) return;
    const uid = currentUser.uid;
    const docRef = db.collection('users').doc(uid).collection('favorites').doc(place.place_id);

    if (isFavorite(place.place_id)) {
        await docRef.delete();
    } else {
        await docRef.set({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address || place.vicinity || 'Córdoba, Argentina',
            rating: place.rating || 0,
            user_ratings_total: place.user_ratings_total || 0,
            photoUrl: photoUrl || place.photoUrl || '',
            statusHtml: statusHtml || place.statusHtml || '',
            ratingHTML: ratingHTML || place.ratingHTML || '',
            distanceKm: place.distanceKm || 9999,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    loadFavorites(); 
}

async function loadFavorites() {
    if (!currentUser) {
        window.currentFavsData = [];
        favoritesModalGrid.innerHTML = '';
        emptyFavoritesState.classList.remove('hidden');
        updateUIFavoritesIcons();
        return;
    }
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('favorites').orderBy('createdAt', 'desc').get();
        const favs = [];
        snapshot.forEach(doc => favs.push(doc.data()));
        window.currentFavsData = favs;
        
        updateUIFavoritesIcons();
        favoritesModalGrid.innerHTML = '';

        if (favs.length === 0) {
            emptyFavoritesState.classList.remove('hidden');
            return;
        }
        
        emptyFavoritesState.classList.add('hidden');
        
        favs.forEach((place) => {
            const card = document.createElement('div');
            card.className = 'place-card';
            
            card.innerHTML = `
                <img src="${place.photoUrl}" alt="${place.name}" class="card-image" loading="lazy">
                <button class="favorite-btn is-favorite" data-id="${place.place_id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
                <div class="card-content" style="cursor: pointer;">
                    <div class="card-header">
                        <h3 class="place-name" style="font-size: 1.1rem; line-height: 1.1;">${place.name}</h3>
                    </div>
                    ${place.distanceKm != null && place.distanceKm < 9999 ? `<p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.2rem">A ${place.distanceKm.toFixed(1)} km</p>` : ''}
                    <p class="place-address" style="font-size: 0.85rem; margin-bottom: 0.5rem;">${place.formatted_address || 'Córdoba, Argentina'}</p>
                    <div class="card-footer">
                        ${place.statusHtml}
                    </div>
                </div>
            `;

            card.querySelector('.card-content').addEventListener('click', () => openPlaceDetails(place, place.photoUrl, place.statusHtml, place.ratingHTML));
            card.querySelector('.card-image').addEventListener('click', () => openPlaceDetails(place, place.photoUrl, place.statusHtml, place.ratingHTML));
            
            card.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(place);
            });

            favoritesModalGrid.appendChild(card);
        });
    } catch (e) {
        console.error("Error cargando favoritos:", e);
    }
}

function updateUIFavoritesIcons() {
    document.querySelectorAll('.results-grid .favorite-btn').forEach(btn => {
        const id = btn.dataset.id;
        if(isFavorite(id)) btn.classList.add('is-favorite');
        else btn.classList.remove('is-favorite');
    });
}

// ==========================================
// MOCK DATA (Simulador inicial)
// ==========================================
function setupMockEnvironment() {
    console.log("Mock Environment Ready");
}

function getMockData(query) {
    const q = query.toLowerCase();
    let type = 'Lugar';
    if(q.includes('empanada')) type = 'Empanadas';
    else if(q.includes('hamburguesa')) type = 'Hamburguesería';
    else if(q.includes('bar')) type = 'Bar';
    else if(q.includes('boliche')) type = 'Boliche';

    return [
        {
            place_id: "mock_" + Math.random(),
            name: `${type} "El Cordobés"`,
            formatted_address: "Bv. San Juan 150, Nueva Córdoba",
            rating: 4.8,
            user_ratings_total: 1245,
            opening_hours: { open_now: true, weekday_text: ["Lunes: 10:00-00:00", "Martes: 10:00-00:00"] },
            photos: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
            formatted_phone_number: "+54 9 351 123-4567",
            url: "https://maps.google.com/?q=Nueva+Cordoba"
        },
        {
            place_id: "mock_" + Math.random(),
            name: `Lo de Paco (${type})`,
            formatted_address: "Av. Rafael Núñez 4200, Cerro de las Rosas",
            rating: 4.2,
            user_ratings_total: 890,
            opening_hours: { open_now: false, weekday_text: ["Lunes: 10:00-00:00"] },
            photos: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
            url: "https://maps.google.com/?q=Cerro+de+las+Rosas"
        },
        {
            place_id: "mock_" + Math.random(),
            name: `${type} Güemes`,
            formatted_address: "Fructuoso Rivera 200, Barrio Güemes",
            rating: 4.6,
            user_ratings_total: 2100,
            opening_hours: { open_now: true, weekday_text: ["Lunes: 10:00-00:00"] },
            photos: ["https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"],
            url: "https://maps.google.com/?q=Guemes"
        }
    ];
}

// ==========================================
// Módulo de Influencers & Recomendados
// ==========================================

async function loadInfluencers() {
    const influencerCarousel = document.getElementById('influencerCarousel');
    if (!influencerCarousel) return;

    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'user')
            .where('is_influencer', '==', true)
            .where('is_approved', '==', true)
            .get();

        if (snapshot.empty) {
            // Datos de prueba si no hay reales
            renderMockInfluencers();
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="influencer-card" onclick="openInfluencerProfile('${doc.id}', '${data.name}')">
                    <img src="${data.photoUrl || 'https://via.placeholder.com/80'}" class="influencer-avatar" alt="${data.name}">
                    <div class="influencer-name">${data.name}</div>
                    <div class="influencer-handle">${data.instagramHandle || '@influencer'}</div>
                </div>
            `;
        });
        influencerCarousel.innerHTML = html;
    } catch (error) {
        console.error("Error cargando influencers:", error);
        renderMockInfluencers();
    }
}

function renderMockInfluencers() {
    const influencerCarousel = document.getElementById('influencerCarousel');
    const mocks = [
        { id: 'm1', name: 'Gastro Fan', handle: '@gastrocordoba', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200' },
        { id: 'm2', name: 'Foodie CBA', handle: '@foodie.cba', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
        { id: 'm3', name: 'Nico Dulce', handle: '@nico.bakery', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' }
    ];
    
    influencerCarousel.innerHTML = mocks.map(m => `
        <div class="influencer-card" onclick="openInfluencerProfile('${m.id}', '${m.name}')">
            <img src="${m.img}" class="influencer-avatar" alt="${m.name}">
            <div class="influencer-name">${m.name}</div>
            <div class="influencer-handle">${m.handle}</div>
        </div>
    `).join('');
}

window.openInfluencerProfile = async function(influencerId, name) {
    loadingIndicator.classList.remove('hidden');
    try {
        const snapshot = await db.collection('influencer_recs')
            .where('influencerId', '==', influencerId)
            .get();

        if (snapshot.empty) {
            alert("Este influencer aún no tiene recomendaciones públicas.");
            loadingIndicator.classList.add('hidden');
            return;
        }

        let recsHtml = `
            <div style="padding: 1rem; text-align: center;">
                <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">🔥 Recomendados por ${name}</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Experiencias reales en video</p>
                <div id="influencerRecsList">
        `;

        snapshot.forEach(doc => {
            const r = doc.data();
            const embedUrl = getEmbedUrl(r.videoUrl);
            recsHtml += `
                <div class="res-card">
                    <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${r.placeName}</h3>
                    <p style="margin-bottom: 1rem; font-style: italic;">"${r.comment}"</p>
                    <div class="video-container">
                        ${embedUrl ? `<iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>` : `<p style="padding: 2rem;">Video no disponible para previsualización directa.</p>`}
                    </div>
                    <a href="${r.videoUrl}" target="_blank" class="primary-btn outline-btn" style="display:inline-block; margin-top: 1rem; width: 100%;">Ver en Redes Sociales</a>
                </div>
            `;
        });

        recsHtml += `</div></div>`;

        modalBody.innerHTML = recsHtml;
        placeModal.classList.remove('hidden');
        loadingIndicator.classList.add('hidden');
    } catch (e) {
        console.error(e);
        alert("Error al cargar recomendaciones.");
        loadingIndicator.classList.add('hidden');
    }
};

function getEmbedUrl(url) {
    if (!url) return null;
    
    // YouTube
    if (url.includes('youtube.com/watch')) {
        const v = new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${v}`;
    }
    if (url.includes('youtu.be/')) {
        const v = url.split('youtu.be/')[1];
        return `https://www.youtube.com/embed/${v}`;
    }

    // Instagram (Simple /embed suffix)
    if (url.includes('instagram.com/')) {
        // Asegurarse que termine en / e inyectar embed
        let clean = url.split('?')[0];
        if (!clean.endsWith('/')) clean += '/';
        return `${clean}embed`;
    }

    // TikTok (Basic embed search)
    if (url.includes('tiktok.com/')) {
        // TikTok requiere scripts mas complejos para el embed dinámico, 
        // pero podemos probar con la URL de video si es directa.
        return null; // TikTok es difícil sin su SDK de embed
    }

    return null;
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    loadInfluencers();
});

// ==========================================
// FUNCIÓN DE EMERGENCIA - HABILITAR ADMIN
// ==========================================
// Instrucciones:
// 1. Regístrate o inicia sesión con tu cuenta (ej. admin@dondeen.com)
// 2. Abre la consola del navegador (F12)
// 3. Escribe: hacermeAdmin() y pulsa Enter.
// 4. Recarga la página.
window.hacermeAdmin = async function() {
    if (!currentUser) {
        console.error("Debes iniciar sesión primero.");
        alert("Primero inicia sesión con la cuenta que quieres convertir en Admin.");
        return;
    }
    try {
        await db.collection('users').doc(currentUser.uid).update({
            role: 'admin'
        });
        console.log("¡Éxito! Ahora eres administrador. Recarga la página.");
        alert("¡Permisos de Admin concedidos! Recarga la página para ver el panel.");
    } catch (e) {
        console.error("Error al promover usuario:", e);
        alert("Error al intentar dar permisos: " + e.message);
    }
};
