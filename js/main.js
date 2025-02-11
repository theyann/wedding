// Global state
window.currentLanguage = 'fr';
window.translations = {};
window.commonInfo = {};

// Utility functions
const getQueryParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
};

const setQueryParam = (param, value) => {
    const url = new URL(window.location.href);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
};

// Language management
async function loadTranslations() {
    try {
        const [translationsResponse, commonInfoResponse] = await Promise.all([
            fetch(`/wedding/data/i18n-${currentLanguage}.json`),
            fetch('/wedding/data/commonInfo.json')
        ]);
        
        window.translations = await translationsResponse.json();
        window.commonInfo = await commonInfoResponse.json();
        
        // Update language switcher visibility
        updateLanguageSwitcher();
        
        return true;
    } catch (error) {
        console.error('Error loading translations:', error);
        return false;
    }
}

function updateLanguageSwitcher() {
    const frSpan = document.querySelector('.language-switcher .fr');
    const enSpan = document.querySelector('.language-switcher .en');
    if (frSpan && enSpan) {
        frSpan.style.display = currentLanguage === 'fr' ? 'inline' : 'none';
        enSpan.style.display = currentLanguage === 'en' ? 'inline' : 'none';
    }
}

function switchLanguage() {
    window.currentLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    setQueryParam('lang', currentLanguage);
    loadTranslations().then(() => {
        updatePageContent();
    });
}

// Content update functions
function updatePageContent() {
    // Update main title
    document.querySelector('.main-title').textContent = translations.sectionTitle.title;
    
    // Update all sections
    updateSection('welcome', translations.sectionTitle);
    updateSection('rsvp', translations.sectionRSVP);
    
    // Update specific sections based on guest type
    const guestType = determineGuestType();
    if (guestType === 'A' || guestType === 'B') {
        updateSection('ceremony', translations.sectionCeremony);
    }
    
    if (guestType === 'A') {
        updateSection('welcome-drink', translations.sectionWelcomeDrink);
    } else if (guestType === 'B') {
        updateSection('festivities', translations.sectionFestivities);
    } else if (guestType === 'C') {
        updateSection('party', translations.sectionParty);
    }
    
    updateSection('gift', translations.sectionGift);
    updateFAQSection();
    updateAllAddresses();
    updateRSVPButton();
    updateGiftButton();
    updateScheduleContent();
}

function updateSection(sectionId, content) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const title = section.querySelector('.section-title');
    const message = section.querySelector('.section-message');
    
    if (title && content.title) title.textContent = content.title;
    if (message && content.message) message.textContent = content.message;
    
    // Update gift section paragraphs if present
    if (sectionId === 'gift') {
        const para1 = section.querySelector('.gift-paragraph-1');
        const para2 = section.querySelector('.gift-paragraph-2');
        if (para1) para1.textContent = content.messageParagraph1;
        if (para2) para2.textContent = content.messageParagraph2;
    }
}

function updateRSVPButton() {
    const rsvpLink = document.getElementById('rsvp-link');
    const rsvpDeadline = document.getElementById('rsvp-deadline');
    if (!rsvpLink || !rsvpDeadline) return;
    
    const guestType = determineGuestType();
    const urlKey = `urlType${guestType}`;
    if (commonInfo.RSVP && commonInfo.RSVP[urlKey]) {
        rsvpLink.href = commonInfo.RSVP[urlKey];
        rsvpDeadline.textContent = `${currentLanguage === 'fr' ? 'À répondre avant le' : 'Please respond by'} ${commonInfo.RSVP.respondBefore}`;
    }
}

function updateGiftButton() {
    const giftLink = document.getElementById('gift-link');
    if (!giftLink) return;
    
    const giftUrl = commonInfo.urls.find(u => u.type === 'gift');
    if (giftUrl) {
        giftLink.href = giftUrl.url;
        giftLink.textContent = translations.sectionGift.button;
    }
}

