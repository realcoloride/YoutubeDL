// ==UserScript==
// @name         YoutubeDL
// @namespace    https://www.youtube.com/
// @version      1.1.0
// @description  Download youtube videos at the comfort of your browser.
// @author       realcoloride
// @match        https://www.youtube.com/*
// @match        https://www.youtube.com/watch*
// @match        https://www.youtube.com/shorts*
// @match        https://www.youtube.com/embed*
// @match        */*
// @connect      savetube.io
// @connect      googlevideo.com
// @connect      aadika.xyz
// @connect      dlsnap11.xyz
// @connect      dlsnap06.xyz
// @connect      dlsnap02.xyz
// @connect      githubusercontent.com
// @connect      greasyfork.org
// @connect      *
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @license      MIT
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_openInTab
// @grant        GM.openInTab
// ==/UserScript==

(function() {
    'use strict';

    let pageInformation = {
        loaded : false,
        website : "https://savetube.io/",
        searchEndpoint : null,
        convertEndpoint : null,
        checkingEndpoint : null,
        pageValues : {}
    }

    let version = '1.1.0';

    // Process:
    // Search -> Checking -> Convert by -> Convert using c_server

    const githubAssetEndpoint = "https://raw.githubusercontent.com/realcoloride/YoutubeDL/main/";
    const updateGreasyUrl = "https://greasyfork.org/scripts/471103-youtubedl/versions.json";

    let videoInformation;
    const fetchHeaders = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
    };
    const convertHeaders = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "x-requested-key": "de0cfuirtgf67a"
    };
    const downloadHeaders = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest"
    };

    const popupHTML = `
        <div id="youtubeDL-popup">
                <span class="youtubeDL-text bigger float" style="display: inline-flex; align-content: center; align-items: baseline; align-content: normal;">
                    <img src="{asset}YoutubeDL.png" class="youtubeDL-logo float">
                    YoutubeDL - Download video
                    <button id="youtubeDL-close" class="youtubeDL-button youtubeDL-align right" aria-label="Cancel">
                        <span>Close</span>
                    </button>
                </span>

                <div id="youtubeDL-loading">
                    <img src="{asset}loading.svg" style="width:21px; padding-right: 6px; display: flex;">
                    <span class="youtubeDL-text medium center float" style="display: flex;">Loading...</span>
                </div>

                <div id="youtubeDL-quality">
                    <span class="youtubeDL-text medium center float" >Select a format and click on Download.</span><br>
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
                    <span class="youtubeDL-text medium">YoutubeDL by (real)coloride - 2023-2024</span>
                    <br>
                    <a class="youtubeDL-text medium" target="_blank" href="https://www.github.com/realcoloride/YoutubeDL">
                        <img src="{asset}github.png" width="21px">Github</a>
                    
                    <a class="youtubeDL-text medium" target="_blank" href="https://opensource.org/license/mit/">
                        <img src="{asset}mit.png" width="21px">MIT license
                    </a>
                    
                    <a class="youtubeDL-text medium" target="_blank" href="https://ko-fi.com/coloride">
                        <img src="{asset}kofi.png" width="21px">Support me on Ko-Fi
                    </a>

                    <a class="youtubeDL-text medium youtubeDL-flicker" target="_blank" href="https://update.greasyfork.org/scripts/471103/YoutubeDL.user.js" style="color: yellow !important;" id="youtubeDL-update-available" hidden></a>
                </div>
            </div>
    `;
    
    const pageLoadingFailedMessage = 
`[YoutubeDL] An error has occured while fetching data.

This can possibly mean your firewall or IP might be blocking the requests and make sure you've set up the proper permissions to the script.
Please check your firewall or try using a VPN.`;

    const mediaErrorMessage = 
