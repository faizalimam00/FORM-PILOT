# Install FormPilot

FormPilot installs in desktop Chrome from a ZIP file. You do not need an account, Node.js or build tools to use the packaged extension.

[**Download FormPilot for Chrome**](https://github.com/faizalimam00/FORM-PILOT/raw/refs/heads/main/downloads/formpilot-0.1.0-chrome.zip) · [SHA-256 checksum](../downloads/SHA256SUMS.txt)

## Add it to Chrome

1. Extract the downloaded ZIP into a permanent folder, such as `Documents/FormPilot`.
2. Open `chrome://extensions` in Chrome’s address bar.
3. Turn on **Developer mode** in the top-right corner. This enables Chrome’s manual extension installation controls.
4. Click **Load unpacked** and choose the extracted folder containing `manifest.json`. Select the folder, not the ZIP or the manifest file alone.
5. Pin FormPilot using Chrome’s Extensions menu.
6. Open FormPilot, choose **Profiles**, and create and save a personal or work profile.

On a form, open FormPilot and click **Fill form**. All empty, high-confidence matches fill together. Existing values, uncertain mappings and sensitive fields stay unchanged. FormPilot never submits the form.

For explanations or corrections, choose **Review fields & corrections** in the same popup. Use **Undo last fill** while the popup remains open, for up to five minutes. Closing it or scanning again clears the previous undo.

## Browser support

Chrome and Chromium desktop are tested. Chrome 120+ is the API requirement; the [verification report](QA_REPORT.md) records tested versions. Edge and Brave use the same extension format but have not been independently verified. Their extension pages are `edge://extensions` and `brave://extensions`.

Firefox, Safari and mobile browsers are unsupported. Managed browsers may restrict Developer mode; contact your browser administrator if the option is unavailable.

## Update FormPilot

1. Export a profile backup from **Profiles → Import, export & privacy**. The export contains personal information.
2. Extract the new ZIP and replace the old extension files in the **same installation folder**.
3. Open `chrome://extensions` and click **Reload** on FormPilot’s card.
4. Refresh your form tab, then reopen FormPilot.

Keep the folder path unchanged to preserve the extension’s identity. Leave FormPilot installed while replacing its files. This installation method uses manual updates.

## Remove FormPilot

Choose **Remove** on FormPilot’s card at `chrome://extensions`. Chrome normally removes the extension’s saved data. Exported files and information already entered into websites remain outside the extension; remove those separately when needed.

## Troubleshooting

- **Chrome cannot find the manifest:** open the extracted folder and confirm that `manifest.json` is directly inside it.
- **An older interface still appears:** replace files in the folder Chrome originally loaded, click Reload, and refresh the form tab.
- **The page cannot be inspected:** browser settings, extension stores and some protected pages restrict extension access. Open an ordinary website form and invoke FormPilot there.
- **A field stays blank:** check your saved profile, then inspect the mapping in **Review fields & corrections**. Uncertain fields require your selection.

See [supported controls and troubleshooting](../apps/website/src/pages/limitations.md) or [report an issue](https://github.com/faizalimam00/FORM-PILOT/issues) with a fictional example.
