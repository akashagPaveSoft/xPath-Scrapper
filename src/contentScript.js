'use strict';
import XPathParser from '@remotemerge/xpath-parser';
const HtmlTableToJson = require('html-table-to-json');
import { json2csv } from 'json-2-csv';
// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Log `title` of current active web page
const pageTitle = document.head.getElementsByTagName('title')[0].innerHTML;
console.log(
  `Page title is: '${pageTitle}' - evaluated by Chrome extension's 'contentScript.js' file`
);

let selectedElement = null;

document.addEventListener('mouseup', (event) => {
  selectedElement = event.target;
  console.log('Selected element mouseup!', selectedElement);
});


// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'getSelectedElementXPath') {
//     const text = getSelectionText();
//     console.log('Inside message!', text);
//     if (text) {
//       const xpath = getXPath(text);
//       parseXPath(xpath);
//       sendResponse({ xpath: xpath });
//     } else {
//       sendResponse({ error: 'No element selected' });
//     }
//   }
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedElementXPath') {
    console.log('Inside message!', selectedElement);
    if (selectedElement) {
      const xpath = getXPath(selectedElement);
      parseXPath(xpath);
      sendResponse({ xpath: xpath });
    } else {
      sendResponse({ error: 'No element selected' });
    }
  }
});

function getXPath(element) {
  // console.log('Element is', element);
  if (element.id !== '') return `id("${element.id}")`;

  if (element === document.body) return element.tagName.toLowerCase();

  const siblings = Array.from(element.parentNode.children);
  const sameTagSiblings = siblings.filter(
    (sibling) => sibling.tagName === element.tagName
  );

  if (sameTagSiblings.length === 1)
    return `${getXPath(element.parentNode)}/${element.tagName.toLowerCase()}`;

  const index = sameTagSiblings.indexOf(element) + 1;
  return `${getXPath(
    element.parentNode
  )}/${element.tagName.toLowerCase()}[${index}]`;
}

function parseXPath(xPath) {
  if (xPath.includes('table')) {
    let tblEl = recurCheckTable(window.getSelection().anchorNode.parentElement);
    let tblElStr = tblEl.outerHTML;
    const jsonObj = new HtmlTableToJson(tblElStr);
    const convertedCSV = json2csv(jsonObj._results[0]);

    const blob = new Blob([convertedCSV], { type: 'text/csv' });

    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = 'converted_data.csv';

    document.body.appendChild(downloadLink);
    downloadLink.click();

    document.body.removeChild(downloadLink);
  }
}

const recurCheckTable = (el) => {
  // console.log('recurCheckTable el', el.tagName.toLowerCase());

  if (el.tagName.toLowerCase() === 'table') {
    return el;
  } else {
    return recurCheckTable(el.parentElement);
  }
};
