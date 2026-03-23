import React, {useEffect, useState, useCallback} from 'react';
import {
  View, Text, FlatList, TouchableOpacity, SafeAreaView,
  StatusBar, StyleSheet, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  ContractorAunnityReportApi, ContractorBuildingReportApi, ContractorCRFReportApi,
  ContractorNabardReportApi, ContractorRoadReportApi, MASTERHEADWISEREPOST2515Api,
  MASTERHEADWISEREPOSTAnnuityApi, MASTERHEADWISEREPOSTBuildingApi, MASTERHEADWISEREPOSTCRFApi,
  MASTERHEADWISEREPOSTDPDCApi, MASTERHEADWISEREPOSTDepositeFundApi, MASTERHEADWISEREPOSTGatAApi,
  MASTERHEADWISEREPOSTGatDApi, MASTERHEADWISEREPOSTGatFBCApi, MASTERHEADWISEREPOSTMLAApi,
  MASTERHEADWISEREPOSTMPApi, MASTERHEADWISEREPOSTNabardApi, MASTERHEADWISEREPOSTNRBApi,
  MASTERHEADWISEREPOSTRBApi, MASTERHEADWISEREPOSTRoadApi,
} from '../Api/ReportApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

const BOTTOM_TAB_HEIGHT = 70;
const PAGE_SIZE         = 10;

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

