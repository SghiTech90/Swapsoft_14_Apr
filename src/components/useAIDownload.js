/**
 * useAIDownload.js
 * Handles Excel report generation and file saving.
 *
 * Fixes:
 * 1. Android 10+ (API >= 29): uses MediaCollection to make file visible in file manager
 * 2. Stage-based progress tied to actual work (not a fixed 3s timer)
 * 3. Proper animation + listener cleanup on every exit path
 * 4. downloadingRef + setDownloading always reset in finally
 */

import { useCallback, useRef } from 'react';
import { PermissionsAndroid, Platform, Animated } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import XLSX from 'xlsx';
import { Toaster } from './Toast';

import { buildingAllHEADApi }         from '../Api/MPRReportApi';
import { CrfMPRreportAllHEADApi }     from '../Api/MPRReportApi';
import { ROADAllHEADApi }             from '../Api/MPRReportApi';
import { NABARDAllHEADApi }           from '../Api/MPRReportApi';
import { AunnityAllHEADApi }          from '../Api/MPRReportApi';
import { MASTERHEADWISEREPOSTBuildingApi } from '../Api/ReportApi';
import { MASTERHEADWISEREPOSTCRFApi }      from '../Api/ReportApi';
import { MASTERHEADWISEREPOSTAnnuityApi }  from '../Api/ReportApi';
import { MASTERHEADWISEREPOSTRoadApi }     from '../Api/ReportApi';
import { MASTERHEADWISEREPOSTNabardApi }   from '../Api/ReportApi';

// ── File name maps ─────────────────────────────────────────────────────────
const STATIC_DATA = {
  Building: 'Building_Report.xlsx',
  CRF:      'CRF_Report.xlsx',
  Annuity:  'Annuity_Report.xlsx',
  NABARD:   'NABARD_Report.xlsx',
  Road:     'Road_Report.xlsx',
};
const HEADWISE_DATA = {
  Building: 'Headwise_Building_Report.xlsx',
  CRF:      'Headwise_CRF_Report.xlsx',
  Annuity:  'Headwise_Annuity_Report.xlsx',
  NABARD:   'Headwise_NABARD_Report.xlsx',
  Road:     'Headwise_Road_Report.xlsx',
};
const ALL_HEADWISE = {
  Building: 'All_Headwise_Building_Report.xlsx',
  CRF:      'All_Headwise_CRF_Report.xlsx',
  Annuity:  'All_Headwise_Annuity_Report.xlsx',
  NABARD:   'All_Headwise_NABARD_Report.xlsx',
  Road:     'All_Headwise_Road_Report.xlsx',
};

