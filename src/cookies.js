
/* Some jurisdictions strictly enforce consent to use cookies, please obtain
   user level consent before using document cookies. */ 
const consentAcceptButtonId = 'acceptCookies';
const consentRejectButtonId = 'rejectCookies';
const cookieConsentString = 'cookieConsent';

let hasConsent = false;

export function setCookie(name, value) {
  if (!hasConsent) { return; }
  // Set a strict, secure cookie with age of 1 year. Refresh the cookie to keep it alive longer.
  document.cookie = `${name}=${value}; path=/; Secure; SameSite=Strict; max-age=31536000`;
};

export function getCookie(name) {
  if (!hasConsent && name !== cookieConsentString) { return undefined; }
  const cookies = document.cookie.split(';');
  const value = cookies.find((cookieString) => {
    return cookieString.includes(`${name}=`);
  });

  if (!value) { return undefined; }
  if (value.split('=').length <= 1) { return undefined; } // Malformed cookie
  return value.split('=')[1];
};

function giveConsent() {
  hasConsent = true; // Set internally that we're OK to use cookies
  setCookie(cookieConsentString, 'true'); // Set the consent: true in the cookie itself so we don't have to keep asking
  closePopup();
};

function rejectConsent() {
  hasConsent = false;
  closePopup();
};

function showPopup() {
  document.getElementById("cookieOverlay").style.display = "block";
  document.getElementById("cookiePopup").style.display = "block";
}

function closePopup() {
  document.getElementById("cookieOverlay").style.display = "none";
  document.getElementById("cookiePopup").style.display = "none";
}

export function initialize() {
  /* If cookie consent is already stored, don't do anything.
     if cookie consent is not stored, show the popup asking for cookie consent.
     Set the HTML buttons by ID to the consent callback functions here
  */ 
 if (getCookie(cookieConsentString) === 'true') { return; } // User has already accepted cookies.
 const acceptButton = document.getElementById(consentAcceptButtonId);
 const rejectButton = document.getElementById(consentRejectButtonId);

 acceptButton.addEventListener('click', giveConsent);
 rejectButton.addEventListener('click', rejectConsent)
 showPopup();
}

export default {
  getCookie,
  setCookie,
  initialize
};