// ─── PaginationBar ────────────────────────────────────────────────────────────
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
      <TouchableOpacity onPress={() => !isPrevDisabled && onPageChange(1)} activeOpacity={isPrevDisabled ? 1 : 0.7} style={[paginationStyles.navBtn, isPrevDisabled && paginationStyles.navBtnDisabled]}><Text style={paginationStyles.navBtnText}>«</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => !isPrevDisabled && onPageChange(page - 1)} activeOpacity={isPrevDisabled ? 1 : 0.7} style={[paginationStyles.navBtn, isPrevDisabled && paginationStyles.navBtnDisabled]}><Text style={paginationStyles.navBtnText}>‹</Text></TouchableOpacity>
      <View style={paginationStyles.pageRow}>
        {pageNumbers.map(num => (
          <TouchableOpacity key={num} onPress={() => onPageChange(num)} activeOpacity={0.7} style={[paginationStyles.pageBtn, page === num && paginationStyles.pageBtnActive]}>
            <Text style={[paginationStyles.pageBtnText, page === num && paginationStyles.pageBtnTextActive]}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => !isNextDisabled && onPageChange(page + 1)} activeOpacity={isNextDisabled ? 1 : 0.7} style={[paginationStyles.navBtn, isNextDisabled && paginationStyles.navBtnDisabled]}><Text style={paginationStyles.navBtnText}>›</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => !isNextDisabled && onPageChange(totalPages)} activeOpacity={isNextDisabled ? 1 : 0.7} style={[paginationStyles.navBtn, isNextDisabled && paginationStyles.navBtnDisabled]}><Text style={paginationStyles.navBtnText}>»</Text></TouchableOpacity>
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

// ─── Office Selector Grid ─────────────────────────────────────────────────────
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

// ─── Column width calculator ──────────────────────────────────────────────────
const calcColWidth = (colName, data) => {
  const strWidth = str => { if (!str) return 0; let w = 0; for (const ch of str) { w += ch.charCodeAt(0) > 127 ? 9 : 7; } return w; };
  let max = strWidth(colName) + 16;
  for (const row of data.slice(0, 10)) { const val = row[colName]; const w = strWidth(val !== null && val !== undefined ? String(val) : '') + 16; if (w > max) max = w; }
  return Math.min(Math.max(Math.ceil(max), 60), 300);
};

// ─── DynamicTable ─────────────────────────────────────────────────────────────
const DynamicTable = ({data, label, page, onPageChange}) => {
  if (!data || data.length === 0) {
    return (
      <View style={tableStyles.outerContainer}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }
  const totalPages     = Math.ceil(data.length / PAGE_SIZE);
  const start          = (page - 1) * PAGE_SIZE;
  const paginatedSlice = data.slice(start, start + PAGE_SIZE);
  const columns        = Object.keys(data[0]);
  const colWidths      = columns.reduce((acc, col) => { acc[col] = calcColWidth(col, data); return acc; }, {});

  const renderHeaderRow = () => (
    <View style={[styles.tableRow, {backgroundColor: '#f2f2f2'}]}>
      {columns.map(col => (
        <View key={col} style={[styles.cell, {width: colWidths[col]}]}>
          <Text style={styles.headerCell}>{col}</Text>
        </View>
      ))}
    </View>
  );

  const renderDataRow = ({item}) => (
    <View style={styles.tableRow}>
      {columns.map(col => (
        <View key={col} style={[styles.cell, {width: colWidths[col]}]}>
          <Text style={styles.dataCell} numberOfLines={2}>{item[col] !== null && item[col] !== undefined ? String(item[col]) : ''}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={tableStyles.outerContainer}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={tableStyles.tableArea}>
        {/* vertical scroll OUTSIDE horizontal scroll — fixes vertical scrollability */}
        <ScrollView style={{flex: 1}} nestedScrollEnabled contentContainerStyle={{flexGrow: 1}}>
          <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="always">
            <FlatList
              data={paginatedSlice}
              ListHeaderComponent={renderHeaderRow}
              renderItem={renderDataRow}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={{paddingBottom: 4}}
              initialNumToRender={PAGE_SIZE}
              maxToRenderPerBatch={PAGE_SIZE}
              windowSize={5}
              removeClippedSubviews
              nestedScrollEnabled
              scrollEnabled={false}
            />
          </ScrollView>
        </ScrollView>
      </View>
      <PaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </View>
  );
};

const tableStyles = StyleSheet.create({
  outerContainer: {flex: 1, flexDirection: 'column'},
  tableArea:      {flex: 1, overflow: 'hidden'},
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ReportScreen = ({navigation}) => {
  const [location, setLocation] = useState(null);
  const [role,     setRole]     = useState(null);
  const [userId,   setUserId]   = useState(null);
  const [userName, setUserName] = useState(null);

  const [seSelectedOffice, setSeSelectedOffice] = useState(null);
  const [seLoading,        setSeLoading]        = useState(false);

  // Single-office report data
  const [reportBuildingData, setReportBuildingData] = useState([]);
  const [reportCRFData,      setReportCRFData]      = useState([]);
  const [reportAnnuityData,  setReportAnnuityData]  = useState([]);
  const [reportNabardData,   setReportNabardData]   = useState([]);
  const [reportRoadData,     setReportRoadData]     = useState([]);
  const [report2515Data,     setReport2515Data]     = useState([]);
  const [reportDepositData,  setReportDepositData]  = useState([]);
  const [reportDPDCData,     setReportDPDCData]     = useState([]);
  const [reportGatAData,     setReportGatAData]     = useState([]);
  const [reportGatDData,     setReportGatDData]     = useState([]);
  const [reportGatFBCData,   setReportGatFBCData]   = useState([]);
  const [reportMLAData,      setReportMLAData]      = useState([]);
  const [reportMPData,       setReportMPData]       = useState([]);
  const [reportNRBData,      setReportNRBData]      = useState([]);
  const [reportRBData,       setReportRBData]       = useState([]);

  // Circle Akola: data per sub-office per section
  const [subOfficeReportData, setSubOfficeReportData] = useState({});

  const [contactorBuildingData, setcontractBuildingData] = useState([]);
  const [contactorCrfdata,      setcontractCrfDaya]      = useState([]);
  const [contactorAnnuitydata,  setcontractAnnuitydata]  = useState([]);
  const [ContractorNabarddata,  setcontractorNabardData] = useState([]);
  const [Contractorroaddata,    setcontractorRoadData]   = useState([]);

  const [loading,         setLoading]         = useState(true);
  const [selectedSection, setSelectedSection] = useState('Building');
  const [sections,        setSections]        = useState([]);

  // Pagination
  const [singleOfficePage, setSingleOfficePage] = useState(1);
  const [circleAkolaPage,  setCircleAkolaPage]  = useState(1);

  useEffect(() => { setSingleOfficePage(1); setCircleAkolaPage(1); }, [selectedSection]);
  useEffect(() => { setSingleOfficePage(1); setCircleAkolaPage(1); }, [seSelectedOffice]);

  const sectionDataMap = {
    Building: reportBuildingData, CRF: reportCRFData, Annuity: reportAnnuityData,
    Nabard: reportNabardData, Road: reportRoadData, '2515': report2515Data,
    Deposit: reportDepositData, DPDC: reportDPDCData, 'NonPlan(3054)': reportGatAData,
    Gat_D: reportGatDData, Gat_BCF: reportGatFBCData, MLA: reportMLAData,
    MP: reportMPData, '2216': reportNRBData, '2059': reportRBData,
  };

  const contractorDataMap = {
    Building: contactorBuildingData, CRF: contactorCrfdata, Annuity: contactorAnnuitydata,
    Nabard: ContractorNabarddata, Road: Contractorroaddata,
  };

  const ALL_SECTIONS = [
    'Building', 'CRF', 'Annuity', 'Nabard', 'Road',
    'NonPlan(3054)', '2216', '2059', 'Deposit', 'DPDC',
    'Gat_BCF', 'Gat_D', 'MLA', 'MP', '2515',
  ];

  // ── API helpers ────────────────────────────────────────────────────────────
  const callAllAPIsForOffice = async (office, setters) => {
    const calls = [
      [MASTERHEADWISEREPOSTBuildingApi,    {office},                          setters.Building],
      [MASTERHEADWISEREPOSTCRFApi,         {office},                          setters.CRF],
      [MASTERHEADWISEREPOSTAnnuityApi,     {office},                          setters.Annuity],
      [MASTERHEADWISEREPOSTNabardApi,      {office},                          setters.Nabard],
      [MASTERHEADWISEREPOSTRoadApi,        {office},                          setters.Road],
      [MASTERHEADWISEREPOST2515Api,         {office, year: '2025-2026'},       setters['2515']],
      [MASTERHEADWISEREPOSTDepositeFundApi,{office},                          setters.Deposit],
      [MASTERHEADWISEREPOSTDPDCApi,        {office, year: '2025-2026'},       setters.DPDC],
      [MASTERHEADWISEREPOSTGatAApi,        {office, year: '2025-2026'},       setters['NonPlan(3054)']],
      [MASTERHEADWISEREPOSTGatDApi,        {office, year: '2025-2026'},       setters.Gat_D],
      [MASTERHEADWISEREPOSTGatFBCApi,      {office, year: '2025-2026'},       setters.Gat_BCF],
      [MASTERHEADWISEREPOSTMLAApi,         {office, year: '2025-2026'},       setters.MLA],
      [MASTERHEADWISEREPOSTMPApi,          {office, year: '2025-2026'},       setters.MP],
      [MASTERHEADWISEREPOSTNRBApi,         {office, year: '2025-2026'},       setters['2216']],
      [MASTERHEADWISEREPOSTRBApi,          {office, year: '2025-2026'},       setters['2059']],
    ];
    await Promise.all(calls.map(async ([api, payload, setter]) => {
      try { const r = await api(payload); if (r?.success && setter) setter(r.data); }
      catch (e) { console.error(e); }
    }));
  };

  const singleOfficeSetters = {
    Building: setReportBuildingData, CRF: setReportCRFData, Annuity: setReportAnnuityData,
    Nabard: setReportNabardData, Road: setReportRoadData, '2515': setReport2515Data,
    Deposit: setReportDepositData, DPDC: setReportDPDCData, 'NonPlan(3054)': setReportGatAData,
    Gat_D: setReportGatDData, Gat_BCF: setReportGatFBCData, MLA: setReportMLAData,
    MP: setReportMPData, '2216': setReportNRBData, '2059': setReportRBData,
  };

  const callAll15APIs = useCallback(office => callAllAPIsForOffice(office, singleOfficeSetters), []);

  const fetchAllSubOfficesReport = useCallback(async () => {
    const result = {};
    await Promise.all(
      CIRCLE_SUB_OFFICES.map(async ({value}) => {
        result[value] = {};
        const subSetters = {};
        ALL_SECTIONS.forEach(sec => { subSetters[sec] = data => { result[value][sec] = data; }; });
        await callAllAPIsForOffice(value, subSetters);
      }),
    );
    setSubOfficeReportData({...result});
  }, []);

  const resetReportData = () => {
    setReportBuildingData([]); setReportCRFData([]); setReportAnnuityData([]);
    setReportNabardData([]); setReportRoadData([]); setReport2515Data([]);
    setReportDepositData([]); setReportDPDCData([]); setReportGatAData([]);
    setReportGatDData([]); setReportGatFBCData([]); setReportMLAData([]);
    setReportMPData([]); setReportNRBData([]); setReportRBData([]);
    setSubOfficeReportData({});
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const storedUserId   = await AsyncStorage.getItem('USER_ID');
        const storedRole     = await AsyncStorage.getItem('userRole');
        const storedLocation = await AsyncStorage.getItem('LOCATION_ID');
        const storedUserName = await AsyncStorage.getItem('USER_NAME');
        if (storedUserId)   setUserId(storedUserId);
        if (storedRole)     setRole(storedRole);
        if (storedLocation) setLocation(storedLocation);
        if (storedUserName) setUserName(storedUserName);
      } catch (e) { console.error(e); }
    };
    fetchUserDetails();
  }, []);

  const ContractorReportBuilding = useCallback(async () => { try { const r = await ContractorBuildingReportApi({office: location, post: role, year: '2025-2026', name: userName}); if (r?.success) setcontractBuildingData(r.data); } catch (e) { console.error(e); } }, [location, role, userName]);
  const ContractorReportCRF      = useCallback(async () => { try { const r = await ContractorCRFReportApi({office: location, post: role, year: '2025-2026', name: userName});      if (r?.success) setcontractCrfDaya(r.data);      } catch (e) { console.error(e); } }, [location, role, userName]);
  const ContractorReportAnnuity  = useCallback(async () => { try { const r = await ContractorAunnityReportApi({office: location, post: role, year: '2025-2026', name: userName});  if (r?.success) setcontractAnnuitydata(r.data);  } catch (e) { console.error(e); } }, [location, role, userName]);
  const ContractorReportNabard   = useCallback(async () => { try { const r = await ContractorNabardReportApi({office: location, post: role, year: '2025-2026', name: userName});   if (r?.success) setcontractorNabardData(r.data); } catch (e) { console.error(e); } }, [location, role, userName]);
  const ContractorReportRoad     = useCallback(async () => { try { const r = await ContractorRoadReportApi({office: location, post: role, year: '2025-2026', name: userName});     if (r?.success) setcontractorRoadData(r.data);   } catch (e) { console.error(e); } }, [location, role, userName]);

  useEffect(() => {
    const fetchData = async () => {
      if (!role || !location) { setLoading(false); return; }
      setLoading(true);
      if (['Contractor', 'Sectional Engineer', 'Deputy Engineer'].includes(role)) {
        ContractorReportBuilding(); ContractorReportCRF(); ContractorReportAnnuity();
        ContractorReportNabard(); ContractorReportRoad();
        setSections(ALL_SECTIONS);
      } else if (role === 'Executive Engineer') {
        callAll15APIs(location);
        setSections(ALL_SECTIONS);
      } else if (role === 'Supreintending Engiener') {
        setSections(ALL_SECTIONS);
      }
      setLoading(false);
    };
    fetchData();
  }, [userId, role, location, userName]);

  const handleSeOfficeSelect = async officeValue => {
    setSeSelectedOffice(officeValue);
    setSeLoading(true);
    setSelectedSection('Building');
    resetReportData();
    if (officeValue === 'P_W_Circle_Akola') await fetchAllSubOfficesReport();
    else await callAll15APIs(officeValue);
    setSeLoading(false);
  };

  // ── Section tabs ──────────────────────────────────────────────────────────
  const renderSectionTabs = () => (
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.buttonContainer}>
          {sections.map(section => (
            <TouchableOpacity key={section} onPress={() => setSelectedSection(section)} style={[styles.sectionButton, selectedSection === section && styles.activeButton]}>
              <Text style={styles.buttonText}>{section}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // ── Circle Akola combined view ─────────────────────────────────────────────
  const renderCircleAkolaView = () => {
    const combinedRows = [];
    CIRCLE_SUB_OFFICES.forEach(({label, value, color}) => {
      (subOfficeReportData[value]?.[selectedSection] || []).forEach(row =>
        combinedRows.push({...row, _officeLabel: label, _officeColor: color, _officeValue: value}),
      );
    });

    if (combinedRows.length === 0) {
      return (
        <View style={tableStyles.outerContainer}>
          <Text style={styles.sectionTitle}>{selectedSection}</Text>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      );
    }

    const totalPages = Math.ceil(combinedRows.length / PAGE_SIZE);
    const start      = (circleAkolaPage - 1) * PAGE_SIZE;
    const slicedRows = combinedRows.slice(start, start + PAGE_SIZE);

    // Column structure — exclude private _office* keys
    const sampleRow = combinedRows[0];
    const columns   = Object.keys(sampleRow).filter(k => !k.startsWith('_'));
    const colWidths = columns.reduce((acc, col) => { acc[col] = calcColWidth(col, combinedRows); return acc; }, {});

    // Inject sub-office banners when office changes within the sliced window
    const displaySections = [];
    let lastOffice = null;
    slicedRows.forEach((row, idx) => {
      if (row._officeValue !== lastOffice) {
        displaySections.push({type: 'officeHeader', label: row._officeLabel, color: row._officeColor});
        lastOffice = row._officeValue;
      }
      displaySections.push({type: 'row', data: row, absoluteIndex: start + idx});
    });

    const renderColumnHeader = () => (
      <View style={[styles.tableRow, {backgroundColor: '#f2f2f2'}]}>
        {columns.map(col => (
          <View key={col} style={[styles.cell, {width: colWidths[col]}]}>
            <Text style={styles.headerCell}>{col}</Text>
          </View>
        ))}
      </View>
    );

    const renderDataRow = rowData => (
      <View style={styles.tableRow}>
        {columns.map(col => (
          <View key={col} style={[styles.cell, {width: colWidths[col]}]}>
            <Text style={styles.dataCell} numberOfLines={2}>{rowData[col] !== null && rowData[col] !== undefined ? String(rowData[col]) : ''}</Text>
          </View>
        ))}
      </View>
    );

    return (
      <View style={tableStyles.outerContainer}>
        <Text style={styles.sectionTitle}>{selectedSection}</Text>
        <View style={tableStyles.tableArea}>
          {/* vertical scroll OUTSIDE horizontal scroll */}
          <ScrollView style={{flex: 1}} nestedScrollEnabled contentContainerStyle={{flexGrow: 1}}>
            <ScrollView horizontal showsHorizontalScrollIndicator keyboardShouldPersistTaps="always">
              <View>
                {renderColumnHeader()}
                {displaySections.map((section, idx) => {
                  if (section.type === 'officeHeader') {
                    return (
                      <View key={`oh-${idx}`} style={[circleStyles.subOfficeHeader, {backgroundColor: section.color}]}>
                        <Text style={circleStyles.subOfficeHeaderText}>{section.label}</Text>
                      </View>
                    );
                  }
                  return (
                    <View key={`row-${section.absoluteIndex}`}>
                      {renderDataRow(section.data)}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
        <PaginationBar page={circleAkolaPage} totalPages={totalPages} onPageChange={p => setCircleAkolaPage(p)} />
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Icon name="arrow-back" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Report</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{marginTop: 40}} />
      ) : (
        <>
          {/* ══ SUPERINTENDING ENGINEER ══════════════════════════════════ */}
          {role === 'Supreintending Engiener' && (
            <>
              {!seSelectedOffice ? (
                <ScrollView style={{backgroundColor: '#f5f5f5', flex: 1}}>
                  <OfficeSelectorGrid onSelect={handleSeOfficeSelect} />
                  <View style={styles.sePrompt}>
                    <Icon name="touch-app" size={44} color="#bbb" />
                    <Text style={styles.sePromptText}>विभाग निवडा</Text>
                    <Text style={styles.sePromptSub}>वरील विभागावर क्लिक करा म्हणजे अहवाल दिसेल</Text>
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.roleContainer}>
                  <View style={styles.seBackBar}>
                    <TouchableOpacity onPress={() => { setSeSelectedOffice(null); setSelectedSection('Building'); resetReportData(); }} style={styles.seBackBtn}>
                      <Icon name="arrow-back-ios" size={18} color="#007bff" />
                      <Text style={styles.seBackBtnText}>विभाग बदला</Text>
                    </TouchableOpacity>
                    <Text style={styles.seOfficeName} numberOfLines={1}>{SE_OFFICES.find(o => o.value === seSelectedOffice)?.label}</Text>
                  </View>
                  {seLoading ? (
                    <View style={styles.seLoadingContainer}><ActivityIndicator size="large" color="#007bff" /><Text style={styles.seLoadingText}>डेटा लोड होत आहे...</Text></View>
                  ) : (
                    <>
                      {renderSectionTabs()}
                      <View style={styles.tableWrapper}>
                        {seSelectedOffice === 'P_W_Circle_Akola'
                          ? renderCircleAkolaView()
                          : <DynamicTable data={sectionDataMap[selectedSection] || []} label={selectedSection} page={singleOfficePage} onPageChange={p => setSingleOfficePage(p)} />
                        }
                      </View>
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {/* ══ EXECUTIVE ENGINEER ═══════════════════════════════════════ */}
          {role === 'Executive Engineer' && (
            <View style={styles.roleContainer}>
              {renderSectionTabs()}
              <View style={styles.tableWrapper}>
                <DynamicTable data={sectionDataMap[selectedSection] || []} label={selectedSection} page={singleOfficePage} onPageChange={p => setSingleOfficePage(p)} />
              </View>
            </View>
          )}

          {/* ══ CONTRACTOR / SECTIONAL / DEPUTY ═══════════════════════════ */}
          {['Contractor', 'Sectional Engineer', 'Deputy Engineer'].includes(role) && (
            <View style={styles.roleContainer}>
              {renderSectionTabs()}
              <View style={styles.tableWrapper}>
                <DynamicTable data={contractorDataMap[selectedSection] || []} label={selectedSection} page={singleOfficePage} onPageChange={p => setSingleOfficePage(p)} />
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const circleStyles = StyleSheet.create({
  subOfficeHeader:     {paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center'},
  subOfficeHeaderText: {color: '#fff', fontWeight: 'bold', fontSize: 14},
});

const styles = StyleSheet.create({
  safeArea:           {flex: 1, backgroundColor: 'black'},
  header:             {flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, backgroundColor: 'black'},
  backButton:         {padding: 5},
  headerTitle:        {fontSize: 20, fontWeight: 'bold', color: 'white', marginLeft: 15},
  tabBar:             {paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'},
  buttonContainer:    {flexDirection: 'row', paddingHorizontal: 10},
  sectionButton:      {paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'black', borderRadius: 8, marginHorizontal: 5},
  activeButton:       {backgroundColor: '#007bff'},
  buttonText:         {color: '#fff', fontWeight: 'bold'},
  noDataText:         {fontSize: 15, color: '#999', textAlign: 'center', marginTop: 60},
  sectionTitle:       {fontSize: 16, fontWeight: 'bold', color: 'black', backgroundColor: '#e0e0e0', padding: 8, borderRadius: 4, marginBottom: 4},
  tableRow:           {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', alignItems: 'stretch'},
  cell:               {borderRightWidth: 1, borderColor: '#eee', paddingHorizontal: 8, paddingVertical: 6, justifyContent: 'center', alignSelf: 'stretch', backgroundColor: '#fff'},
  headerCell:         {fontSize: 12, fontWeight: 'bold', color: '#333'},
  dataCell:           {fontSize: 12, color: '#444'},
  seLoadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: 'white'},
  seLoadingText:      {marginTop: 12, fontSize: 14, color: '#555'},
  sePrompt:           {alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 30},
  sePromptText:       {fontSize: 16, fontWeight: 'bold', color: '#555', marginTop: 10},
  sePromptSub:        {fontSize: 12, color: '#999', marginTop: 4, textAlign: 'center', paddingHorizontal: 30},
  seBackBar:          {flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4ff', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#d0d9f0'},
  seBackBtn:          {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#007bff', marginRight: 12},
  seBackBtnText:      {color: '#007bff', fontWeight: 'bold', fontSize: 13, marginLeft: 2},
  seOfficeName:       {flex: 1, fontSize: 13, fontWeight: '600', color: '#333'},
  roleContainer:      {flex: 1, flexDirection: 'column', backgroundColor: 'white'},
  tableWrapper:       {flex: 1},
});

export default ReportScreen;