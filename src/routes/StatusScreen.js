/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, StatusBar, StyleSheet,
  FlatList, TextInput, Modal, Alert, Animated, KeyboardAvoidingView,
  Platform, ScrollView, PermissionsAndroid, Image, ActivityIndicator, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {uploadToCloudinary} from '../utils/cloudinary';
import {
  Circleget2515Api, CirclegetAuntyApi, CirclegetBuildingApi, CirclegetCRFApi,
  CirclegetDepositFundApi, CirclegetDPDCApi, CirclegetGATAApi, CirclegetGATDApi,
  CirclegetGATFBCApi, CirclegetMLAApi, CirclegetNABARDApi,
  CirclegetNonResidentialBuildingApi, CirclegetResidentialBuildingApi, CirclegetRoadApi,
  ContUpdPanelAuntyApi, ContUpdPanelBuildingApi, ContUpdPanelCrfApi,
  ContUpdPanelDeposite_fundApi, ContUpdPanelNABARDApi, ContUpdPanelROADApi,
  ConUploadImageApi, ContUpdPanel2515Api, ContUpdPanelDPDCApi, ContUpdPanelGAT_AApi,
  ContUpdPanelGAT_DApi, ContUpdPanelGAT_FBCApi, ContUpdPanelMLAApi, ContUpdPanelMPApi,
  ContUpdPanelNonResBuiApi, ContUpdPanelResBuiApi,
  EEUpdPanelAuntyApi, EEUpdPanelBuildingApi, EEUpdPanelCRFApi, EEUpdPanelDPDCApi,
  EEUpdPanelDepositeFundApi, EEUpdPanelGatAApi, EEUpdPanelGatDApi, EEUpdPanelGatFBCApi,
  EEUpdPanelMLAApi, EEUpdPanelMPApi, EEUpdPanelNRBApi, EEUpdPanelRBApi,
  EEUpdPanel2515Api, EEUpdPanelNABARDApi, EEUpdPanelROADApi,
  UpdateStatusAnnuityApi, UpdateStatus2515Api, UpdateStatusBilidingApi,
  UpdateStatusCrfApi, UpdateStatusDepositeFundApi, UpdateStatusDPDCApi,
  UpdateStatusGatAApi, UpdateStatusGatBApi, UpdateStatusGatFBCApi,
  UpdateStatusMLAApi, UpdateStatusMPApi, UpdateStatusNRBApi, UpdateStatusRBApi,
  UpdateStatusNabardApi, UpdateStatusRoadApi,
} from '../Api/StatusReportApi';
import {Toaster} from '../components/Toast';
import Geolocation from 'react-native-geolocation-service';
import {encode as btoa} from 'base-64';
import RNFS from 'react-native-fs';
import {PERMISSIONS, RESULTS, check, request, openSettings} from 'react-native-permissions';

const {width} = Dimensions.get('window');

// ─── Pagination ───────────────────────────────────────────────────────────────
const PAGE_SIZE         = 10;
const BOTTOM_TAB_HEIGHT = 70;

const PaginationBar = ({page, totalPages, onPageChange}) => {
  if (!totalPages || totalPages <= 1) return null;
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;
  const WINDOW = 2;
  let winStart = Math.max(1, page - WINDOW);
  let winEnd   = Math.min(totalPages, page + WINDOW);
  if (winEnd - winStart < WINDOW * 2) {
    if (winStart === 1) winEnd   = Math.min(totalPages, winStart + WINDOW * 2);
    else                winStart = Math.max(1, winEnd   - WINDOW * 2);
  }
  const pageNumbers = [];
  for (let i = winStart; i <= winEnd; i++) pageNumbers.push(i);
  return (
    <View style={paginationStyles.wrapper}>
      <TouchableOpacity onPress={() => !isPrevDisabled && onPageChange(1)} activeOpacity={isPrevDisabled ? 1 : 0.7} style={[paginationStyles.navBtn, isPrevDisabled && paginationStyles.navBtnDisabled]}>
        <Text style={paginationStyles.navBtnText}>«</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => !isPrevDisabled && onPageChange(page - 1)} activeOpacity={isPrevDisabled ? 1 : 0.7} style={[paginationStyles.navBtn, isPrevDisabled && paginationStyles.navBtnDisabled]}>
        <Text style={paginationStyles.navBtnText}>‹</Text>
      </TouchableOpacity>
      <View style={paginationStyles.pageRow}>
        {pageNumbers.map(num => (
          <TouchableOpacity key={num} onPress={() => onPageChange(num)} activeOpacity={0.7} style={[paginationStyles.pageBtn, page === num && paginationStyles.pageBtnActive]}>
            <Text style={[paginationStyles.pageBtnText, page === num && paginationStyles.pageBtnTextActive]}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => !isNextDisabled && onPageChange(page + 1)} activeOpacity={isNextDisabled ? 1 : 0.7} style={[paginationStyles.navBtn, isNextDisabled && paginationStyles.navBtnDisabled]}>
        <Text style={paginationStyles.navBtnText}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => !isNextDisabled && onPageChange(totalPages)} activeOpacity={isNextDisabled ? 1 : 0.7} style={[paginationStyles.navBtn, isNextDisabled && paginationStyles.navBtnDisabled]}>
        <Text style={paginationStyles.navBtnText}>»</Text>
      </TouchableOpacity>
      <Text style={paginationStyles.pageInfo}>{page}/{totalPages}</Text>
    </View>
  );
};

