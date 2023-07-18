// ==UserScript==
// @name         YoutubeDL
// @namespace    https://www.youtube.com/
// @version      1.0.1
// @description  Download youtube videos at the comfort of your browser.
// @author       realcoloride
// @match        https://www.youtube.com/*
// @match        https://www.youtube.com/watch*
// @match        https://www.youtube.com/shorts*
// @match        https://www.youtube.com/embed*
// @connect      savetube.io
// @connect      googlevideo.com
// @connect      aadika.xyz
// @connect      dlsnap11.xyz
// @connect      githubusercontent.com
// @connect      *
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @license      MIT
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let pageInformation = {
        loaded : false,
        website : "https://savetube.io",
        searchEndpoint : null,
        convertEndpoint : null,
        checkingEndpoint : null,
        pageValues : {}
    }

    // Process:
    // Search -> Checking -> Convert by -> Convert using c_server

    const githubAssetEndpoint = "https://raw.githubusercontent.com/realcoloride/YoutubeDL/main/";

    let videoInformation;
    const fetchHeaders = {
        'Accept': '*/*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Sec-Ch-Ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'none',
    };
    const convertHeaders = {
        "accept": "*/*",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "x-requested-key": "de0cfuirtgf67a"
    };
    const downloadHeaders = {
        "accept": "*/*",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest"
    };

    const popupHTML = `
        <div id="youtubeDL-popup">
                <span class="youtubeDL-text bigger float">
                    <img src="{asset}YoutubeDL.png" class="youtubeDL-logo float">
                    YoutubeDL - Download video
                    <button id="youtubeDL-close" class="youtubeDL-button youtubeDL-align right" aria-label="Cancel">
                        <span>Close</span>
                    </button>
                </span>

                <hr style="height:3px">

                <div id="youtubeDL-loading">
                    <span class="youtubeDL-text medium center float" style="display: flex;">
                        <img src="{asset}loading.svg" style="width:21px; padding-right: 6px;"> Loading...
                    </span>
                </div>

                <div id="youtubeDL-quality">
                    <span class="youtubeDL-text medium center float" >Select a quality and click on Download.</span><br>
                    <span class="youtubeDL-text medium center float" style="margin-bottom: 10px;">
                    ⚠️ CLICK 
                    <a href="{asset}allow.gif" target="_blank"><strong>"ALWAYS ALLOW ALL DOMAINS"</strong></a>
                    
                    WHEN DOWNLOADING FOR THE FIRST TIME.
                    
                    <span class="youtubeDL-text center float">Some providers may have a bigger file size than estimated.</span>
                    </span>
                    
                    <table id="youtubeDL-quality-table" style="width: 100%; border-spacing: 0;">
                        <thead class="youtubeDL-row">
                            <th class="youtubeDL-column youtubeDL-text">Format</th>
                            <th class="youtubeDL-column youtubeDL-text">Quality</th>
                            <th class="youtubeDL-column youtubeDL-text">Estimated Size</th>
                            <th class="youtubeDL-column youtubeDL-text">Download</th>
                        </thead>
                        <tbody id="youtubeDL-quality-container">
                            
                        </tbody>
                    </table>
                </div>

                <div class="youtubeDL-credits">
                    <span class="youtubeDL-text medium">YoutubeDL by (real)coloride - 2023</span>
                    <br>
                    <a class="youtubeDL-text medium" href="https://www.github.com/realcoloride/YoutubeDL">
                        <img src="{asset}github.png" width="21px">Github</a>
                    
                    <a class="youtubeDL-text medium" href="https://opensource.org/license/mit/">
                        <img src="{asset}mit.png" width="21px">MIT license
                    </a>
                </div>
            </div>
    `;
    
    // Element definitions
    
    const ytdAppContainer = document.querySelector("ytd-app");
    let popupElement;

    // Information gathering
    function getVideoInformation(url) {
        const regex = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/|embed\/)?)([\w-]+)/i;
        const match = regex.exec(url);
        const videoId = match ? match[1] : null;
        
        let type = null;
        if (url.includes("/shorts/"))       type = "shorts";
        else if (url.includes("/watch?v=")) type = "video";
        else if (url.includes("/embed/"))   type = "embed";
        
        return { type, videoId };
    };

    // Fetching
    function convertSizeToBytes(size) {
        const units = {
            B: 1,
            KB: 1024,
            MB: 1024 * 1024,
            GB: 1024 * 1024 * 1024,
        };
      
        const regex = /^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i;
        const match = size.match(regex);
      
        if (!match) {
            throw new Error('Invalid size format');
        }
      
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
      
        if (!units.hasOwnProperty(unit)) {
            throw new Error('Invalid size unit');
        }
      
        return value * units[unit];
    }     
    function decipherVariables(variableString) {
        const variableDict = {};
      
        const variableAssignments = variableString.match(/var\s+(\w+)\s*=\s*(.+?);/g);
      
        variableAssignments.forEach((assignment) => {
            const [, variableName, variableValue] = assignment.match(/var\s+(\w+)\s*=\s*['"](.+?)['"];/);
        
            const trimmedValue = variableValue.trim().replace(/^['"]|['"]$/g, '');
        
            variableDict[variableName] = trimmedValue;
        });
      
        return variableDict;
    }
    function isTimestampExpired(timestamp) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        return currentTimestamp > timestamp;
    }
    async function fetchPageInformation() {
        // Scrapping internal values
        const pageRequest = await GM.xmlHttpRequest({
            url: `${pageInformation.website}`,
            method: "GET",
            headers: fetchHeaders,
        });

        const parser = new DOMParser();
        const pageDocument = parser.parseFromString(pageRequest.responseText, "text/html");

        let scrappedScriptElement;

        pageDocument.querySelectorAll("script").forEach((scriptElement) => {
            const scriptHTML = scriptElement.innerHTML;
            if (scriptHTML.includes("k_time") && scriptHTML.includes("k_page")) {
                scrappedScriptElement = scriptElement;
                return;
            }
        });

        const pageValues = decipherVariables(scrappedScriptElement.innerHTML);
        pageInformation.pageValues = pageValues;

        pageInformation.searchEndpoint = pageValues['k_url_search'];
        pageInformation.convertEndpoint = pageValues['k_url_convert'];
        pageInformation.checkingEndpoint = pageValues['k_url_check_task'];

        pageInformation.loaded = true;
    }
    async function startConversion(fileExtension, fileQuality, timeExpires, token, filename, button) {
        const videoType = videoInformation.type;
        const videoId = videoInformation.videoId;

        if (!videoType) return;

        const initialFormData = new FormData();
        initialFormData.append('v_id', videoId);
        initialFormData.append('ftype', fileExtension); 
        initialFormData.append('fquality', fileQuality);
        initialFormData.append('token', token);
        initialFormData.append('timeExpire', timeExpires);
        initialFormData.append('client', 'SaveTube.io');
        const initialRequestBody = new URLSearchParams(initialFormData).toString();

        let result = null;

        try {
            const payload = {
                url: pageInformation.convertEndpoint,
                method: "POST",
                headers: convertHeaders,
                data: initialRequestBody,
                responseType: 'text',
                referrerPolicy: "strict-origin-when-cross-origin",
                mode: "cors",
                credentials: "omit"
            };

            const initialRequest = await GM.xmlHttpRequest(payload);
            const initialResponse = JSON.parse(initialRequest.responseText);

            // Needs conversion is it links to a server
            const downloadLink = initialResponse.d_url;
            const needsConversation = (downloadLink == null);
            
            if (needsConversation) {
                updatePopupButton(button, 'Converting...');
                const conversionServerEndpoint = initialResponse.c_server;

                const convertFormData = new FormData();
                convertFormData.append('v_id', videoId);
                convertFormData.append('ftype', fileExtension); 
                convertFormData.append('fquality', fileQuality);
                convertFormData.append('fname', filename);
                convertFormData.append('token', token);
                convertFormData.append('timeExpire', timeExpires);
                const convertRequestBody = new URLSearchParams(convertFormData).toString();

                const convertRequest = await GM.xmlHttpRequest({
                    url: `${conversionServerEndpoint}/api/json/convert`,
                    method: "POST",
                    headers: convertHeaders,
                    data: convertRequestBody,
                    responseType: 'text', 
                });

                let convertResponse;

                let adaptedResponse = {};
                let result;

                try {
                    convertResponse = JSON.parse(convertRequest.responseText);
                    
                    result = convertResponse.result;
                    adaptedResponse = {
                        c_status : convertResponse.status,
                        d_url: result
                    }
                } catch (error) {
                    alert("[YoutubeDL] Converting failed.\nYou might have been downloading too fast and have been rate limited or your antivirus may be blocking the media.\n(💡 If so, refresh the page or check your antivirus's settings.)")

                    result = "error";
                    adaptedResponse = {
                        c_status : "error"
                    }
                    return adaptedResponse;
                }

                if (result == 'Converting') { // Not converted
                    const jobId = convertResponse.jobId;

                    console.log(`[YoutubeDL] Download needs to be checked on, jobId: ${jobId}, waiting...`);
                    updatePopupButton(button, 'Waiting for server...');

                    async function gatherResult() {
                        return new Promise(async(resolve, reject) => {
                            const parsedURL = new URL(conversionServerEndpoint);
                            const protocol = parsedURL.protocol === "https:" ? "wss:" : "ws:";
                            const websocketURL = `${protocol}//${parsedURL.host}/sub/${jobId}?fname=${pageInformation.pageValues.k_prefix_name}`;
                            
                            const socket = new WebSocket(websocketURL);

                            socket.onmessage = function(event) {
                                const message = JSON.parse(event.data);

                                switch (message.action) {
                                    case "success":
                                        socket.close();
                                        resolve(message.url);
                                    case "progress":
                                        updatePopupButton(button, `Converting... ${message.value}%`)
                                    case "error":
                                        socket.close();
                                        reject("WSCheck fail");
                                };
                            };
                        });
                    };

                    try {
                        const conversionUrl = await gatherResult();
                        adaptedResponse.d_url = conversionUrl;
                    } catch (error) {
                        console.error("[YoutubeDL] Error while checking for job converstion: ", error);
                        adaptedResponse.c_status = 'error';
                    }
                }

                return adaptedResponse;
            } else {
                result = initialResponse;
            }
        } catch (error) {
            console.error(error);
            return null;
        }

        return result;
    }
    async function getMediaInformation() {
        const videoType = videoInformation.type;
        const videoId = videoInformation.videoId;

        if (!videoType) return;

        const formData = new FormData();
        formData.append('q', `https://www.youtube.com/watch?v=${videoId}`);
        formData.append('vt', 'home');
        const requestBody = new URLSearchParams(formData).toString();

        let result = null;

        try {
            const request = await GM.xmlHttpRequest({
                url: pageInformation.searchEndpoint,
                method: "POST",
                headers: fetchHeaders,
                data: requestBody,
                responseType: 'text',
            });
            
            result = JSON.parse(request.responseText);
        } catch (error) {
            return null;
        }

        return result;
    }

    // Light mode/Dark mode
    function isDarkMode() {
        if (videoInformation.type == 'embed') return true;
        
        const computedStyles = window.getComputedStyle(ytdAppContainer);

        const backgroundColor = computedStyles["background-color"];

        return backgroundColor.endsWith('15)');
    }
    function toggleLightClass(queryTarget) {
        const elements = document.querySelectorAll(queryTarget);
      
        elements.forEach((element) => {
            element.classList.toggle("light");
            toggleLightClassRecursive(element);
        });
    }
    function toggleLightClassRecursive(element) {
        const children = element.children;
    
        for (let i = 0; i < children.length; i++) {
            children[i].classList.toggle("light");
            toggleLightClassRecursive(children[i]);
        }
    }

    // Popup
    // Links
    // Downloading
    async function downloadFile(button, url, filename) {
        const baseText = `Download`;
        
        button.disabled = true;
        updatePopupButton(button, "Downloading...");
    
        console.log(`[YoutubeDL] Downloading media URL: ${url}`);
        
        function finish() {
            updatePopupButton(button, baseText);
            if (button.disabled) button.disabled = false
        }

        GM.xmlHttpRequest({
            method: 'GET',
            headers: downloadHeaders,
            url: url,
            responseType: 'blob',
            onload: async function(response) {
                console.log(response);
                if (response.status == 403) { 
                    alert("[YoutubeDL] Media expired or may be impossible to download, please retry or try with another format, sorry!"); 
                    await reloadMedia(); 
                    return; 
                }
                
                const blob = response.response;
                const link = document.createElement('a');

                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', filename);
                link.click();

                URL.revokeObjectURL(link.href);
                updatePopupButton(button, 'Downloaded!');
                button.disabled = false;

                setTimeout(finish, 1000);
            },
            onerror: function(error) {
                console.error('[YoutubeDL] Download Error:', error);
                updatePopupButton(button, 'Download Failed');
                
                setTimeout(finish, 1000);
            }, 
            onprogress: function(progressEvent) {
                if (progressEvent.lengthComputable) {
                    const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    updatePopupButton(button, `Downloading: ${percentComplete}%`);
                } else
                    updatePopupButton(button, 'Downloading...');
            }
        });
    }
    function updatePopupButton(button, text) {
        button.innerHTML = `<strong>${text}</strong>`;
        if (!isDarkMode()) button.classList.add('light');
    }
    async function createMediaFile(params) {
        let { format, quality, size, extension, timeExpires, videoTitle, token } = params;

        const qualityContainer = getPopupElement("quality-container");

        const row = document.createElement("tr");
        row.classList.add("youtubeDL-row");

        function createRowElement() {
            const rowElement = document.createElement("td");
            rowElement.classList.add("youtubeDL-row-element");

            return rowElement;
        }
        function addRowElement(rowElement) {
            row.appendChild(rowElement);
        }

        function createSpanText(text, targetElement) {
            const spanText = document.createElement("span");
            spanText.classList.add("youtubeDL-text");

            spanText.innerHTML = `<strong>${text}</strong>`;
            if (!isDarkMode()) spanText.classList.add('light');

            targetElement.appendChild(spanText);
        }

        // Format
        const formatRowElement = createRowElement();
        createSpanText(format, formatRowElement);
        addRowElement(formatRowElement);

        // Quality
        const qualityRowElement = createRowElement();
        createSpanText(quality, qualityRowElement);
        addRowElement(qualityRowElement);
        
        // Size
        const sizeRowElement = createRowElement();
        createSpanText(size, sizeRowElement);
        addRowElement(sizeRowElement);

        const downloadRowElement = createRowElement();
        const downloadButton = document.createElement("button");
        downloadButton.classList.add("youtubeDL-button");
        downloadButton.ariaLabel = "Download";
        updatePopupButton(downloadButton, "Download");

        downloadButton.addEventListener("click", async(event) => {
            try {
                downloadButton.disabled = true;
                updatePopupButton(downloadButton, "Fetching info...");

                if (isTimestampExpired(pageInformation.pageValues.k_time)) {
                    await reloadMedia();
                    return;
                }

                extension = extension.replace(/ \(audio\)|kbps/g, '');
                quality = quality.replace(/ \(audio\)|kbps/g, '');
                let filename = `YoutubeDL_${videoTitle}_${quality}.${extension}`;
                if (extension == "mp3") filename = `YoutubeDL_${videoTitle}.${extension}`;
                
                const conversionRequest = await startConversion(extension, quality, timeExpires, token, filename, downloadButton);
                const conversionStatus = conversionRequest.c_status;

                async function fail() {
                    throw Error("Failed to download.");
                }

                if (!conversionStatus) { fail(); return; }
                if (conversionStatus != 'ok' && conversionStatus != 'success') { fail(); return; }

                const downloadLink = conversionRequest.d_url;
                await downloadFile(downloadButton, downloadLink, filename);
            } catch (error) {
                console.error(error);

                downloadButton.disabled = true;
                updatePopupButton(downloadButton, '');

                setTimeout(() => {
                    downloadButton.disabled = false;
                    updatePopupButton(downloadButton, 'Download');
                }, 2000);
            }
        });

        downloadRowElement.appendChild(downloadButton);
        addRowElement(downloadRowElement);

        qualityContainer.appendChild(row);
    }
    async function loadMediaFromLinks(response) {
        try {
            const links = response.links;
            const token = response.token;
            const timeExpires = response.timeExpires;
            const videoTitle = response.title;

            const audioLinks = links.mp3;
            let videoLinks = links.mp4;

            function addFormat(information) {
                const format = information.f;
                if (!format) return;

                const quality = information.q;
                let size = information.size;

                const regex = /\s[BKMGT]?B/;
                const unit = size.match(regex)[0];
                const sizeNoUnit = size.replace(regex, "");
                const roundedSize = Math.round(parseFloat(sizeNoUnit));
                
                size = `${roundedSize}${unit}`;

                createMediaFile({
                    extension: format, 
                    quality,
                    timeExpires,
                    videoTitle,

                    format: format.toUpperCase(),
                    size,
                    token
                });
            }

            // Audio will only have this one so it doesnt matter
            const defaultAudioFormat = audioLinks[Object.keys(audioLinks)[0]];
            defaultAudioFormat.f = "mp3 (audio)";

            addFormat(defaultAudioFormat);

            // Format sorting first
            // Remove auto quality
            videoLinks["auto"] = null;

            // Store 3gp quality if available
            const low3gpFormat = { ...videoLinks["3gp@144p"] };
            delete videoLinks["3gp@144p"];

            // Sort from highest to lowest quality
            const qualities = {};

            for (const [qualityId, information] of Object.entries(videoLinks)) {
                if (!information) continue;

                const qualityName = information.q;
                const strippedQualityName = qualityName.replace('p', '');
                const quality = parseInt(strippedQualityName);

                qualities[quality] = qualityId;
            }

            const newOrder = Object.keys(qualities).sort((a, b) => a - b);

            function swapKeys(object, victimKeys, targetKeys) {
                const swappedObj = {};

                victimKeys.forEach((key, index) => {
                    swappedObj[targetKeys[index]] = object[key];
                });

                return swappedObj;
            }
            videoLinks = swapKeys(videoLinks, Object.keys(videoLinks), newOrder);
             
            // Bubble swapping estimated qualities if incorrect (by provider) 
            function bubbleSwap() {
                const videoLinkIds = Object.keys(videoLinks);
                videoLinkIds.forEach((qualityId) => {
                    const currentQualityInformation = videoLinks[qualityId];
                    if (!currentQualityInformation) return;

                    const currentQualityIndex = videoLinkIds.findIndex((id) => id === qualityId);
                    if (currentQualityIndex - 1 < 0) return;

                    const previousQualityIndex = currentQualityIndex - 1;
                    const previousQualityId = videoLinkIds[previousQualityIndex];

                    if (!previousQualityId) return;

                    const previousQualityInformation = videoLinks[previousQualityId];

                    function getQualityOf(information) {
                        const qualityName = information.q;
                        const strippedQualityName = qualityName.replace('p', '');
                        const quality = parseInt(strippedQualityName);

                        return { qualityName, strippedQualityName, quality };
                    }

                    const previousQuality = getQualityOf(previousQualityInformation);
                    const currentQuality = getQualityOf(currentQualityInformation);

                    function swap() {
                        console.log(`[YoutubeDL] Swapping incorrect formats: [${previousQuality.qualityName}] ${previousQualityInformation.size} -> [${currentQuality.qualityName}] ${currentQualityInformation.size}`);

                        const previousClone = { ... previousQualityInformation};
                        const currentClone = { ... currentQualityInformation};

                        previousQualityInformation.size = currentClone.size;
                        currentQualityInformation.size = previousClone.size;
                    }

                    const previousSize = previousQualityInformation.size;
                    const previousSizeBytes = convertSizeToBytes(previousSize);

                    const currentSize = currentQualityInformation.size;
                    const currentSizeBytes = convertSizeToBytes(currentSize);

                    if (previousSizeBytes < currentSizeBytes) swap();
                });
            };

            for (let i = 0; i < Object.keys(videoLinks).length; i++) bubbleSwap();
            
            for (const [qualityId, information] of Object.entries(videoLinks)) {
                if (!information) continue;

                const qualityName = information.q;
                const strippedQualityName = qualityName.replace('p', '');
                const quality = parseInt(strippedQualityName);

                qualities[quality] = qualityId;
                addFormat(information);
            }

            if (low3gpFormat) addFormat(low3gpFormat);
        } catch (error) {
            console.error("[YoutubeDL] Failed loading media:", error);
            alert("[YoutubeDL] Failed fetching media.\n" +
            "This could be either because:\n" +
            "- An unhandled error\n" +
            "- Your tampermonkey settings\n" +
            "or an issue with the API.\n\n" +
            "Try to refresh the page, otherwise, reinstall the plugin.")

            togglePopup();
            popupElement.hidden = true;
        }
    }
    let isLoadingMedia = false;
    let hasLoadedMedia = false;
    function clearMedia() {
        const qualityContainer = getPopupElement("quality-container");
        qualityContainer.innerHTML = "";

        isLoadingMedia = false;
        hasLoadedMedia = false;
    }
    async function reloadMedia() {
        console.log("[YoutubeDL] Hot reloading...");

        const loadingBarSpan = getPopupElement("loading > span");
        loadingBarSpan.textContent = "Reloading...";

        togglePopupLoading(true);
        clearMedia();

        await fetchPageInformation();
        await loadMedia();

        loadingBarSpan.textContent = "Loading...";
    }
    async function loadMedia() {
        if (isLoadingMedia || hasLoadedMedia) return;
        isLoadingMedia = true;

        function fail() {
            isLoadingMedia = false;
            console.error("[YoutubeDL] Failed fetching media.");
        }

        if (!isLoadingMedia) {togglePopup(); return; };

        const request = await getMediaInformation();
        if (request.status != 'ok') { fail(); return; }

        try {
            await loadMediaFromLinks(request);

            hasLoadedMedia = true;
            togglePopupLoading(false);
        } catch (error) {
            console.error("[YoutubeDL] Failed fetching media content: ", error);
            hasLoadedMedia = false;
        }
    }
    // Getters
    function getPopupElement(element) {
        return document.querySelector(`#youtubeDL-${element}`);
    }
    // Loading and injection
    function togglePopupLoading(loading) {
        const loadingBar = getPopupElement("loading");
        const qualityContainer = getPopupElement("quality");

        loadingBar.hidden = !loading;
        qualityContainer.hidden = loading;
    }
    function injectPopup() {
        /*<div id="youtubeDL-popup-bg" class="shown">
            
        </div>*/
        popupElement = document.createElement("div");
        popupElement.id = "youtubeDL-popup-bg";

        const revisedHTML = popupHTML.replaceAll('{asset}', githubAssetEndpoint);
        popupElement.innerHTML = revisedHTML;
        
        document.body.appendChild(popupElement);

        togglePopupLoading(true);
        createButtonConnections();
        popupElement.hidden = true;
    }
    let hideTimeout;
    let waitingReload = false;
    function togglePopup() {
        popupElement.classList.toggle("shown");

        if (waitingReload) {reloadMedia(); waitingReload = false;}
        else loadMedia();

        // Avoid overlap
        if (popupElement.hidden) {
            clearTimeout(hideTimeout);

            hideTimeout = setTimeout(() => {
                popupElement.hidden = false;
            }, 200);
        };
    }
    // Button
    let injectedShorts = [];
    function injectDownloadButton() {
        let targets = [];
        let style;

        const onShorts = (videoInformation.type == 'shorts');
        
        if (onShorts) {
            // Button for shorts
            const playerControls = document.querySelectorAll('ytd-shorts-player-controls');

            targets = playerControls;
            style = "margin-bottom: 16px; transform: translateY(-15%); z-index: 999; pointer-events: auto;"
        } else {
            // Button for embed and normal player
            targets.push(document.querySelector(".ytp-left-controls"));
            style = "margin-top: 4px; transform: translateY(5%); padding-left: 4px;";
        }

        targets.forEach((target) => {
            if (injectedShorts.includes(target)) return;

            const downloadButton = document.createElement("button");
            downloadButton.classList.add("ytp-button");
            downloadButton.innerHTML = `<img src="${getAsset("YoutubeDL.png")}" style="${style}" width="36" height="36">`;
    
            downloadButton.id = 'youtubeDL-download'
            downloadButton.setAttribute('data-title-no-tooltip', 'YoutubeDL');
            downloadButton.setAttribute('aria-keyshortcuts', 'SHIFT+d');
            downloadButton.setAttribute('aria-label', 'Next keyboard shortcut SHIFT+d');
            downloadButton.setAttribute('data-duration', '');
            downloadButton.setAttribute('data-preview', '');
            downloadButton.setAttribute('data-tooltip-text', '');
            downloadButton.setAttribute('href', '');
            downloadButton.setAttribute('title', 'Download Video');
    
            downloadButton.addEventListener("click", (event) => {
                if (popupElement.hidden) {
                    popupElement.hidden = false;

                    togglePopup();
                }
            });
    
            const chapterContainer = target.querySelector('.ytp-chapter-container');

            if (onShorts) {
                target.insertBefore(downloadButton, target.children[1])
                injectedShorts.push(target);
            } else {
                if (chapterContainer) {
                    downloadButton.style = "overflow: visible; padding-right: 6px; padding-left: 1px;";
                    target.insertBefore(downloadButton, chapterContainer);
                }
                else target.appendChild(downloadButton);
            }
        });
    }

    // Styles
    async function loadCSS(url) {
        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    if (response.status === 200) {
                        const style = document.createElement('style');
                        style.innerHTML = response.responseText;
                        document.head.appendChild(style);
                        resolve();
                    } else {
                        reject(new Error('Failed to load CSS'));
                    }
                }
            });
        });
    }
    function getAsset(filename) {
        return `${githubAssetEndpoint}${filename}`;
    }
    let stylesInjected = false;
    async function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;

        const asset = getAsset("youtubeDL.css");
        await loadCSS(asset);
    }

    // Buttons
    function createButtonConnections() {
        const closeButton = popupElement.querySelector("#youtubeDL-close");

        closeButton.addEventListener('click', (event) => {
            try {
                togglePopup();
                
                setTimeout(() => {
                    popupElement.hidden = true;
                }, 200);
            } catch (error) {console.error(error);}
        });
    }

    // Main page injection
    async function injectAll() {
        if (preinjected) return;
        preinjected = true;

        console.log("[YoutubeDL] Initializing downloader...");
        try {
            await fetchPageInformation();
        } catch (error) {
            isLoadingMedia = false;
            console.error("[YoutubeDL] Failed fetching page information: ", error);
        }

        console.log("[YoutubeDL] Loading custom styles...");
        await injectStyles();

        console.log("[YoutubeDL] Loading popup...");
        injectPopup();

        console.log("[YoutubeDL] Loading button...");
        injectDownloadButton();

        console.log("[YoutubeDL] Setting theme... DARK:", isDarkMode());
        if (!isDarkMode()) toggleLightClass("#youtubeDL-popup");
    }

    let preinjected = false;
    function shouldInject() {
        const targetElement = "#ytd-player";
        const videoPlayer = document.querySelector(targetElement);
        
        if (videoPlayer != null) {
            if (!preinjected) return true;

            const popupBackgroundElement = document.querySelector("#youtubeDL-popup-bg");
            return popupBackgroundElement != null;
        }
        
        return false;
    }

    function updateVideoInformation() {
        videoInformation = getVideoInformation(window.location.href);
    }
    function initialize() {
        updateVideoInformation();
        if (!videoInformation.type) return;
        
        console.log("[YoutubeDL] Loading... // (real)coloride - 2023");

        // Emebds: wait for user to press play
        const isEmbed = (videoInformation.type == 'embed');
        if (isEmbed) {
            const player = document.querySelector("#player");

            player.addEventListener("click", async(event) => {
                await injectAll();
            });
        } else {
            let injectionCheckInterval;
            injectionCheckInterval = setInterval(async() => {
                if (shouldInject())
                    try {
                        clearInterval(injectionCheckInterval);
                        await injectAll();
                    } catch (error) {
                        console.error("[YoutubeDL] ERROR: ", error);
                    }
            }, 600);
        }
    }
    
    initialize();

    // Hot reswap 
    let loadedUrl = window.location.href;
    async function checkUrlChange() {
        const currentUrl = window.location.href;
        
        if (currentUrl != loadedUrl) {
            console.log("[YoutubeDL] Detected URL Change");

            loadedUrl = currentUrl;

            updateVideoInformation();

            if (!videoInformation.type) return;

            waitingReload = true;
            await injectAll();

            if (videoInformation.type == 'shorts') injectDownloadButton();
        }
    }

    setInterval(checkUrlChange, 500);
    window.onhashchange = checkUrlChange;
})();