`[YoutubeDL] Failed fetching media.

This could be either because:
- An unhandled error
- A livestream (that is still going on)
- Your tampermonkey settings
or an issue with the API.
Try to refresh the page, otherwise, reinstall the plugin or report the issue.`;

    // Element definitions
    let popupElement;

    // Information gathering
    function getVideoInformation(url) {
        const regex = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/|embed\/)?)([\w-]+)/i;
        const match = regex.exec(url);
        let videoId = match ? match[1] : null;
        
        let type = null;
        if (url.includes("/shorts/"))       type = "shorts";
        else if (url.includes("/watch?v=")) type = "video";
        else if (url.includes("/embed/"))   type = "embed";
        
        return { type, videoId };
    };
    function getVideoUrlFromEmbed(player) {
        return player.parentNode.parentNode.documentURI || window.location.href; // in case not in embed but in embed page itself
    }

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
      
        if (!match) return 0;
      
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
      
        if (!units.hasOwnProperty(unit)) return 0;
      
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

    // potentially adds support for violentmonkey idk
    async function GMxmlHttpRequest(payload, retries = 15, delay = 2000) {
        let solved = null;

        function wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        const onload = payload.onload;
        delete payload["onload"];

        function returnResult(resolve) {
            resolve(onload == undefined ? resolve(solved) : onload(solved));
        }

        return new Promise(async (resolve, _) => {
            for (let attempt = 0; attempt < retries; attempt++) {
                if (solved || attempt >= retries) {
                    returnResult(resolve);
                    return;
                }

                const request = await GM.xmlHttpRequest(payload);

                if (request.status != 429) {
                    solved = request;
                    returnResult(resolve);
                    return;
                }

                console.log(`[YouTubeDL] Request failed due to rate limit (429), retrying in ${delay}ms. [${attempt}/${retries}]`);
                await wait(delay * (attempt + 1));
            }

            loop();
        });
    }

    async function fetchPageInformation(needed = true) {
        if (needed) {
            if (pageInformation.searchEndpoint != null || window.self !== window.top) return;

            showLoadingIcon(true);
            changeLoadingText("Fetching information...");

            // Scrapping internal values
            const pageRequest = await GMxmlHttpRequest({
                url: pageInformation.website,
                method: "GET",
                referrerPolicy: "strict-origin-when-cross-origin",
                headers: fetchHeaders,
                credentials: "include"
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

            showLoadingIcon(false);
        } 

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
        initialFormData.append('client', 'SnapSave.io');
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

            const initialRequest = await GMxmlHttpRequest(payload);
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

                const convertRequest = await GMxmlHttpRequest({
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
                        console.error("[YoutubeDL] Error while checking for job converstion:", error);
                        adaptedResponse.c_status = 'error';

                        updatePopupButton(button, 'Converting Failed'); 
                        setTimeout(() => {
                            button.disabled = false;
                            updatePopupButton(button, 'Download');
                        }, 1000);
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

        let result = {
            status: 'notok'
        };

        async function tryRequest() {
            const request = await GMxmlHttpRequest({
                url: pageInformation.searchEndpoint,
                method: "POST",
                headers: fetchHeaders,
                data: requestBody,
                responseType: 'text',
            });

            // console.trace(`[YouTubeDL] Debug response from server (${request.status}): ${request.responseText}`);
            result = JSON.parse(request.responseText);
        }

        try {
            await tryRequest();

            // first retry with extra form details (sometimes some domain require it for some reason)
            if (result.status == 'error') {
                const { k__token, k_time } = pageInformation.pageValues;

                formData.append('k_exp', k_time);
                formData.append('k_token', k__token);
                await tryRequest();
            }

            // after that consider it as total failure
            if (result.status == 'error') throw new Error(request.responseText);
        } catch (error) {
            console.error(error);
            return result;
        }

        return result;
    }

    // Light mode/Dark mode
    function isDarkMode() {
        if (videoInformation.type == 'embed') return true;
        
        const computedStyles = window.getComputedStyle(document.querySelector('ytd-mini-guide-renderer'));
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

        function retryWith(url) {
            const link = document.createElement('a');
    
            link.href = url;
            link.setAttribute('download', filename);
            link.setAttribute('target', '_blank');
            link.click();
            link.remove();

            updatePopupButton(button, 'Downloaded!');
            button.disabled = false;

            setTimeout(finish, 1000);
        }

        GMxmlHttpRequest({
            method: 'GET',
            headers: downloadHeaders,
            url: url,
            responseType: 'blob',
            onload: async function(response) {
                if (response.status == 403) { 
                    alert("[YoutubeDL] Media expired or may be impossible to download (due to a server fail or copyrighted content), please retry or try with another format/quality, sorry!"); 
                    console.log("YoutubeDL Error:", response.finalUrl, url);
                    await reloadMedia(); 
                    return; 
                }
                
                const blob = response.response;
                const link = document.createElement('a');

                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', filename);
                link.setAttribute('target', '_blank');
                link.click();
                link.remove();

                URL.revokeObjectURL(link.href);
                updatePopupButton(button, 'Downloaded!');
                button.disabled = false;

                setTimeout(finish, 1000);
            },
            onerror: function(error) {
                if (error.finalUrl == url) {
                    retryWith(url);
                    return;
                }

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

        downloadButton.addEventListener("click", async(_) => {
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

                async function fail(status) {
                    throw Error("Failed to download: " + status);
                }

                if (!conversionStatus) { fail(conversionStatus ?? "unknown"); return; }
                if (conversionStatus != 'ok' && conversionStatus != 'success') { fail(conversionStatus); return; }

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
    let hasMediaError = false;
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
                if (roundedSize == 0 && unit == ' B') size = "?";

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

            // keep only the HDR qualities higher than 1080p
            for (const [key, value] of Object.entries(videoLinks)) {
                const qualityName = value.k;
                if (qualityName.endsWith("HDR") && parseInt(qualityName.substr(0, 4)) <= 1080) 
                    delete videoLinks[key];
            }

            // Audio will only have this one so it doesnt matter
            const defaultAudioFormat = audioLinks[Object.keys(audioLinks)[0]];
            defaultAudioFormat.f = "mp3 (audio)";

            addFormat(defaultAudioFormat);

            // Format sorting first
            // Remove auto quality
            videoLinks["auto"] = null;

            // Do not store 3gp quality if available
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
            alert(mediaErrorMessage);
            hasMediaError = true;

            showErrorOnDownloadButtons();

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
    function changeLoadingText(text) {
        const loadingBarSpan = getPopupElement("loading > span");
        if (!loadingBarSpan) return;
        loadingBarSpan.textContent = text;
    }

    async function reloadMedia() {
        console.log("[YoutubeDL] Hot reloading...");

        changeLoadingText("Reloading...");
        isLoadingMedia = false;

        togglePopupLoading(true);
        clearMedia();

        await fetchPageInformation();
        await loadMedia();

        changeLoadingText("Loading...");
    }
    async function loadMedia() {
        if (isLoadingMedia || hasLoadedMedia) return;
        isLoadingMedia = true;

        function fail() {
            isLoadingMedia = false;
            console.error("[YoutubeDL] Failed fetching media.");
        }

        if (!isLoadingMedia) { togglePopup(); return; };

        changeLoadingText("Loading...");
        const request = await getMediaInformation();
        if (request.status != 'ok') { fail(); return; }

        try {
            if (hasLoadedMedia) return;

            hasLoadedMedia = true;
            changeLoadingText("Loading medias...");
            await loadMediaFromLinks(request);

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
        loadingBar.style = loading ? "" : "display: none;"

        // cool slide animation
        const popup = getPopupElement("popup");
        popup.style.maxHeight = loading ? "200px" : popup.scrollHeight + "px";
    }

    let hasPreparedForOuterInjection = false;
    let hasOuterInjectedFromTop = false;
    function prepareOuterInjection() {
        // check if in top window or already prepared
        if (window.self !== window.top || hasPreparedForOuterInjection) return;

        // check if link is different (other pages than youtube's)
        const youtubeRegex = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/|embed\/)?)([\w-]+)/i;
        if (youtubeRegex.test(window.location.href)) return;

        window.top.addEventListener('message', async (event) => {
            if (typeof(event.data) != 'object' || !event.isTrusted) return;

            const data = event.data;

            const title = data["title"];
            const object = data["object"];
            if (title == null) return;

            // check if in youtube no cookie domain (with extra acceptance for regular youtube embed)
            if (event.origin !== "https://www.youtube.com" &&
                event.origin !== "https://www.youtube-nocookie.com") return;

            switch (title) {
                case "YoutubeDL_outerInject":
                    if (hasOuterInjectedFromTop) return;
                    // cross window communication for proxy windows to have interactivity
                    try {
                        // show flickering and loading
                        sendToBottomWindows("YoutubeDL_topLoadingShow", true);

                        // load everything needed on top window if not done
                        console.log("[YoutubeDL/Proxy] Fetching page information...");
                        await fetchPageInformation();

                        console.log("[YoutubeDL/Proxy] Loading custom styles...");
                        await injectStyles();
                
                        console.log("[YoutubeDL/Proxy] Loading popup...");
                        injectPopup();
                        
                        hasOuterInjectedFromTop = true;
                        
                        sendToBottomWindows("YoutubeDL_topLoadingShow", false);
                    } catch (error) {
                        sendToBottomWindows("YoutubeDL_topLoadingShow", false);
                        sendToBottomWindows("YoutubeDL_showError", error);
                    }

                    break;
                case "YoutubeDL_togglePopup":
                    togglePopup();
                    break;
                case "YoutubeDL_togglePopupElement":
                    await togglePopupElement(object);
                    break;
            }
        });

        hasPreparedForOuterInjection = true;
        console.log("[YoutubeDL] Has prepared for outer injection.");
    }
    let hasPreparedForInnerProxyInjection = false;
    let outerProxyLoading = false;
    function prepareOuterInjectionForProxy() {
        // check if in top window or already prepared
        if (window.self === window.top || hasPreparedForInnerProxyInjection) return;

        window.self.addEventListener('message', async (event) => {
            if (typeof(event.data) != 'object' || !event.isTrusted) return;

            const data = event.data;

            const title = data["title"];
            const object = data["object"];
            const passcode = data["passcode"];
            if (title == null || passcode != "spaghetti") return;

            switch (title) {
                case "YoutubeDL_topLoadingShow":
                    outerProxyLoading = object;
                    showLoadingIcon(object);
                    break;
                case "YoutubeDL_showError":
                    console.error("[YoutubeDL] Error coming from proxy window:", object);
                    break;
            }
        });

        hasPreparedForInnerProxyInjection = true;
    }
    function showLoadingIcon(shown) {
        // object is now a boolean
        const downloadButtonImage = document.querySelector("#youtubeDL-download > img");
        if (downloadButtonImage == null) return;

        // set loading icon and flicker if loading else reset
        downloadButtonImage.src = getAsset(shown == true ? "YoutubeDL-loading.png" : "YoutubeDL.png");

        if (shown == true) downloadButtonImage.classList.add("youtubeDL-flicker");
        else               downloadButtonImage.classList.remove("youtubeDL-flicker");
    }
    function injectPopup() {
        /*<div id="youtubeDL-popup-bg" class="shown">
            
        </div>*/
        // if in proxy window/embed
        if (window.self !== window.top) {
            console.log("[YoutubeDL] Embed or internal window detected. Outer-injecting the popup of the iframe.");
            
            // outer injection
            sendToTopWindow("YoutubeDL_outerInject", null);
            return;
        }

        // check if existing already then set
        const existingElement = window.top.document.querySelector("#youtubeDL-popup-bg");
        if (existingElement) {
            popupElement = existingElement;
            return;
        }

        popupElement = document.createElement("div");
        popupElement.id = "youtubeDL-popup-bg";
        // avoids replacement
        popupElement.style = `line-height: initial; font-size: initial; z-index: ${Number.MAX_SAFE_INTEGER}`;

        const revisedHTML = popupHTML.replaceAll('{asset}', githubAssetEndpoint);
        popupElement.innerHTML = revisedHTML;

        document.body.appendChild(popupElement);

        togglePopupLoading(true);
        createButtonConnections();
        popupElement.hidden = true;
    }
    function sendToTopWindow(title, object) {
        window.top.postMessage({ title, object }, '*');
    }
    function sendToBottomWindows(title, object) {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => iframe.contentWindow.postMessage({ title, object, passcode: "spaghetti" }, '*'));
    }
    
    let hideTimeout;
    let waitingReload = false;
    function togglePopup() {
        // if proxy window, send message via outer injection
        if (window.self !== window.top) {
            // outer injection
            sendToTopWindow("YoutubeDL_togglePopup", null);
            return;
        }

        checkUrlChange();

        if (needsUpdate) showNewUpdateText(needsUpdate);
        popupElement.classList.toggle("shown");

        if (waitingReload) { reloadMedia(); waitingReload = false;}
        else loadMedia();

        // Avoid overlap
        if (popupElement.hidden) {
            clearTimeout(hideTimeout);

            hideTimeout = setTimeout(() => popupElement.hidden = false, 200);
        };
    }
    async function togglePopupElement(embedLink) {
        if (popupElement.hidden == false) return;
        popupElement.hidden = false;
        
        const oldId = videoInformation.videoId;

        if (embedLink != null) {
            // reset video information
            videoInformation = getVideoInformation(embedLink);

            // youtube & no cookie support
            // replace embed via normal page for api support
            if (embedLink.includes('youtube.com/embed/') ||
                embedLink.includes('youtube-nocookie.com/embed/')) {
                const videoId = embedLink.split('/embed/')[1].split('?')[0];
                videoInformation.type = 'embed';
                videoInformation.videoId = videoId;
            }
        }

        togglePopup();

        // if changed from embed to another, reload media
        if (oldId != videoInformation.videoId)
            await reloadMedia();
    }
    // Button
    let injectedShorts = [];
    function injectDownloadButton() {
        let targets = [];
        let style;

        const onShorts = (videoInformation.type == 'shorts');
        const onEmbed = (videoInformation.type == 'embed');
        if (onShorts) {
            // Button for shorts
            const playerControls = document.querySelectorAll('ytd-shorts-player-controls');
            targets = playerControls;
            style = "margin-bottom: 16px; transform: translate(36%, 10%); pointer-events: auto;";
        } else if (onEmbed) { 
            // Get all embeds on the page
            const controls = document.querySelectorAll(".ytp-left-controls");
            for (let i = 0; i < controls.length; i++) {
                const control = controls[i];
                const player = control.parentNode.parentNode.parentNode.parentNode;

                control.setAttribute(
                    "embedLink", 
                    // if on top window, you can directly fetch from the iframe
                    // or else if in a proxy window, fetch directly from the location href
                    window.self === window.top ? getVideoUrlFromEmbed(player) : window.self.location.href
                );

                targets.push(control);
            }

            style = "margin-top: 4px; transform: translateY(-7%); display: flex;";
        } else {
            // Button for normal player
            targets.push(document.querySelector(".ytp-left-controls"));
            style = "margin-top: 4px; transform: translateY(-10%); padding-left: 4px; display: flex;";
        }

        targets.forEach((target) => {
            if (injectedShorts.includes(target)) return;

            const downloadButton = document.createElement("button");
            downloadButton.classList.add("ytp-button");
            downloadButton.innerHTML = `<img src="${getAsset(hasFailedLoadingPageInformation ? "YoutubeDL-warning.png" : "YoutubeDL.png")}" style="${style}" width="36" height="36">`;
    
            downloadButton.id = 'youtubeDL-download'
            downloadButton.setAttribute('data-title-no-tooltip', 'YoutubeDL');
            downloadButton.setAttribute('aria-keyshortcuts', 'SHIFT+d');
            downloadButton.setAttribute('aria-label', 'Next keyboard shortcut SHIFT+d');
            downloadButton.setAttribute('data-duration', '');
            downloadButton.setAttribute('data-preview', '');
            downloadButton.setAttribute('data-tooltip-text', '');
            downloadButton.setAttribute('href', '');
            downloadButton.setAttribute('title', 'Download Video');
    
            downloadButton.addEventListener("click", async(_) => {
                if (hasFailedLoadingPageInformation) {
                    alert(pageLoadingFailedMessage);
                    return;
                }
                if (hasMediaError) {
                    alert(mediaErrorMessage);
                    return;
                }

                // left controls
                const embedLink = downloadButton.parentNode.getAttribute("embedLink");

                // if we're in a proxy window/embed
                if (window.self !== window.top) {
                    console.log(`[YoutubeDL] Communicating to toggle popup (outer-proxy) | Linked iframe link: ${embedLink}`);

                    if (outerProxyLoading) return;

                    // outer injection
                    sendToTopWindow("YoutubeDL_togglePopupElement", embedLink);
                    return;
                }

                // else do regularly on top window
                await togglePopupElement(embedLink);
            });
    
            if (target.querySelector("#youtubeDL-download")) return;

            const chapterContainer = target.querySelector('.ytp-chapter-container');

            if (onShorts) {
                target.insertBefore(downloadButton, target.children[target.children.length]);
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
            GMxmlHttpRequest({
                method: 'GET',
                url: url,
                onload: function(response) {
                    if (response.status === 200) {
                        const style = document.createElement('style');
                        style.innerHTML = response.responseText;
                        document.head.appendChild(style);
                        resolve();
                    } else reject(new Error('Failed to load CSS'));
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

        closeButton.addEventListener('click', (_) => {
            try {
                togglePopup();
                
                setTimeout(() => popupElement.hidden = true, 200);
            } catch (error) {console.error(error);}
        });
    }

    function showErrorOnDownloadButtons() {
        const downloadButtonsImages = document.querySelectorAll("#youtubeDL-download > img");

        for (let i = 0; i < downloadButtonsImages.length; i++) {
            const downloadButtonImage = downloadButtonsImages[i];
            downloadButtonImage.src = getAsset("YoutubeDL-warning.png");
        }
    }

    // Main page injection
    let hasFailedLoadingPageInformation = false;
    let didFirstShortsInjection = false;
    async function injectAll() {
        // double check
        if (videoInformation.type == 'shorts' && !didFirstShortsInjection) {
            injectDownloadButton();
            didFirstShortsInjection = true;
        }

        if (preinjected) return;
        preinjected = true;

        console.log("[YoutubeDL] Initializing downloader...");
        try {
            await fetchPageInformation();
        } catch (error) {
            isLoadingMedia = false;
            console.error("[YoutubeDL] Failed fetching page information: ", error);
            hasFailedLoadingPageInformation = true;

            showErrorOnDownloadButtons();
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
    let embedRefreshInterval;
    function initialize() {
        prepareOuterInjection();
        prepareOuterInjectionForProxy();
        updateVideoInformation();
        if (!videoInformation.type) return;
        
        console.log("[YoutubeDL] Loading... // (real)coloride - 2023-2024");

        if (window.self === window.top) prepareOuterInjection();

        // Emebds: wait for user to press play
        const isEmbed = (videoInformation.type == 'embed');
        if (isEmbed) {
            // if embed keep going until url changes
            if (embedRefreshInterval != null) return;

            // we have to handle when its executed in side of the embed and when outside (proxied windows)
            if (window.self !== window.top) {
                // if in proxy window, directly inject because the user would have already clicked
                (async() => await injectAll())();
                return;
            }

            // wait for click
            function injectTo(player) {
                player.addEventListener("click", async(_) => await injectAll()); 
            }

            // check if page is actual embed, get first player & inject (NOT autoplay)
            const regex = /^(?!.*youtube-nocookie\.com).*youtube\.com\/embed\/\w+/;
            if (regex.test(window.location.href)) {
                injectTo(document.querySelector("#player"));
                return;
            }
            
            // else if in global window
            const embeds = window.self.document.querySelectorAll('iframe[data-player="youtube"]');
            if (embeds.length == 0) return;

            // wait for click because of the youtube icon embed
            for (let i = 0; i < players.length; i++) {
                const embed = embeds[i];

                const allowAttributes = embed.getAttribute("allow");

                // check if on autoplay & if not inject only on click
                if (!allowAttributes.includes('autoplay'))
                    injectTo(embed);
                else (async() => await injectAll())();
            }
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

    // Checking for updates
    let needsUpdate = null;
    function showNewUpdateText(version) {
        needsUpdate = version;

        const element = document.querySelector("#youtubeDL-update-available"); if (!element) return;
        element.hidden = false;
        element.innerText = `An update (${version}) is available! Click here to update.`;
    }
    function checkForUpdates() {
        (async() => {
            const payload = {
                url: updateGreasyUrl,
                method: "GET",
                responseType: 'text',
                referrerPolicy: "strict-origin-when-cross-origin",
                mode: "cors",
                credentials: "omit"
            };

            const request = await GMxmlHttpRequest(payload);
            const response = JSON.parse(request.responseText);

            const currentVersion = response[0]["version"];
            const requiresUpdate = currentVersion != version;

            if (requiresUpdate) showNewUpdateText(currentVersion);
        })();
    }

    // Hot reswap 
    let loadedUrl = window.location.href;
    async function checkUrlChange() {
        const currentUrl = window.location.href;
        
        if (currentUrl != loadedUrl) {
            console.log("[YoutubeDL] Detected URL Change");

            loadedUrl = currentUrl;
            clearInterval(embedRefreshInterval);

            didFirstShortsInjection = false;

            updateVideoInformation();

            console.log(`[YoutubeDL] Detected video type: ${videoInformation.type}`);

            if (!videoInformation.type) return;

            waitingReload = true;
            await injectAll();

            if (videoInformation.type == 'shorts') injectDownloadButton();
        }
    }

    initialize();
    checkForUpdates();

    setInterval(checkUrlChange, 500);
    window.onhashchange = checkUrlChange;
})();