const paginationStyles = StyleSheet.create({
  wrapper:           {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: '#007bff', paddingVertical: 10, paddingHorizontal: 6, paddingBottom: BOTTOM_TAB_HEIGHT + 10, elevation: 10, shadowColor: '#000', shadowOffset: {width: 0, height: -3}, shadowOpacity: 0.12, shadowRadius: 4},
  pageRow:           {flexDirection: 'row', alignItems: 'center'},
  navBtn:            {width: 36, height: 36, borderRadius: 18, backgroundColor: '#007bff', alignItems: 'center', justifyContent: 'center', marginHorizontal: 3, flexShrink: 0},
  navBtnDisabled:    {backgroundColor: '#ccc'},
  navBtnText:        {color: '#fff', fontSize: 18, fontWeight: 'bold', lineHeight: 22, textAlign: 'center'},
  pageBtn:           {width: 34, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd'},
  pageBtnActive:     {backgroundColor: '#007bff', borderColor: '#007bff'},
  pageBtnText:       {fontSize: 13, color: '#333', fontWeight: '500'},
  pageBtnTextActive: {color: '#fff', fontWeight: 'bold'},
  pageInfo:          {fontSize: 11, color: '#666', marginLeft: 2, minWidth: 20, textAlign: 'right', flexShrink: 0},
});

// ─── SE Offices ───────────────────────────────────────────────────────────────
const SE_OFFICES = [
  {label: 'सा. बां. विभाग, अकोला',   value: 'P_W_Division_Akola',    color: '#A066FF'},
  {label: 'सा. बां. विभाग, अकोट',    value: 'P_W_Division_WBAkola',  color: '#2EC4B6'},
  {label: 'सा. बां. विभाग, वाशिम',   value: 'P_W_Division_Washim',   color: '#FF6B6B'},
  {label: 'सा. बां. विभाग, बुलढाणा', value: 'P_W_Division_Buldhana', color: '#FFD93D'},
  {label: 'सा. बां. विभाग, खामगांव', value: 'P_W_Division_Khamgaon', color: '#00A8E8'},
  {label: 'सा. बां. मं, अकोला',      value: 'P_W_Circle_Akola',      color: '#FF9F1C'},
];

const CIRCLE_SUB_OFFICES = [
  {label: 'सा. बां. विभाग, अकोला',   value: 'P_W_Division_Akola',    color: '#A066FF'},
  {label: 'सा. बां. विभाग, अकोट',    value: 'P_W_Division_WBAkola',  color: '#2EC4B6'},
  {label: 'सा. बां. विभाग, वाशिम',   value: 'P_W_Division_Washim',   color: '#FF6B6B'},
  {label: 'सा. बां. विभाग, बुलढाणा', value: 'P_W_Division_Buldhana', color: '#FFD93D'},
  {label: 'सा. बां. विभाग, खामगांव', value: 'P_W_Division_Khamgaon', color: '#00A8E8'},
];

const CARD_MARGIN = 10;
const CARD_WIDTH  = (width - CARD_MARGIN * 3) / 2;

// ─── Column widths ────────────────────────────────────────────────────────────
const COL = {srNo: 60, workId: 150, kamaName: 400, shera: 250, pratima: 130};

// ─── SE Office Selector Grid ──────────────────────────────────────────────────
const OfficeSelectorGrid = ({onSelect}) => (
  <View style={gridStyles.wrapper}>
    <View style={gridStyles.header}>
      <Text style={gridStyles.headerText}>सार्वजनिक बांधकाम मंडळ अकोला</Text>
      <Text style={gridStyles.subText}>विभाग निवडा</Text>
    </View>
    <View style={gridStyles.grid}>
      {SE_OFFICES.map(office => (
        <TouchableOpacity key={office.value} activeOpacity={0.75} onPress={() => onSelect(office.value)} style={[gridStyles.card, {backgroundColor: office.color}]}>
          <Text style={gridStyles.cardText} numberOfLines={3}>{office.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const gridStyles = StyleSheet.create({
  wrapper:    {paddingHorizontal: CARD_MARGIN, paddingTop: 12, paddingBottom: 4, backgroundColor: '#f5f5f5'},
  header:     {backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12, alignItems: 'center', elevation: 4},
  headerText: {fontSize: 14, fontWeight: 'bold', color: '#222', textAlign: 'center'},
  subText:    {fontSize: 11, color: '#666', marginTop: 2},
  grid:       {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  card:       {width: CARD_WIDTH, minHeight: 90, borderRadius: 14, padding: 12, marginBottom: CARD_MARGIN, justifyContent: 'center', alignItems: 'center', elevation: 5},
  cardText:   {color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center', lineHeight: 17},
});

const ALL_SECTIONS = [
  'Building', 'CRF', 'Annuity', 'Nabard', 'Road',
  'NonPlan(3054)', '2216', '2059', 'Deposit', 'DPDC',
  'Gat_BCF', 'Gat_D', 'MLA', 'MP2', '2515',
];

// ─────────────────────────────────────────────────────────────────────────────
const StatusScreen = ({navigation}) => {
  const [selectedReportType, setSelectedReportType] = useState('Building');
  const [location, setLocation] = useState(null);
  const [role,     setRole]     = useState(null);
  const [userName, setUserName] = useState(null);

  const [seSelectedOffice, setSeSelectedOffice] = useState(null);
  const [seLoading,        setSeLoading]        = useState(false);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage,       setCurrentPage]       = useState(1);
  const [circleCurrentPage, setCircleCurrentPage] = useState(1);

  // ── Regular report data ────────────────────────────────────────────────────
  const [statusreportbuildingData, setBuildingData] = useState([]);
  const [statusreportCrfData,      setCrfData]      = useState([]);
  const [statusreportAnnuityData,  setAnnuityData]  = useState([]);
  const [statusreportNabardData,   setNabardData]   = useState([]);
  const [statusreportRoaddata,     setRoadData]     = useState([]);
  const [statusreport2515Data,     set2515Data]     = useState([]);
  const [statusreportDepositData,  setDepositData]  = useState([]);
  const [statusreportDPDCData,     setDPDCData]     = useState([]);
  const [statusreportGatAData,     setGatAData]     = useState([]);
  const [statusreportGatBData,     setGatBData]     = useState([]);
  const [statusreportGatFBCData,   setGatFBCData]   = useState([]);
  const [statusreportMLAData,      setMLAData]      = useState([]);
  const [statusreportMPData,       setMPData]       = useState([]);
  const [statusreportNRBData,      setNRBData]      = useState([]);
  const [statusreportRBData,       setRBData]       = useState([]);

  const [activeTab,     setActiveTab]     = useState('upload');
  const [selectedItem,  setSelectedItem]  = useState(null);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [remarkText,    setRemarkText]    = useState('');
  const modalAnim = useState(new Animated.Value(0))[0];

  const [statusupdateBuildingdata,  setUpdateStatusdata]   = useState([]);
  const [statusupdateroadData,      setUpdateRoaddata]     = useState([]);
  const [statusupdatecrfdata,       setUpdatecrfdata]      = useState([]);
  const [statusupdateAnnuitydata,   setUpdatecAnnuitydata] = useState([]);
  const [statusupdateNabarddata,    setUpdatecNabarddata]  = useState([]);
  const [statusupdate2515Data,      setUpdate2515Data]     = useState([]);
  const [statusupdateDepositData,   setUpdateDepositData]  = useState([]);
  const [statusupdateDPDCData,      setUpdateDPDCData]     = useState([]);
  const [statusupdateGatAData,      setUpdateGatAData]     = useState([]);
  const [statusupdateGatBData,      setUpdateGatBData]     = useState([]);
  const [statusupdateGatFBCData,    setUpdateGatFBCData]   = useState([]);
  const [statusupdateMLAData,       setUpdateMLAData]      = useState([]);
  const [statusupdateMPData,        setUpdateMPData]       = useState([]);
  const [statusupdateNRBData,       setUpdateNRBData]      = useState([]);
  const [statusupdateRBData,        setUpdateRBData]       = useState([]);

  const [selectedKanName, setSelectedKanName] = useState('');
  const [modalType,       setModalType]       = useState(null);
  const [selectedImages,  setSelectedImages]  = useState([]);
  const [currentIndex,    setCurrentIndex]    = useState(0);
  const [loading,         setLoading]         = useState(true);
  const flatListRef = useRef(null);
  const [sections, setSections] = useState([]);

  // Circle sub-office data (P_W_Circle_Akola only)
  const [circleSubData, setCircleSubData] = useState({});

  // Single-office circle data
  const [circleBuildingData,                   setCircleBuildingData]                    = useState([]);
  const [circleCRFData,                        setCircleCRFData]                         = useState([]);
  const [circleAuntyData,                      setCircleAuntyData]                       = useState([]);
  const [circleNabardData,                     setCircleNabardData]                      = useState([]);
  const [circleRoadData,                       setCircleRoadData]                        = useState([]);
  const [circleDepositFundData,                setCircleDepositFundData]                 = useState([]);
  const [circleDPDCData,                       setCircleDPDCData]                        = useState([]);
  const [circleGATAData,                       setCircleGATAData]                        = useState([]);
  const [circleGATFBCData,                     setCircleGATFBCData]                      = useState([]);
  const [circleGATDData,                       setCircleGATDData]                        = useState([]);
  const [circleMLAData,                        setCircleMLAData]                         = useState([]);
  const [circle2515Data,                       setCircle2515Data]                        = useState([]);
  const [circleResidentialBuilding2216Data,    setCircleResidentialBuilding2216Data]     = useState([]);
  const [circleNonResidentialBuilding2059Data, setCirclegetNonResidentialBuilding2059Data] = useState([]);

  const [uploading, setUploading] = useState(false);

  // ── API maps ───────────────────────────────────────────────────────────────
  const EEApiMap = {
    Building: EEUpdPanelBuildingApi, CRF: EEUpdPanelCRFApi, Annuity: EEUpdPanelAuntyApi,
    Nabard: EEUpdPanelNABARDApi, Road: EEUpdPanelROADApi, '2515': EEUpdPanel2515Api,
    Deposit: EEUpdPanelDepositeFundApi, DPDC: EEUpdPanelDPDCApi, 'NonPlan(3054)': EEUpdPanelGatAApi,
    Gat_BCF: EEUpdPanelGatFBCApi, Gat_D: EEUpdPanelGatDApi, MLA: EEUpdPanelMLAApi,
    MP2: EEUpdPanelMPApi, 2216: EEUpdPanelNRBApi, 2059: EEUpdPanelRBApi,
  };

  const ContApiMap = {
    Building: ContUpdPanelBuildingApi, CRF: ContUpdPanelCrfApi, Annuity: ContUpdPanelAuntyApi,
    Nabard: ContUpdPanelNABARDApi, Road: ContUpdPanelROADApi, '2515': ContUpdPanel2515Api,
    Deposit: ContUpdPanelDeposite_fundApi, DPDC: ContUpdPanelDPDCApi, 'NonPlan(3054)': ContUpdPanelGAT_AApi,
    Gat_BCF: ContUpdPanelGAT_FBCApi, Gat_D: ContUpdPanelGAT_DApi, MLA: ContUpdPanelMLAApi,
    MP2: ContUpdPanelMPApi, 2216: ContUpdPanelResBuiApi, 2059: ContUpdPanelNonResBuiApi,
  };

  const setDataMap = {
    Building: setBuildingData, CRF: setCrfData, Annuity: setAnnuityData,
    Nabard: setNabardData, Road: setRoadData, '2515': set2515Data,
    Deposit: setDepositData, DPDC: setDPDCData, 'NonPlan(3054)': setGatAData,
    Gat_BCF: setGatFBCData, Gat_D: setGatBData, MLA: setMLAData,
    MP2: setMPData, 2216: setNRBData, 2059: setRBData,
  };

  const getCircleApi = reportType => ({
    Building: CirclegetBuildingApi, CRF: CirclegetCRFApi, Annuity: CirclegetAuntyApi,
    Nabard: CirclegetNABARDApi, Road: CirclegetRoadApi, Deposit: CirclegetDepositFundApi,
    DPDC: CirclegetDPDCApi, 'NonPlan(3054)': CirclegetGATAApi, Gat_BCF: CirclegetGATFBCApi,
    Gat_D: CirclegetGATDApi, MLA: CirclegetMLAApi, MP2: CirclegetMLAApi,
    2216: CirclegetResidentialBuildingApi, 2059: CirclegetNonResidentialBuildingApi,
    2515: Circleget2515Api,
  }[reportType] || null);

  const circleSetMap = {
    Building: setCircleBuildingData, CRF: setCircleCRFData, Annuity: setCircleAuntyData,
    Nabard: setCircleNabardData, Road: setCircleRoadData, Deposit: setCircleDepositFundData,
    DPDC: setCircleDPDCData, 'NonPlan(3054)': setCircleGATAData, Gat_BCF: setCircleGATFBCData,
    Gat_D: setCircleGATDData, MLA: setCircleMLAData, MP2: setCircleMLAData,
    2216: setCircleResidentialBuilding2216Data, 2059: setCirclegetNonResidentialBuilding2059Data,
    2515: setCircle2515Data,
  };

  const getSingleCircleData = reportType => ({
    Building: circleBuildingData, CRF: circleCRFData, Annuity: circleAuntyData,
    Nabard: circleNabardData, Road: circleRoadData, Deposit: circleDepositFundData,
    DPDC: circleDPDCData, 'NonPlan(3054)': circleGATAData, Gat_BCF: circleGATFBCData,
    Gat_D: circleGATDData, MLA: circleMLAData, MP2: circleMLAData,
    '2515': circle2515Data, '2216': circleResidentialBuilding2216Data,
    '2059': circleNonResidentialBuilding2059Data,
  }[reportType] || []);

  const getCurrentData = () => ({
    Building: statusreportbuildingData, CRF: statusreportCrfData,
    Annuity: statusreportAnnuityData, Nabard: statusreportNabardData,
    Road: statusreportRoaddata, '2515': statusreport2515Data,
    Deposit: statusreportDepositData, DPDC: statusreportDPDCData,
    'NonPlan(3054)': statusreportGatAData, Gat_BCF: statusreportGatFBCData,
    Gat_D: statusreportGatBData, MLA: statusreportMLAData, MP2: statusreportMPData,
    '2216': statusreportNRBData, '2059': statusreportRBData,
  }[selectedReportType] || []);

  // Reset pages when section or office changes
  useEffect(() => { setCurrentPage(1); setCircleCurrentPage(1); }, [selectedReportType]);
  useEffect(() => { setCircleCurrentPage(1); }, [seSelectedOffice]);

  const resetCircleData = () => {
    setCircleBuildingData([]); setCircleCRFData([]); setCircleAuntyData([]);
    setCircleNabardData([]); setCircleRoadData([]); setCircleDepositFundData([]);
    setCircleDPDCData([]); setCircleGATAData([]); setCircleGATFBCData([]);
    setCircleGATDData([]); setCircleMLAData([]); setCircle2515Data([]);
    setCircleResidentialBuilding2216Data([]); setCirclegetNonResidentialBuilding2059Data([]);
    setCircleSubData({});
  };

  useEffect(() => {
    AsyncStorage.multiGet(['userRole', 'LOCATION_ID', 'USER_NAME']).then(pairs => {
      pairs.forEach(([key, val]) => {
        if (!val) return;
        if (key === 'userRole')    setRole(val);
        if (key === 'LOCATION_ID') setLocation(val);
        if (key === 'USER_NAME')   setUserName(val);
      });
    });
  }, []);

  const fetchReportData = useCallback(async (roleParam, reportType, locationParam, userNameParam) => {
    setLoading(true);
    try {
      let apiFn = null;
      const payload = {office: locationParam};
      if (roleParam === 'Executive Engineer') {
        apiFn = EEApiMap[reportType];
      } else if (['Contractor', 'Sectional Engineer', 'Deputy Engineer'].includes(roleParam)) {
        apiFn = ContApiMap[reportType];
        payload.name = userNameParam;
      }
      if (apiFn) {
        const response = await apiFn(payload);
        const setData  = setDataMap[reportType];
        if (response?.success && Array.isArray(response.data)) setData(groupByWorkId(response.data));
        else setData([]);
      }
    } catch (e) { console.error(e); setDataMap[reportType]?.([]); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSingleCircleData = useCallback(async (reportType, officeValue) => {
    const api = getCircleApi(reportType);
    if (!api) return;
    try {
      setLoading(true);
      const response = await api({office: officeValue});
      if (response?.success) circleSetMap[reportType]?.(response.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllSectionsForOffice = useCallback(async officeValue => {
    await Promise.all(ALL_SECTIONS.map(async reportType => {
      const api = getCircleApi(reportType);
      if (!api) return;
      try {
        const r = await api({office: officeValue});
        if (r?.success) circleSetMap[reportType]?.(r.data);
      } catch (e) { console.error(e); }
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllSubOffices = useCallback(async () => {
    const result = {};
    await Promise.all(
      CIRCLE_SUB_OFFICES.map(async ({value}) => {
        result[value] = {};
        await Promise.all(ALL_SECTIONS.map(async reportType => {
          const api = getCircleApi(reportType);
          if (!api) return;
          try {
            const r = await api({office: value});
            result[value][reportType] = r?.success ? (r.data || []) : [];
          } catch (e) { result[value][reportType] = []; }
        }));
      }),
    );
    setCircleSubData(result);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeOfficeSelect = async officeValue => {
    setSeSelectedOffice(officeValue);
    setSeLoading(true);
    setSelectedReportType('Building');
    resetCircleData();
    if (officeValue === 'P_W_Circle_Akola') await fetchAllSubOffices();
    else await fetchAllSectionsForOffice(officeValue);
    setSeLoading(false);
  };

  useEffect(() => {
    setSections(ALL_SECTIONS);
    if (['Executive Engineer', 'Contractor', 'Sectional Engineer', 'Deputy Engineer'].includes(role)) {
      fetchReportData(role, selectedReportType, location, userName);
    }
    if (role === 'Supreintending Engiener' && seSelectedOffice && seSelectedOffice !== 'P_W_Circle_Akola') {
      fetchSingleCircleData(selectedReportType, seSelectedOffice);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReportType, role, location, userName]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const groupByWorkId = data => {
    const grouped = {};
    data.forEach(item => {
      const workId = item['वर्क आयडी'] || item.WorkId;
      if (!workId) return;
      if (!grouped[workId]) grouped[workId] = {...item, प्रतिमा: []};
      const imageField = item.प्रतिमा || item.ImageUrl || item.imageUrl || item.Image;
      if (imageField) {
        Array.isArray(imageField)
          ? grouped[workId].प्रतिमा.push(...imageField)
          : grouped[workId].प्रतिमा.push(imageField);
      }
    });
    return Object.values(grouped);
  };

  const bufferToBase64 = buffer => {
    if (!buffer?.data) return null;
    const binary = buffer.data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return `data:image/jpeg;base64,${btoa(binary)}`;
  };

  const normalizeImages = image => {
    if (!image) return [];
    if (Array.isArray(image)) return image.map(img => typeof img === 'string' ? img : img?.data ? bufferToBase64(img) : null).filter(Boolean);
    if (typeof image === 'string') return [image];
    if (image?.data) { const b64 = bufferToBase64(image); return b64 ? [b64] : []; }
    return [];
  };

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {title: 'Location Permission', message: 'App needs access to your location', buttonPositive: 'OK'},
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Location permission denied');
      } else if (Platform.OS === 'ios') {
        const status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (status !== RESULTS.GRANTED) throw new Error('Location permission denied');
      }
      return new Promise((resolve, reject) =>
        Geolocation.getCurrentPosition(p => resolve(p.coords), e => reject(e), {enableHighAccuracy: true, timeout: 10000, maximumAge: 1000}),
      );
    } catch (e) { console.log('📍 Location error:', e.message); throw e; }
  };

  const handleUploadImage = item => {
    Alert.alert('Upload Photo', 'Please choose an option', [
      {text: 'Camera',  onPress: () => openImagePicker(item, 'camera')},
      {text: 'Gallery', onPress: () => openImagePicker(item, 'gallery')},
      {text: 'Cancel',  style: 'cancel'},
    ], {cancelable: true});
  };

  const openImagePicker = async (item, source) => {
    const options = {mediaType: 'photo', includeBase64: true, quality: 0.8, saveToPhotos: false};
    const callback = async response => {
      if (response.didCancel) return;
      if (response.errorCode) { Toaster(response.errorMessage || 'Error selecting image.'); return; }
      try {
        setUploading(true);
        const image = response.assets[0];
        const {latitude, longitude} = await getCurrentLocation();
        const sanitizedFileName = (image.fileName || `image_${Date.now()}.jpg`).replace(/\//g, '_').replace(/\\/g, '_').slice(-50);
        Toaster('Uploading image to cloud...');
        let cloudinaryUrl = null;
        try {
          cloudinaryUrl = await uploadToCloudinary(image.base64, 'image/jpeg');
          Toaster('Cloud upload successful!');
        } catch (e) { console.error('❌ Cloudinary:', e); Toaster('Cloud upload failed. Using server upload...'); }
        const result = await ConUploadImageApi({
          office: location, WorkId: item['वर्क आयडी'],
          ImageUrl: cloudinaryUrl || undefined, Data: cloudinaryUrl ? undefined : image.base64,
          filename: sanitizedFileName, Content: 'image/jpeg',
          Longitude: longitude, Latitude: latitude,
          Type: selectedReportType, Description: item['शेरा'] || '',
        });
        if (result?.success) {
          Toaster('Photo uploaded successfully...');
          if (['Executive Engineer', 'Contractor', 'Sectional Engineer', 'Deputy Engineer'].includes(role)) {
            fetchReportData(role, selectedReportType, location, userName);
          }
        } else { Toaster('Photo not uploaded successfully...'); }
      } catch (e) { console.error('Upload error:', e.message); Toaster('An error occurred during upload.'); }
      finally { setUploading(false); }
    };
    try {
      if (source === 'camera') {
        if (Platform.OS === 'android') {
          const g = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (g !== PermissionsAndroid.RESULTS.GRANTED) { Toaster('Camera permission denied.'); return; }
        }
        launchCamera(options, callback);
      } else { launchImageLibrary(options, callback); }
    } catch (e) { Toaster(`Failed to launch image picker. ${e.message || ''}`); }
  };

  const handleDownloadAllImages = async (images = []) => {
    if (Platform.OS === 'android') {
      const g = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {title: 'Storage Permission', message: 'App needs access to your storage.', buttonNeutral: 'Ask Me Later', buttonNegative: 'Cancel', buttonPositive: 'OK'},
      );
      if (g !== PermissionsAndroid.RESULTS.GRANTED) { Toaster('Storage permission denied'); return; }
    }
    try {
      for (let i = 0; i < images.length; i++) {
        const image    = images[i];
        const fileName = `image_${Date.now()}_${i}.jpg`;
        const path     = Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;
        if (typeof image === 'string' && image.startsWith('http')) await RNFS.downloadFile({fromUrl: image, toFile: path}).promise;
        else if (typeof image === 'string') await RNFS.writeFile(path, image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      }
      Toaster(`All ${images.length} images downloaded.`);
    } catch (e) { console.error('Download error:', e); Toaster('Failed to download one or more images.'); }
  };

  const handleSaveRemark = async () => {
    const apiMap = {
      Building: UpdateStatusBilidingApi, Road: UpdateStatusRoadApi, CRF: UpdateStatusCrfApi,
      Annuity: UpdateStatusAnnuityApi, Nabard: UpdateStatusNabardApi, '2515': UpdateStatus2515Api,
      Deposit: UpdateStatusDepositeFundApi, DPDC: UpdateStatusDPDCApi, 'NonPlan(3054)': UpdateStatusGatAApi,
      Gat_BCF: UpdateStatusGatFBCApi, Gat_D: UpdateStatusGatBApi, MLA: UpdateStatusMLAApi,
      MP2: UpdateStatusMPApi, '2216': UpdateStatusNRBApi, '2059': UpdateStatusRBApi,
    };
    const apiFunction = apiMap[selectedReportType];
    if (!apiFunction || !selectedItem) return;
    try {
      await apiFunction({office: location, workID: selectedItem, status: remarkText});
      setDataMap[selectedReportType]?.(prev =>
        prev.map(item => item['वर्क आयडी'] === selectedItem ? {...item, शेरा: remarkText} : item),
      );
    } catch (e) { console.error(e); }
    setModalVisible(false);
    setSelectedItem(null);
    setRemarkText('');
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderReportTypes = () => (
    <View style={{height: 50, backgroundColor: '#fff'}}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reportTypeContainer}>
        {sections.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.reportButton, selectedReportType === type && {backgroundColor: '#000'}]}
            onPress={() => setSelectedReportType(type)}>
            <Text style={{color: selectedReportType === type ? 'white' : 'black', fontWeight: 'bold', textAlign: 'center', fontSize: 12}}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  const renderHeader = () => (
    <View>
      {renderReportTypes()}
      <View style={[styles.tableRow, {backgroundColor: '#f2f2f2'}]}>
        <Text style={[styles.headerCell, {width: 100}]}>अ:क्र</Text>
        <Text style={[styles.headerCell, {width: 140}]}>वर्क आयडी</Text>
        <Text style={[styles.headerCell, {width: 140}]}>अर्थसंकल्पीय वर्ष</Text>
        <Text style={[styles.headerCell, {width: 450}]}>कामाचे नाव</Text>
        <Text style={[styles.headerCell, {width: 300}]}>शेरा</Text>
        {activeTab === 'upload' && (
          <>
            <Text style={[styles.headerCell, {width: 140}]}>प्रतिमा पहा</Text>
            <Text style={[styles.headerCell, {width: 140}]}>प्रतिमा अपलोड</Text>
          </>
        )}
      </View>
    </View>
  );

  const renderCircleTableHeader = (showSectionTabs = true) => (
    <View>
      {showSectionTabs && renderReportTypes()}
      <View style={[styles.tableRow, {backgroundColor: '#f2f2f2'}]}>
        <Text style={[styles.headerCell, {width: COL.srNo}]}>अनु क्र.</Text>
        <Text style={[styles.headerCell, {width: COL.workId}]}>वर्क आयडी</Text>
        <Text style={[styles.headerCell, {width: COL.kamaName}]}>कामाचे नाव</Text>
        <Text style={[styles.headerCell, {width: COL.shera}]}>शेरा</Text>
        <Text style={[styles.headerCell, {width: COL.pratima, borderRightWidth: 0}]}>प्रतिमा</Text>
      </View>
    </View>
  );

  const renderItem = ({item, index: localIndex}) => {
    const absoluteIndex    = (currentPage - 1) * PAGE_SIZE + localIndex;
    const workId           = item['वर्क आयडी'] || item.WorkId || '';
    const year             = item['अर्थसंकल्पीय वर्ष'] || item.Arthsankalpiyyear || '';
    const kamacheName      = item['कामाचे नाव'] || item.KamacheName || '';
    const shera            = item['शेरा'] || item.Shera || '';
    const normalizedImages = normalizeImages(item['प्रतिमा'] || item.ImageUrl || item.imageUrl || item.Image || null);
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.cell, {width: 100}]}>{absoluteIndex + 1}</Text>
        <Text style={[styles.cell, {width: 140}]}>{workId}</Text>
        <Text style={[styles.cell, {width: 140}]}>{year}</Text>
        <Text style={[styles.cell, {width: 450}]}>{kamacheName}</Text>
        <View style={[styles.cell, {width: 300, flexDirection: 'row', alignItems: 'center'}]}>
          <Text style={{flex: 1, flexWrap: 'wrap'}}>{shera}</Text>
          {activeTab !== 'upload' && (
            <TouchableOpacity
              style={{paddingHorizontal: 5}}
              onPress={() => {
                setSelectedItem(workId); setSelectedKanName(kamacheName);
                setRemarkText(shera); setModalType('remark'); setModalVisible(true);
                Animated.timing(modalAnim, {toValue: 1, duration: 300, useNativeDriver: true}).start();
              }}>
              <Icon name="edit" size={18} color="black" />
            </TouchableOpacity>
          )}
        </View>
        {activeTab === 'upload' && (
          <>
            <View style={[styles.cell, {width: 140}]}>
              <TouchableOpacity
                onPress={() => {
                  if (!normalizedImages.length) return;
                  setSelectedImages(normalizedImages); setSelectedItem(workId);
                  setSelectedKanName(kamacheName); setModalType('images'); setModalVisible(true);
                  Animated.timing(modalAnim, {toValue: 1, duration: 300, useNativeDriver: true}).start();
                }}
                style={[styles.viewImgBtn, {backgroundColor: normalizedImages.length > 0 ? '#007bff' : '#ccc', opacity: normalizedImages.length > 0 ? 1 : 0.6}]}
                disabled={!normalizedImages.length}>
                <Text style={[styles.viewImgBtnTxt, {color: normalizedImages.length > 0 ? 'white' : '#888'}]}>View Image</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.cell, {width: 140}]}>
              <TouchableOpacity onPress={() => handleUploadImage(item)} style={{paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#e0e0e0', borderRadius: 4}}>
                <Text style={{textAlign: 'center', fontSize: 12}}>Upload Image</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderCircleRow = (item, absoluteIndex) => {
    const workId           = item.WorkId || item['वर्क आयडी'] || '';
    const kamacheName      = item.KamacheName?.trim() || item['कामाचे नाव']?.trim() || '';
    const shera            = item.Shera?.trim() || item['शेरा']?.trim() || '';
    const normalizedImages = normalizeImages(item['प्रतिमा'] || item.ImageUrl || item.imageUrl || item.Image || null);
    const hasImages        = normalizedImages.length > 0;
    return (
      <View key={`cr-${absoluteIndex}`} style={styles.tableRow}>
        <View style={[styles.circleCell, {width: COL.srNo}]}><Text style={styles.circleCellText}>{absoluteIndex + 1}</Text></View>
        <View style={[styles.circleCell, {width: COL.workId}]}><Text style={styles.circleCellText}>{workId}</Text></View>
        <View style={[styles.circleCell, {width: COL.kamaName}]}><Text style={[styles.circleCellText, {textAlign: 'left'}]}>{kamacheName}</Text></View>
        <View style={[styles.circleCell, {width: COL.shera}]}><Text style={[styles.circleCellText, {textAlign: 'left'}]}>{shera}</Text></View>
        <View style={[styles.circleCell, {width: COL.pratima, borderRightWidth: 0}]}>
          <TouchableOpacity
            onPress={() => {
              if (!hasImages) return;
              setSelectedImages(normalizedImages); setSelectedItem(workId);
              setSelectedKanName(kamacheName); setModalType('images'); setModalVisible(true);
              Animated.timing(modalAnim, {toValue: 1, duration: 300, useNativeDriver: true}).start();
            }}
            style={[styles.viewImgBtn, {backgroundColor: hasImages ? '#007bff' : '#ccc', opacity: hasImages ? 1 : 0.6}]}
            disabled={!hasImages}>
            <Text style={[styles.viewImgBtnTxt, {color: hasImages ? 'white' : '#888'}]}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Modal ──────────────────────────────────────────────────────────────────
  const renderModal = () => (
    <Modal animationType="none" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrapper}>
        <Animated.View style={[styles.modalContainer, {transform: [{translateY: modalAnim.interpolate({inputRange: [0, 1], outputRange: [500, 0]})}]}]}>
          <TouchableOpacity style={styles.closeIcon} onPress={() => setModalVisible(false)}><Icon name="close" size={24} color="#000" /></TouchableOpacity>
          <Text style={styles.modalTitle}>वर्क आयडी {selectedItem}</Text>
          <Text style={styles.modalSubtitle}>कामाचे नाव : {selectedKanName}</Text>
          {modalType === 'remark' && (
            <>
              <TextInput style={styles.modalInput} value={remarkText} onChangeText={setRemarkText} multiline />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={[styles.modalButton, {backgroundColor: 'green'}]} onPress={handleSaveRemark}>
                  <Text style={styles.modalButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {modalType === 'images' && selectedImages?.length > 0 ? (
            <View>
              <FlatList
                ref={flatListRef}
                data={selectedImages}
                horizontal pagingEnabled
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({item: imgItem}) => <Image source={{uri: imgItem}} style={styles.imageView} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{padding: 10}}
                onScroll={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width))}
                scrollEventThrottle={16}
              />
              {selectedImages.length > 1 && currentIndex > 0 && (
                <TouchableOpacity style={styles.leftArrowbtn} onPress={() => flatListRef.current?.scrollToIndex({index: currentIndex - 1, animated: true})}>
                  <Icon name="arrow-left" size={22} color="#000" />
                </TouchableOpacity>
              )}
              {selectedImages.length > 1 && currentIndex < selectedImages.length - 1 && (
                <TouchableOpacity style={styles.rightArrowbtn} onPress={() => flatListRef.current?.scrollToIndex({index: currentIndex + 1, animated: true})}>
                  <Icon name="arrow-right" size={22} color="#000" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownloadAllImages(selectedImages)}>
                <Icon name="download" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          ) : modalType === 'images' ? (
            <View style={styles.noImageContainer}><Text style={styles.noImageText}>प्रतिमा उपलब्ध नाहीत.</Text></View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // ── Regular paginated table ────────────────────────────────────────────────
  // FIX: NO contentContainerStyle={{flexGrow:1}} on the vertical ScrollView
  const renderPaginatedTable = fullData => {
    const totalPages = Math.ceil(fullData.length / PAGE_SIZE);
    const slicedData = fullData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    return (
      <View style={{flex: 1}}>
        <View style={{flex: 1}}>
          <ScrollView style={{flex: 1}} nestedScrollEnabled>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <FlatList
                contentContainerStyle={{paddingBottom: 4}}
                data={slicedData}
                extraData={selectedReportType}
                keyExtractor={(_, i) => i.toString()}
                ListHeaderComponent={renderHeader}
                renderItem={renderItem}
                scrollEnabled={false}
                nestedScrollEnabled
                ListEmptyComponent={
                  <View style={{padding: 40, alignItems: 'center'}}>
                    <Text style={{color: '#999', fontSize: 14}}>No data available</Text>
                  </View>
                }
              />
            </ScrollView>
          </ScrollView>
        </View>
        <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={p => setCurrentPage(p)} />
      </View>
    );
  };

  // ── Single-office circle table ─────────────────────────────────────────────
  // FIX: NO contentContainerStyle={{flexGrow:1}} on the vertical ScrollView
  const renderSingleCircleTable = fullData => {
    const totalPages = Math.ceil(fullData.length / PAGE_SIZE);
    const slicedData = fullData.slice((circleCurrentPage - 1) * PAGE_SIZE, circleCurrentPage * PAGE_SIZE);
    return (
      <View style={{flex: 1}}>
        <View style={{flex: 1}}>
          <ScrollView style={{flex: 1}} nestedScrollEnabled>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <FlatList
                contentContainerStyle={{paddingBottom: 4}}
                ListHeaderComponent={() => renderCircleTableHeader(true)}
                data={slicedData}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({item, index: li}) => renderCircleRow(item, (circleCurrentPage - 1) * PAGE_SIZE + li)}
                scrollEnabled={false}
                nestedScrollEnabled
                ListEmptyComponent={
                  <View style={{padding: 40, alignItems: 'center'}}>
                    <Text style={{color: '#999', fontSize: 14}}>No data available</Text>
                  </View>
                }
              />
            </ScrollView>
          </ScrollView>
        </View>
        <PaginationBar page={circleCurrentPage} totalPages={totalPages} onPageChange={p => setCircleCurrentPage(p)} />
      </View>
    );
  };

  // ── Circle Akola — 5 sub-offices stacked, shared pagination ───────────────
  // FIX: NO contentContainerStyle={{flexGrow:1}} on the vertical ScrollView
  const renderCircleAkolaView = () => {
    const combinedRows = [];
    CIRCLE_SUB_OFFICES.forEach(({label, value, color}) => {
      (circleSubData[value]?.[selectedReportType] || []).forEach(row =>
        combinedRows.push({...row, _officeLabel: label, _officeColor: color, _officeValue: value}),
      );
    });
  
    const totalPages = Math.ceil(combinedRows.length / PAGE_SIZE);
    const start      = (circleCurrentPage - 1) * PAGE_SIZE;
    const slicedRows = combinedRows.slice(start, start + PAGE_SIZE);
  
    const displayItems = [];
    let lastOffice = null;
    slicedRows.forEach((row, idx) => {
      if (row._officeValue !== lastOffice) {
        displayItems.push({
          _type: 'officeHeader',
          _key:  `oh-${row._officeValue}`,
          label: row._officeLabel,
          color: row._officeColor,
        });
        lastOffice = row._officeValue;
      }
      displayItems.push({
        _type:         'row',
        _key:          `row-${start + idx}`,
        data:          row,
        absoluteIndex: start + idx,
      });
    });
  
    return (
      <View style={{flex: 1, backgroundColor: '#fff'}}>
  
        {/* Section tabs — explicit height, no flex, no ScrollView nesting issues */}
        {renderReportTypes()}
  
        {/* Table — takes remaining space */}
        <View style={{flex: 1}}>
          <ScrollView style={{flex: 1}} nestedScrollEnabled>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <FlatList
                data={displayItems}
                keyExtractor={item => item._key}
                scrollEnabled={false}
                nestedScrollEnabled
                contentContainerStyle={{paddingBottom: 4}}
                ListHeaderComponent={() => renderCircleTableHeader(false)}
                ListEmptyComponent={
                  <View style={{padding: 40, alignItems: 'center'}}>
                    <Text style={{color: '#999', fontSize: 14}}>No data available</Text>
                  </View>
                }
                renderItem={({item}) => {
                  if (item._type === 'officeHeader') {
                    return (
                      <View style={[styles.subOfficeHeader, {backgroundColor: item.color}]}>
                        <Text style={styles.subOfficeHeaderText}>{item.label}</Text>
                      </View>
                    );
                  }
                  return renderCircleRow(item.data, item.absoluteIndex);
                }}
              />
            </ScrollView>
          </ScrollView>
        </View>
  
        <PaginationBar
          page={circleCurrentPage}
          totalPages={totalPages}
          onPageChange={p => setCircleCurrentPage(p)}
        />
      </View>
    );
  };

  // ── SE office drill-down ───────────────────────────────────────────────────
  const renderSeOfficeView = () => (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <View style={seStyles.backBar}>
        <TouchableOpacity
          onPress={() => { setSeSelectedOffice(null); setSelectedReportType('Building'); resetCircleData(); }}
          style={seStyles.backBtn}>
          <Icon name="arrow-back-ios" size={18} color="#007bff" />
          <Text style={seStyles.backBtnText}>विभाग बदला</Text>
        </TouchableOpacity>
        <Text style={seStyles.officeName} numberOfLines={1}>
          {SE_OFFICES.find(o => o.value === seSelectedOffice)?.label}
        </Text>
      </View>
      {seLoading ? (
        <View style={seStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={seStyles.loadingText}>डेटा लोड होत आहे...</Text>
        </View>
      ) : (
        <View style={{flex: 1}}>
          {seSelectedOffice === 'P_W_Circle_Akola'
            ? renderCircleAkolaView()
            : renderSingleCircleTable(getSingleCircleData(selectedReportType))
          }
          {renderModal()}
        </View>
      )}
    </View>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Status</Text>
      </View>

      {/* ══ SUPERINTENDING ENGINEER ══════════════════════════════════════════ */}
      {role === 'Supreintending Engiener' && (
        <>
          {!seSelectedOffice ? (
            <ScrollView style={{backgroundColor: '#f5f5f5', flex: 1}}>
              <OfficeSelectorGrid onSelect={handleSeOfficeSelect} />
              <View style={seStyles.prompt}>
                <Icon name="touch-app" size={44} color="#bbb" />
                <Text style={seStyles.promptText}>विभाग निवडा</Text>
                <Text style={seStyles.promptSub}>वरील विभागावर क्लिक करा म्हणजे अहवाल दिसेल</Text>
              </View>
            </ScrollView>
          ) : renderSeOfficeView()}
        </>
      )}

      {/* ══ EXECUTIVE ENGINEER ═══════════════════════════════════════════════ */}
      {role === 'Executive Engineer' && (
        <View style={styles.contentContainer}>
          <View style={styles.buttomContiner}>
            <TouchableOpacity
              style={[styles.imageButtonContiner, {backgroundColor: activeTab === 'upload' ? 'black' : '#ccc'}]}
              onPress={() => setActiveTab('upload')}>
              <Text style={[styles.buttonTxt, {color: activeTab === 'upload' ? 'white' : 'black'}]}>Upload Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageButtonContiner, {backgroundColor: activeTab === 'status' ? 'black' : '#ccc'}]}
              onPress={() => setActiveTab('status')}>
              <Text style={[styles.buttonTxt, {color: activeTab === 'status' ? 'white' : 'black'}]}>Status</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.mainFlatlistContiner, {flex: 1, paddingBottom: 0}]}>
            {loading || uploading
              ? <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#007AFF" /></View>
              : renderPaginatedTable(getCurrentData())}
          </View>
          {renderModal()}
        </View>
      )}

      {/* ══ CONTRACTOR / SECTIONAL / DEPUTY ══════════════════════════════════ */}
      {['Contractor', 'Sectional Engineer', 'Deputy Engineer'].includes(role) && (
        <View style={styles.contentContainer}>
          <View style={styles.buttomContiner}>
            <TouchableOpacity
              style={[styles.imageButtonContiner, {backgroundColor: activeTab === 'upload' ? 'black' : '#ccc'}]}
              onPress={() => setActiveTab('upload')}>
              <Text style={[styles.buttonTxt, {color: activeTab === 'upload' ? 'white' : 'black'}]}>Upload Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.imageButtonContiner, {backgroundColor: activeTab === 'status' ? 'black' : '#ccc'}]}
              onPress={() => setActiveTab('status')}>
              <Text style={[styles.buttonTxt, {color: activeTab === 'status' ? 'white' : 'black'}]}>Status</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.mainFlatlistContiner, {flex: 1, paddingBottom: 0}]}>
            {loading || uploading
              ? <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#007AFF" /></View>
              : renderPaginatedTable(getCurrentData())}
          </View>
          {renderModal()}
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const seStyles = StyleSheet.create({
  backBar:          {flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4ff', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#d0d9f0'},
  backBtn:          {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#007bff', marginRight: 12},
  backBtnText:      {color: '#007bff', fontWeight: 'bold', fontSize: 13, marginLeft: 2},
  officeName:       {flex: 1, fontSize: 13, fontWeight: '600', color: '#333'},
  loadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: 'white'},
  loadingText:      {marginTop: 12, fontSize: 14, color: '#555'},
  prompt:           {alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 30},
  promptText:       {fontSize: 16, fontWeight: 'bold', color: '#555', marginTop: 10},
  promptSub:        {fontSize: 12, color: '#999', marginTop: 4, textAlign: 'center', paddingHorizontal: 30},
});

const styles = StyleSheet.create({
  safeArea:             {flex: 1, backgroundColor: 'black'},
  header:               {flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, backgroundColor: 'black'},
  backButton:           {padding: 5},
  headerTitle:          {fontSize: 20, fontWeight: 'bold', color: 'white', marginLeft: 15},
  contentContainer:     {flex: 1, backgroundColor: 'white', padding: 10, alignItems: 'center'},
  buttomContiner:       {height: '6%', width: '95%', marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly'},
  imageButtonContiner:  {height: '90%', width: '35%', backgroundColor: 'black', borderRadius: 40, alignItems: 'center', justifyContent: 'center'},
  buttonTxt:            {fontSize: 15, color: 'white', fontWeight: 'bold'},
  tableHeader:          {flexDirection: 'row', backgroundColor: '#e0e0e0', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#ccc'},
  headerCell:           {fontWeight: 'bold', textAlign: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRightWidth: 1, borderColor: '#ccc', fontSize: 13},
  tableRow:             {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc', minHeight: 60, alignItems: 'center', backgroundColor: '#fff'},
  remarkText:           {flex: 1, textAlign: 'center', color: 'black', fontSize: 16},
  mainFlatlistContiner: {width: '100%', marginTop: 10, paddingBottom: 0},
  modalWrapper:         {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  modalContainer:       {width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5},
  modalTitle:           {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  modalSubtitle:        {fontSize: 16, marginBottom: 10},
  modalInput:           {borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, textAlignVertical: 'top', height: 100, marginBottom: 15},
  modalButtonRow:       {flexDirection: 'row', justifyContent: 'space-between'},
  modalButton:          {flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 8, alignItems: 'center'},
  modalButtonText:      {color: 'white', fontWeight: 'bold'},
  closeIcon:            {position: 'absolute', top: 10, right: 10, zIndex: 1, padding: 5},
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,   // reduced from 8
    gap: 6,
  },
  reportButton:         {paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center'},
  cell:                 {padding: 10, textAlign: 'center', fontSize: 13, borderRightWidth: 1, borderColor: '#ccc'},
  circleCell:           {paddingVertical: 10, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#ccc', alignSelf: 'stretch'},
  circleCellText:       {fontSize: 13, color: '#222', textAlign: 'center', flexWrap: 'wrap'},
  viewImgBtn:           {paddingVertical: 7, paddingHorizontal: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center'},
  viewImgBtnTxt:        {color: '#fff', fontSize: 12, fontWeight: 'bold'},
  imageView:            {width: 200, height: 200, resizeMode: 'contain', marginRight: 10, borderRadius: 8},
  noImageContainer:     {padding: 20, alignItems: 'center', justifyContent: 'center'},
  noImageText:          {fontSize: 16, color: '#888'},
  leftArrowbtn:         {position: 'absolute', left: 10, top: '50%', transform: [{translateY: -20}], backgroundColor: '#fff', padding: 10, borderRadius: 20, elevation: 3, zIndex: 10},
  rightArrowbtn:        {position: 'absolute', right: 10, top: '50%', transform: [{translateY: -20}], backgroundColor: '#fff', padding: 10, borderRadius: 20, elevation: 3, zIndex: 10},
  downloadBtn:          {position: 'absolute', bottom: 20, right: 20, backgroundColor: '#e0e0e0', padding: 10, borderRadius: 50, elevation: 4, zIndex: 5},
  subOfficeHeader:      {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, minWidth: COL.srNo + COL.workId + COL.kamaName + COL.shera + COL.pratima},
  subOfficeHeaderText:  {color: '#fff', fontWeight: 'bold', fontSize: 14},
  simpleRow:            {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc', padding: 10, alignItems: 'center'},
  simpleCell:           {fontSize: 14, paddingHorizontal: 8},
});

export default StatusScreen;