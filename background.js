// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Get token from https://newsela-ir-hook.azurewebsites.net/api/what?code=CGT9rel2GF9IGjEvVN8u4Bg0L8BaXJhaaWaCebnmloaPTQzXaSDCsA==

chrome.contextMenus.create({
  id: "main read menu item",
  title: "Help me read this",
  contexts: ["selection", "link"],
});

const loadedMap = {};
function ensureSDKLoadedForTab(tabId) {
  return new Promise((resolve, reject) => {
    if (loadedMap[tabId]) {
      resolve();
    } else {
      try {
        chrome.tabs.executeScript(
          { file: "./immersive-reader-sdk.1.1.0.js" },
          (success) => {
            if (success) {
              loadedMap[tabId] = true;
              resolve();
            } else {
              reject();
            }
          }
        );
      } catch (e) {
        reject();
      }
    }
  });
}

function readText(text) {
  const characterLimit = 10000;
  if (text.length > characterLimit) {
    return readText(
      `Sorry, there is a per use character limit of ${characterLimit}, please select a shorter section of text!`
    );
  }
  fetch(
    "https://newsela-ir-hook.azurewebsites.net/api/what?code=CGT9rel2GF9IGjEvVN8u4Bg0L8BaXJhaaWaCebnmloaPTQzXaSDCsA=="
  )
    .then((response) => response.json())
    .then((json) => json.access_token)
    .then((access_token) => {
      const data = {
        chunks: [
          {
            mimeType: "text/html",
            content: text,
          },
        ],
      };

      // const script = `
      //     var aadToken = "${access_token}";
      //     var subdomain = "NewselaImmersiveReader"; // Your subdomain goes here
      //     const storedUserPreferences = localStorage.getItem("USER_PREFERENCES");
      //     let userPreferences = storedUserPreferences === null ? null : storedUserPreferences;
      //     const options =  {
      //       "readAloudOptions": { "voice": "male", "speed": 1.25, "autoplay": true },
      //       "displayOptions":  {"themeOption": "Dark" },
      //       "preferences": userPreferences,
      //       "onPreferencesChanged": (value) => { userPreferences = value;
      //         localStorage.setItem("USER_PREFERENCES", userPreferences);
      //       }
      //     }
      //     ImmersiveReader.launchAsync(aadToken, subdomain, ${JSON.stringify(
      //       data,
      //     )}, options);

      const buildOptions = () => {
        const storedUserPreferences = localStorage.getItem("USER_PREFERENCES");
        let userPreferences =
          storedUserPreferences === null ? null : storedUserPreferences;
        const options = {
          preferences: userPreferences,
          onPreferencesChanged: (value) => {
            userPreferences = value;
            localStorage.setItem("USER_PREFERENCES", userPreferences);
          },
          readAloudOptions: { voice: "male", speed: 1, autoplay: true },
          displayOptions: { themeOption: "Dark" },
        };

        return options;
      };


      const script = `
          var aadToken = "${access_token}";
          var subdomain = "NewselaImmersiveReader"; // Your subdomain goes here
          ImmersiveReader.launchAsync(aadToken, subdomain, ${JSON.stringify(
            data
          )}, {
            "readAloudOptions": { "voice": "male",
            "speed": 1.25,
            "autoplay": true,
            onPreferencesChanged: function(value) {
              console.log(value, 'aqqqui');
              userPreferences = value;
              localStorage.setItem("USER_PREFERENCES", userPreferences);
            }
          
          }});
      `;
      console.log(JSON.stringify(script));
      chrome.tabs.executeScript(
        { file: "./immersive-reader-sdk.1.1.0.js" },
        (success) => {
          chrome.tabs.executeScript({ code: script });
        }
      );
    });
}

function newTab(info, tab) {
  const { menuItemId } = info;

  if (menuItemId === "anyNameWillDo") {
    chrome.tabs.create({
      url: "http://translate.google.com/#auto/fa/" + info.selectionText.trim(),
    });
  }
}

//create context menu options.  the 'on click' command is no longer valid in manifest version 3

// chrome.contextMenus.create({
//   title: "Title of Option",
//   id: "anyNameWillDo",
//   contexts: ["selection"]
// });

//This tells the context menu what function to run when the option is selected

chrome.contextMenus.onClicked.addListener(newTab);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  ensureSDKLoadedForTab(tab.id).then(function () {
    console.log(info.selectionText);
    return readText(info.selectionText);
  });
});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.executeScript(
    tab.id,
    {
      code: "window.getSelection().toString();",
    },
    (selection) => {
      readText(selection[0]);
    }
  );
});