function updateScheduleContent() {
    const scheduleContent = document.getElementById('schedule-content');
    if (!scheduleContent) return;

    const guestType = determineGuestType();
    const schedule = commonInfo.schedule;
    let content = '';

    if (guestType === 'A' || guestType === 'B') {
        content += `${currentLanguage === 'fr' ? 'Cérémonie' : 'Ceremony'}: ${schedule.ceremony}<br>`;
        content += `${currentLanguage === 'fr' ? 'Vin d\'honneur' : 'Welcome Drink'}: ${schedule['welcome-drink']}<br>`;
    }
    
    if (guestType === 'B' || guestType === 'C') {
        content += `${currentLanguage === 'fr' ? 'Soirée' : 'Party'}: ${schedule.party}`;
    }

    scheduleContent.innerHTML = `<p style="margin-top: 1rem; color: var(--color-purple);">${content}</p>`;
}

function updateFAQSection() {
    const faqSection = document.getElementById('faq');
    if (!faqSection) return;
    
    const faqContent = document.querySelector('.faq-content');
    faqContent.innerHTML = ''; // Clear existing content
    
    translations.sectionFAQ.QandA.forEach(qa => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        
        const question = document.createElement('div');
        question.className = 'faq-question';
        question.textContent = qa.q;
        
        const answer = document.createElement('div');
        answer.className = 'faq-answer';
        
        if (qa.a1) answer.innerHTML += `<p>${qa.a1}</p>`;
        if (qa.a2) answer.innerHTML += `<p>${qa.a2}</p>`;
        if (qa.a) answer.innerHTML += `<p>${qa.a}</p>`;
        
        if (qa.button && qa.url) {
            const link = document.createElement('a');
            link.href = qa.url;
            link.className = 'button';
            link.textContent = qa.button;
            link.target = '_blank';
            answer.appendChild(link);
        }
        
        faqItem.appendChild(question);
        faqItem.appendChild(answer);
        faqContent.appendChild(faqItem);
    });
}

function createAddressBlock(addr) {
    const card = document.createElement('div');
    card.className = 'address-card';

    const title = document.createElement('h3');
    title.textContent = addr.name;

    const address = document.createElement('p');
    address.textContent = addr.address;

    const mapLink = document.createElement('a');
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.address)}`;
    mapLink.className = 'button';
    mapLink.textContent = currentLanguage === 'fr' ? 'Ouvrir dans Google Maps' : 'Open in Google Maps';
    mapLink.target = '_blank';

    card.appendChild(title);
    card.appendChild(address);
    card.appendChild(mapLink);

    return card;
}

function updateSectionAddress(sectionId, addressType) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const addresses = commonInfo.addresses;

    const address = addresses.find(addr => addr.type === addressType);
    if (!address) return;

    // Create or get address block container
    let addressBlock = section.querySelector('.address-block');
    if (!addressBlock) {
        addressBlock = document.createElement('div');
        addressBlock.className = 'address-block';
        section.appendChild(addressBlock);
    }

    addressBlock.innerHTML = '';
    addressBlock.appendChild(createAddressBlock(address));
}

function updateAllAddresses() {
    // Update ceremony address
    updateSectionAddress('ceremony', 'ceremony');

    // Update venue address for welcome-drink and festivities
    updateSectionAddress('welcome-drink', 'venue');

    // Add this line if you have a festivities section
    updateSectionAddress('festivities', 'venue');
}

// Guest type determination
function determineGuestType() {
    const path = window.location.pathname;
    if (path.includes('a.html')) return 'A';
    if (path.includes('b.html')) return 'B';
    if (path.includes('c.html')) return 'C';
    return null;
}

// Initialize page
async function initializePage() {
    const langParam = getQueryParam('lang');
    if (langParam && ['fr', 'en'].includes(langParam)) {
        window.currentLanguage = langParam;
    }
    
    await loadTranslations();
    updatePageContent();
    
    // Add event listener for language switcher
    const languageSwitch = document.getElementById('language-switch');
    if (languageSwitch) {
        languageSwitch.addEventListener('click', switchLanguage);
    }
}

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        fetch('components/header.html').then(response => response.text()),
        fetch('components/footer.html').then(response => response.text())
    ]).then(([headerContent, footerContent]) => {
        document.getElementById('header').innerHTML = headerContent;
        document.getElementById('footer').innerHTML = footerContent;
        // Initialize page after components are loaded
        initializePage();
    });
});