// ── Permission helper ───────────────────────────────────────────────────────
async function requestStoragePermission() {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version >= 33)   return true; // Android 13+: no storage permission needed
  if (Platform.Version >= 29)   return true; // Android 10–12: scoped storage, use MediaStore
  try {
    const res = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ]);
    return (
      res['android.permission.READ_EXTERNAL_STORAGE']  === PermissionsAndroid.RESULTS.GRANTED &&
      res['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch { return false; }
}

// ── Data fetcher ────────────────────────────────────────────────────────────
async function fetchReportData(category, sub, location) {
  const creds = { office: location };
  if (category === 'MPR') {
    if (sub === 'Building') return buildingAllHEADApi(creds);
    if (sub === 'CRF')      return CrfMPRreportAllHEADApi(creds);
    if (sub === 'Road')     return ROADAllHEADApi(creds);
    if (sub === 'Annuity')  return AunnityAllHEADApi(creds);
    if (sub === 'NABARD')   return NABARDAllHEADApi(creds);
  }
  if (category === 'Headwise') {
    if (sub === 'Building') return MASTERHEADWISEREPOSTBuildingApi(creds);
    if (sub === 'CRF')      return MASTERHEADWISEREPOSTCRFApi(creds);
    if (sub === 'Road')     return MASTERHEADWISEREPOSTRoadApi(creds);
    if (sub === 'Annuity')  return MASTERHEADWISEREPOSTAnnuityApi(creds);
    if (sub === 'NABARD')   return MASTERHEADWISEREPOSTNabardApi(creds);
  }
  // 'All' and 'Abstract' categories — extend here as needed
  return null;
}

// ── File saver — Android 10+ uses MediaStore so file appears in file manager ─
async function saveExcelFile(base64Data, fileName) {
  const { dirs } = ReactNativeBlobUtil.fs;
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (Platform.OS === 'android' && Platform.Version >= 29) {
    // Write to cache first, then copy into MediaStore Downloads
    const tempPath = `${dirs.CacheDir}/${fileName}`;
    await ReactNativeBlobUtil.fs.writeFile(tempPath, base64Data, 'base64');
    try {
      await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        { name: fileName, parentFolder: '', mimeType },
        'Download',
        tempPath,
      );
    } finally {
      // Always delete the temp file
      try { await ReactNativeBlobUtil.fs.unlink(tempPath); } catch (_) {}
    }
  } else {
    // Android < 10 — direct write to Downloads folder
    const destPath = `${dirs.DownloadDir}/${fileName}`;
    await ReactNativeBlobUtil.fs.writeFile(destPath, base64Data, 'base64');
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────
export default function useAIDownload({
  location,
  progressAnim,
  setProgressValue,
  setDownloading,
  downloadingRef: externalDownloadingRef,
}) {
  const localDownloadingRef = useRef(false);
  const downloadingRef      = externalDownloadingRef ?? localDownloadingRef;
  const activeAnimRef       = useRef(null);   // current running Animated.timing
  const listenerIdRef       = useRef(null);   // current progressAnim listener id

  // ── internal: stop any running animation and remove listener ──────────────
  const cleanupAnim = useCallback(() => {
    if (activeAnimRef.current) {
      activeAnimRef.current.stop();
      activeAnimRef.current = null;
    }
    if (listenerIdRef.current !== null) {
      progressAnim.removeListener(listenerIdRef.current);
      listenerIdRef.current = null;
    }
    progressAnim.removeAllListeners();
  }, [progressAnim]);

  // ── internal: animate progress to a target value ───────────────────────────
  const animateTo = useCallback((toValue, duration) => {
    return new Promise(resolve => {
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }
      const anim = Animated.timing(progressAnim, {
        toValue, duration, useNativeDriver: false,
      });
      activeAnimRef.current = anim;
      anim.start(({ finished }) => {
        activeAnimRef.current = null;
        if (finished) setProgressValue(toValue);
        resolve();
      });
    });
  }, [progressAnim, setProgressValue]);

  // ── main download function ─────────────────────────────────────────────────
  const download = useCallback(async (category, sub, onSpeak) => {
    if (downloadingRef.current) {
      console.log('[Download] already in progress — skip');
      return;
    }

    // ── SETUP ──────────────────────────────────────────────────────────────
    downloadingRef.current = true;
    setDownloading(true);

    // Hard-reset progress to 0 and attach listener
    cleanupAnim();
    progressAnim.setValue(0);
    setProgressValue(0);
    listenerIdRef.current = progressAnim.addListener(({ value }) =>
      setProgressValue(Math.round(value)),
    );

    try {
      // ── STAGE 1: Permission (0 → 15%) ─────────────────────────────────
      console.log('[Download] checking permission...');
      animateTo(15, 400);
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Toaster('Storage permission denied ❌');
        return; // finally will clean up
      }

      // ── STAGE 2: Fetch data (15 → 60%) ────────────────────────────────
      console.log('[Download] fetching data — category:', category, 'sub:', sub);
      Toaster('Fetching report data... 📡');
      onSpeak && onSpeak(`Downloading ${sub} report.`);
      animateTo(60, 2500); // slow animation while API runs

      const response = await fetchReportData(category, sub, location);
      console.log('[Download] API response received, data length:',
        Array.isArray(response?.data) ? response.data.length : 'N/A');

      if (!response?.data || !Array.isArray(response.data) || response.data.length === 0) {
        Toaster('No data found for this report. ⚠️');
        return;
      }

      // ── STAGE 3: Generate XLSX (60 → 85%) ────────────────────────────
      Toaster('Generating Excel file... 📊');
      await animateTo(85, 600);

      const ws    = XLSX.utils.json_to_sheet(response.data);
      const wb    = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      // ── STAGE 4: Save file (85 → 100%) ───────────────────────────────
      let fileName = `${category}_${sub}_Report_${Date.now()}.xlsx`;
      if (category === 'MPR'      && STATIC_DATA[sub])   fileName = STATIC_DATA[sub];
      else if (category === 'Headwise' && HEADWISE_DATA[sub]) fileName = HEADWISE_DATA[sub];
      else if (category === 'All'      && ALL_HEADWISE[sub])  fileName = ALL_HEADWISE[sub];

      console.log('[Download] saving file:', fileName,
        '| Android version:', Platform.Version);
      Toaster('Saving file to Downloads... 💾');

      await saveExcelFile(wbout, fileName);
      await animateTo(100, 400);

      Toaster(`✅ Saved to Downloads: ${fileName}`);
      onSpeak && onSpeak('Report downloaded successfully. Check your Downloads folder.');
      console.log('[Download] ✅ complete:', fileName);

    } catch (err) {
      console.error('[Download] ❌ error:', err?.message, err);
      Toaster('Download failed. Please try again. ❌');
    } finally {
      // Always clean up — regardless of success, error, or early return
      cleanupAnim();
      downloadingRef.current = false;
      setDownloading(false);
    }
  }, [location, progressAnim, setProgressValue, setDownloading, cleanupAnim, animateTo]);

  return { download, downloadingRef };
}