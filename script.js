///////////////
// PARAMETRS //
///////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const code = urlParams.get("code") || "";

const baseURL = "https://stherzada.github.io/spotify-widget-compact/";
const redirect_uri = `${baseURL}`;
let refresh_token = "";
let access_token = "";
let browserSourceURL = "";



/////////////////////////
// AUTHORIZATION STUFF //
/////////////////////////

function RequestAuthorization() {
    const client_id = document.getElementById("client_id_box").value;
    const client_secret = document.getElementById("client_secret_box").value;
    const twitch_channel = document.getElementById("twitch_channel_box").value;
    const duration = document.getElementById("duration_box").value;
    const hide_album_art = document.getElementById("hide_album_art_box").checked;
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);
    localStorage.setItem("twitch_channel", twitch_channel);
    localStorage.setItem("duration", duration);
    localStorage.setItem("hide_album_art", hide_album_art);

    let url = "https://accounts.spotify.com/authorize";
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url;
}

// If there is no code in the query string, direct the user to authorize their account
if (code != "") {
    FetchAccessToken(code);
}
else {
    document.getElementById("connectBox").style.display = 'inline';
}

async function FetchAccessToken(code) {
    const client_id = localStorage.getItem("client_id");
    const client_secret = localStorage.getItem("client_secret");
    const twitch_channel = localStorage.getItem("twitch_channel");
    const duration = localStorage.getItem("duration") || 0;
    const hide_album_art = localStorage.getItem("hide_album_art") === "true";
    console.debug(`Client ID: ${client_id}`);
    console.debug(`Client Secret: ${client_secret}`);

    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    console.log(body);

    // Get the current player information from Spotify
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            'Authorization': `Basic ${btoa(client_id + ":" + client_secret)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    });

    // If we got a response, save the access token
	if (response.ok)
    {
        const responseData = await response.json();
        console.debug(responseData);
        refresh_token = responseData.refresh_token;			// Unsure if we need to replace the refresh_token but do it just in case
        access_token = responseData.access_token;			// Save access token for all future API calls

        browserSourceURL = `${baseURL}spotify-widget/?client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`;
        if (twitch_channel) {
            browserSourceURL += `&twitch_channel=${twitch_channel}`;
        }
        if (duration > 0) {
            browserSourceURL += `&duration=${duration}`;
        }
        if (hide_album_art) {
            browserSourceURL += `&hideAlbumArt=true`;
        }
        
        // Hide config box to avoid confusion, or keep it and update link dynamically?
        // Let's keep it but ensure link updates
        document.getElementById("authorizationBox").style.display = 'inline';
    }
    else
    {
        console.error(`${response.status}`);
    }
}



///////////////////////////
// BUTTON CLICK HANDLERS //
///////////////////////////

const clientIdBox = document.getElementById('client_id_box');
const clientSecretBox = document.getElementById('client_secret_box');
const authorizeButton = document.getElementById('authorizeButton');

// Function to check if either input is empty
function checkInputs() {
    if (clientIdBox.value.trim() === '' || clientSecretBox.value.trim() === '') {
        authorizeButton.disabled = true;    // Disable the button
    } else {
        authorizeButton.disabled = false;   // Enable the button
    }
    UpdateLink();
}

function UpdateLink() {
    if (refresh_token === "") return; // Don't update if we don't have a token yet

    const client_id = document.getElementById("client_id_box").value;
    const client_secret = document.getElementById("client_secret_box").value;
    const twitch_channel = document.getElementById("twitch_channel_box").value;
    const duration = document.getElementById("duration_box").value;
    const hide_album_art = document.getElementById("hide_album_art_box").checked;

    // Update localStorage so next time it's remembered
    localStorage.setItem("twitch_channel", twitch_channel);
    localStorage.setItem("duration", duration);
    localStorage.setItem("hide_album_art", hide_album_art);

    browserSourceURL = `${baseURL}spotify-widget/?client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`;
    
    if (twitch_channel) {
        browserSourceURL += `&twitch_channel=${twitch_channel}`;
    }
    if (duration > 0) {
        browserSourceURL += `&duration=${duration}`;
    }
    if (hide_album_art) {
        browserSourceURL += `&hideAlbumArt=true`;
    }
}

// Listen for changes in the input boxes
clientIdBox.addEventListener('input', checkInputs);
clientSecretBox.addEventListener('input', checkInputs);
document.getElementById('twitch_channel_box').addEventListener('input', UpdateLink);
document.getElementById('duration_box').addEventListener('input', UpdateLink);
document.getElementById('hide_album_art_box').addEventListener('change', UpdateLink);

// Initial check when the page loads, just in case
checkInputs();

function CopyToURL() {
    navigator.clipboard.writeText(browserSourceURL);

    document.getElementById("copyURLButton").innerText = "Copied to clipboard";
    document.getElementById("copyURLButton").style.backgroundColor = "#00dd63"
    document.getElementById("copyURLButton").style.color = "#ffffff";

    setTimeout(() => {
        document.getElementById("copyURLButton").innerText = "Click to copy URL";
        document.getElementById("copyURLButton").style.backgroundColor = "#ffffff";
        document.getElementById("copyURLButton").style.color = "#181818";
    }, 3000);
}

function OpenInstructions() {
    window.open("https://nuttylmao.notion.site/Spotify-Widget-Compact-Edition-1ac19969b23780ae8c63c4472db0ee6b", '_blank').focus();
}

function OpenDonationPage() {
    window.open("http://nutty.gg/pages/donate", '_blank').focus();
}