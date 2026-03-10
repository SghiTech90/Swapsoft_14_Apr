import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  ContractorAunnityReportApi,
  ContractorBuildingReportApi,
  ContractorCRFReportApi,
  ContractorNabardReportApi,
  ContractorRoadReportApi,
  MASTERHEADWISEREPOST2515Api,
  MASTERHEADWISEREPOSTAnnuityApi,
  MASTERHEADWISEREPOSTBuildingApi,
  MASTERHEADWISEREPOSTCRFApi,
  MASTERHEADWISEREPOSTDPDCApi,
  MASTERHEADWISEREPOSTDepositeFundApi,
  MASTERHEADWISEREPOSTGatAApi,
  MASTERHEADWISEREPOSTGatDApi,
  MASTERHEADWISEREPOSTGatFBCApi,
  MASTERHEADWISEREPOSTMLAApi,
  MASTERHEADWISEREPOSTMPApi,
  MASTERHEADWISEREPOSTNabardApi,
  MASTERHEADWISEREPOSTNRBApi,
  MASTERHEADWISEREPOSTRBApi,
  MASTERHEADWISEREPOSTRoadApi,
} from '../Api/ReportApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenHeight = Dimensions.get('window').height;
const {width} = Dimensions.get('window');

// ─── SE Office grid ───────────────────────────────────────────────────────────
const SE_OFFICES = [
  {label: 'सा. बां. विभाग, अकोला',  value: 'P_W_Division_Akola',    color: '#A066FF'},
  {label: 'सा. बां. विभाग, अकोट',   value: 'P_W_Division_WBAkola',  color: '#2EC4B6'},
  {label: 'सा. बां. विभाग, वाशिम',   value: 'P_W_Division_Washim',   color: '#FF6B6B'},
  {label: 'सा. बां. विभाग, बुलढाणा', value: 'P_W_Division_Buldhana', color: '#FFD93D'},
  {label: 'सा. बां. विभाग, खामगांव', value: 'P_W_Division_Khamgaon', color: '#00A8E8'},
  {label: 'सा. बां. मं, अकोला',      value: 'P_W_Circle_Akola',      color: '#FF9F1C'},
];

const CARD_MARGIN = 10;
const CARD_WIDTH  = (width - CARD_MARGIN * 3) / 2;

const OfficeSelectorGrid = ({onSelect}) => (
  <View style={gridStyles.wrapper}>
    <View style={gridStyles.header}>
      <Text style={gridStyles.headerText}>सार्वजनिक बांधकाम मंडळ अकोला</Text>
      <Text style={gridStyles.subText}>विभाग निवडा</Text>
    </View>
    <View style={gridStyles.grid}>
      {SE_OFFICES.map(office => (
        <TouchableOpacity
          key={office.value}
          activeOpacity={0.75}
          onPress={() => onSelect(office.value)}
          style={[gridStyles.card, {backgroundColor: office.color}]}>
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ReportScreen = ({navigation, route}) => {
  const [location, setLocation] = useState(null);
  const [role, setRole]         = useState(null);
  const [userId, setUserId]     = useState(null);
  const [userName, setUserName] = useState(null);

  // SE: which office card was tapped (null = show grid)
  const [seSelectedOffice, setSeSelectedOffice] = useState(null);
  const [seLoading, setSeLoading]               = useState(false);

  const [reportBuildingData, setReportBuildingData] = useState([]);
  const [reportCRFData, setReportCRFData]           = useState([]);
  const [reportAnnuityData, setReportAnnuityData]   = useState([]);
  const [reportNabardData, setReportNabardData]     = useState([]);
  const [reportRoadData, setReportRoadData]         = useState([]);
  const [report2515Data, setReport2515Data]         = useState([]);
  const [reportDepositData, setReportDepositData]   = useState([]);
  const [reportDPDCData, setReportDPDCData]         = useState([]);
  const [reportGatAData, setReportGatAData]         = useState([]);
  const [reportGatDData, setReportGatDData]         = useState([]);
  const [reportGatFBCData, setReportGatFBCData]     = useState([]);
  const [reportMLAData, setReportMLAData]           = useState([]);
  const [reportMPData, setReportMPData]             = useState([]);
  const [reportNRBData, setReportNRBData]           = useState([]);
  const [reportRBData, setReportRBData]             = useState([]);

  const [contactorBuildingData, setcontractBuildingData] = useState([]);
  const [contactorCrfdata, setcontractCrfDaya]           = useState([]);
  const [contactorAnnuitydata, setcontractAnnuitydata]   = useState([]);
  const [ContractorNabarddata, setcontractorNabardData]  = useState([]);
  const [Contractorroaddata, setcontractorRoadData]      = useState([]);

  const [loading, setLoading]                 = useState(true);
  const [selectedSection, setSelectedSection] = useState('Building');
  const [sections, setSections]               = useState([]);
  const [page, setPage]                       = useState(1);
  const [paginatedData, setPaginatedData]     = useState([]);
  const [pageGroup, setPageGroup]             = useState(0);

  const sectionDataMap = {
    Building:        reportBuildingData,
    CRF:             reportCRFData,
    Annuity:         reportAnnuityData,
    Nabard:          reportNabardData,
    Road:            reportRoadData,
    '2515':          report2515Data,
    Deposit:         reportDepositData,
    DPDC:            reportDPDCData,
    'NonPlan(3054)': reportGatAData,
    Gat_D:           reportGatDData,
    Gat_BCF:         reportGatFBCData,
    MLA:             reportMLAData,
    MP:              reportMPData,
    '2216':          reportNRBData,
    '2059':          reportRBData,
  };

  const pageSize      = 10;
  const pagesPerGroup = 10;
  const currentSectionData = sectionDataMap[selectedSection] || [];
  const totalPages = Math.ceil(currentSectionData.length / pageSize);

  useEffect(() => {
    const start = (page - 1) * pageSize;
    setPaginatedData(currentSectionData.slice(start, start + pageSize));
  }, [page, selectedSection, currentSectionData]);

  // ── Load user ──────────────────────────────────────────────────────────────
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
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
    fetchUserDetails();
  }, []);

  const ALL_SECTIONS = [
    'Building', 'CRF', 'Annuity', 'Nabard', 'Road',
    'NonPlan(3054)', '2216', '2059', 'Deposit', 'DPDC',
    'Gat_BCF', 'Gat_D', 'MLA', 'MP', '2515',
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!role || !location) { setLoading(false); return; }
      setLoading(true);

      if (['Contractor', 'Sectional Engineer', 'Deputy Engineer'].includes(role)) {
        ContractorReportBuilding();
        ContractorReportCRF();
        ContractorReportAnnuity();
        ContractorReportNabard();
        ContractorReportRoad();
        setSections(ALL_SECTIONS);
      } else if (role === 'Executive Engineer') {
        callAll15APIs(location);
        setSections(ALL_SECTIONS);
      } else if (role === 'Supreintending Engiener') {
        // SE: just set sections; data fetched after office tap
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
    setPage(1);
    setPageGroup(0);
    resetReportData();
    await callAll15APIs(officeValue);
    setSeLoading(false);
  };

  const callAll15APIs = office => {
    MASTERHEADWISEREPOSTBuilding(office);
    MASTERHEADWISEREPOSTCRF(office);
    MASTERHEADWISEREPOSTAnnuity(office);
    MASTERHEADWISEREPOSTNabard(office);
    MASTERHEADWISEREPOSTRoad(office);
    MASTERHEADWISEREPOST2515(office);
    MASTERHEADWISEREPOSTDepositeFund(office);
    MASTERHEADWISEREPOSTDPDC(office);
    MASTERHEADWISEREPOSTGatA(office);
    MASTERHEADWISEREPOSTGatD(office);
    MASTERHEADWISEREPOSTGatFBC(office);
    MASTERHEADWISEREPOSTMLA(office);
    MASTERHEADWISEREPOSTMP(office);
    MASTERHEADWISEREPOSTNRB(office);
    MASTERHEADWISEREPOSTRB(office);
  };

  const resetReportData = () => {
    setReportBuildingData([]);
    setReportCRFData([]);
    setReportAnnuityData([]);
    setReportNabardData([]);
    setReportRoadData([]);
    setReport2515Data([]);
    setReportDepositData([]);
    setReportDPDCData([]);
    setReportGatAData([]);
    setReportGatDData([]);
    setReportGatFBCData([]);
    setReportMLAData([]);
    setReportMPData([]);
    setReportNRBData([]);
    setReportRBData([]);
  };

  const handleSectionChange = section => {
    setSelectedSection(section);
    setPage(1);
    setPageGroup(0);
  };

  const MASTERHEADWISEREPOSTBuilding = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTBuildingApi({office});
      if (r?.success) setReportBuildingData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTCRF = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTCRFApi({office});
      if (r?.success) setReportCRFData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTAnnuity = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTAnnuityApi({office});
      if (r?.success) setReportAnnuityData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTNabard = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTNabardApi({office});
      if (r?.success) setReportNabardData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTRoad = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTRoadApi({office});
      if (r?.success) setReportRoadData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOST2515 = async office => {
    try {
      const r = await MASTERHEADWISEREPOST2515Api({office, year: '2025-2026'});
      if (r?.success) setReport2515Data(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTDepositeFund = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTDepositeFundApi({office});
      if (r?.success) setReportDepositData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTDPDC = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTDPDCApi({office, year: '2025-2026'});
      if (r?.success) setReportDPDCData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTGatA = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTGatAApi({office, year: '2025-2026'});
      if (r?.success) setReportGatAData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTGatD = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTGatDApi({office, year: '2025-2026'});
      if (r?.success) setReportGatDData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTGatFBC = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTGatFBCApi({office, year: '2025-2026'});
      if (r?.success) setReportGatFBCData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTMLA = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTMLAApi({office, year: '2025-2026'});
      if (r?.success) setReportMLAData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTMP = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTMPApi({office, year: '2025-2026'});
      if (r?.success) setReportMPData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTNRB = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTNRBApi({office, year: '2025-2026'});
      if (r?.success) setReportNRBData(r.data);
    } catch (e) { console.error(e); }
  };
  const MASTERHEADWISEREPOSTRB = async office => {
    try {
      const r = await MASTERHEADWISEREPOSTRBApi({office, year: '2025-2026'});
      if (r?.success) setReportRBData(r.data);
    } catch (e) { console.error(e); }
  };

  // ── Contractor helpers ────────────────────────────────────────────────────
  const ContractorReportBuilding = async () => {
    try {
      const r = await ContractorBuildingReportApi({office: location, post: role, year: '2025-2026', name: userName});
      if (r?.success) setcontractBuildingData(r.data);
    } catch (e) { console.error(e); }
  };
  const ContractorReportCRF = async () => {
    try {
      const r = await ContractorCRFReportApi({office: location, post: role, year: '2025-2026', name: userName});
      if (r?.success) setcontractCrfDaya(r.data);
    } catch (e) { console.error(e); }
  };
  const ContractorReportAnnuity = async () => {
    try {
      const r = await ContractorAunnityReportApi({office: location, post: role, year: '2025-2026', name: userName});
      if (r?.success) setcontractAnnuitydata(r.data);
    } catch (e) { console.error(e); }
  };
  const ContractorReportNabard = async () => {
    try {
      const r = await ContractorNabardReportApi({office: location, post: role, year: '2025-2026', name: userName});
      if (r?.success) setcontractorNabardData(r.data);
    } catch (e) { console.error(e); }
  };
  const ContractorReportRoad = async () => {
    try {
      const r = await ContractorRoadReportApi({office: location, post: role, year: '2025-2026', name: userName});
      if (r?.success) setcontractorRoadData(r.data);
    } catch (e) { console.error(e); }
  };

  // ── Pagination ─────────────────────────────────────────────────────────────
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const startPage   = pageGroup * pagesPerGroup + 1;
    const endPage     = Math.min(startPage + pagesPerGroup - 1, totalPages);
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    return (
      <View style={{flexDirection: 'row', justifyContent: 'center', marginVertical: 10}}>
        {pageGroup > 0 && (
          <TouchableOpacity onPress={() => setPageGroup(p => p - 1)}>
            <Text style={{marginHorizontal: 10}}>{'<< Prev'}</Text>
          </TouchableOpacity>
        )}
        {pageNumbers.map(num => (
          <TouchableOpacity key={num} onPress={() => setPage(num)}>
            <Text style={{
              marginHorizontal: 5,
              fontWeight: page === num ? 'bold' : 'normal',
              color: page === num ? 'blue' : 'black',
            }}>{num}</Text>
          </TouchableOpacity>
        ))}
        {endPage < totalPages && (
          <TouchableOpacity onPress={() => setPageGroup(p => p + 1)}>
            <Text style={{marginHorizontal: 10}}>{'Next >>'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Table renderers ────────────────────────────────────────────────────────
  // ── Dynamic table: auto-generates columns from API data keys ─────────────
  // ── Column width: measures header text + samples up to 10 data rows ─────────
  const calcColWidth = (colName, data) => {
    // Estimate rendered px width of a string at fontSize 12
    // Marathi/Unicode chars are wider (~9px), ASCII chars (~7px)
    const strWidth = str => {
      if (!str) return 0;
      let w = 0;
      for (const ch of str) {
        w += ch.charCodeAt(0) > 127 ? 9 : 7;
      }
      return w;
    };

    // Measure header key
    let max = strWidth(colName) + 16; // +16 for horizontal padding

    // Sample up to 10 rows of data
    const sample = data.slice(0, 10);
    for (const row of sample) {
      const val = row[colName];
      const valStr = (val !== null && val !== undefined) ? String(val) : '';
      const w = strWidth(valStr) + 16;
      if (w > max) max = w;
    }

    // Clamp: min 60, max 300 (very long text like work names get capped + wrap)
    return Math.min(Math.max(Math.ceil(max), 60), 300);
  };

  const DynamicTable = ({data, label}) => {
    if (!data || data.length === 0) {
      return (
        <>
          <Text style={styles.sectionTitle}>{label}</Text>
          <Text style={styles.noDataText}>No data available</Text>
        </>
      );
    }

    // Derive columns and compute widths once from API data
    const columns = Object.keys(data[0]);
    const colWidths = columns.reduce((acc, col) => {
      acc[col] = calcColWidth(col, data);
      return acc;
    }, {});

    const renderHeader = () => (
      <View style={[styles.tableRow, {backgroundColor: '#f2f2f2'}]}>
        {columns.map(col => (
          <View key={col} style={[styles.cell, {width: colWidths[col]}]}>
            <Text style={styles.headerCell}>{col}</Text>
          </View>
        ))}
      </View>
    );

    const renderItem = ({item}) => (
      <View style={styles.tableRow}>
        {columns.map(col => (
          <View key={col} style={[styles.cell, {width: colWidths[col]}]}>
            <Text style={styles.dataCell} numberOfLines={2}>
              {item[col] !== null && item[col] !== undefined ? String(item[col]) : ''}
            </Text>
          </View>
        ))}
      </View>
    );

    return (
      <>
        <Text style={styles.sectionTitle}>{label}</Text>
        <ScrollView horizontal>
          <View style={{height: screenHeight * 0.6}}>
            {renderHeader()}
            <FlatList
              data={data}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              ListFooterComponent={renderPagination()}
              contentContainerStyle={{paddingBottom: 80}}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
            />
          </View>
        </ScrollView>
      </>
    );
  };


  // ── Section tab bar ────────────────────────────────────────────────────────
  const renderSectionTabs = () => (
    <View style={{paddingVertical: 10}}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.buttonContainer}>
          {sections.map(section => (
            <TouchableOpacity
              key={section}
              onPress={() => handleSectionChange(section)}
              style={[styles.sectionButton, selectedSection === section && styles.activeButton]}>
              <Text style={styles.buttonText}>{section}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // ── EE + SE table content ─────────────────────────────────────────────────
  const renderMasterContent = () => (
    <ScrollView style={styles.contentContainer}>
      <DynamicTable data={paginatedData} label={selectedSection} />
    </ScrollView>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{marginTop: 40}} />
      ) : (
        <>
          {/* ══ SUPERINTENDING ENGINEER ══════════════════════════════════ */}
          {role === 'Supreintending Engiener' && (
            <>
              {!seSelectedOffice && (
                <ScrollView style={{backgroundColor: '#f5f5f5', flex: 1}}>
                  <OfficeSelectorGrid onSelect={handleSeOfficeSelect} />
                  <View style={styles.sePrompt}>
                    <Icon name="touch-app" size={44} color="#bbb" />
                    <Text style={styles.sePromptText}>विभाग निवडा</Text>
                    <Text style={styles.sePromptSub}>वरील विभागावर क्लिक करा म्हणजे अहवाल दिसेल</Text>
                  </View>
                </ScrollView>
              )}

              {seSelectedOffice && (
                <View style={{flex: 1, backgroundColor: 'white'}}>
                  <View style={styles.seBackBar}>
                    <TouchableOpacity
                      onPress={() => {
                        setSeSelectedOffice(null);
                        setSelectedSection('Building');
                        resetReportData();
                      }}
                      style={styles.seBackBtn}>
                      <Icon name="arrow-back-ios" size={18} color="#007bff" />
                      <Text style={styles.seBackBtnText}>विभाग बदला</Text>
                    </TouchableOpacity>
                    <Text style={styles.seOfficeName} numberOfLines={1}>
                      {SE_OFFICES.find(o => o.value === seSelectedOffice)?.label}
                    </Text>
                  </View>

                  {seLoading ? (
                    <View style={styles.seLoadingContainer}>
                      <ActivityIndicator size="large" color="#007bff" />
                      <Text style={styles.seLoadingText}>डेटा लोड होत आहे...</Text>
                    </View>
                  ) : (
                    <>
                      {renderSectionTabs()}
                      {renderMasterContent()}
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {/* ══ EXECUTIVE ENGINEER ═══════════════════════════════════════ */}
          {role === 'Executive Engineer' && (
            <>
              {renderSectionTabs()}
              {renderMasterContent()}
            </>
          )}

          {/* ══ CONTRACTOR / SECTIONAL ENGINEER / DEPUTY ENGINEER ════════ */}
          {['Contractor', 'Sectional Engineer', 'Deputy Engineer'].includes(role) && (
            <>
              {renderSectionTabs()}
              <ScrollView style={styles.contentContainer}>
                {selectedSection === 'Building' && <DynamicTable data={contactorBuildingData} label="Building" />}
                {selectedSection === 'CRF'      && <DynamicTable data={contactorCrfdata}      label="CRF" />}
                {selectedSection === 'Annuity'  && <DynamicTable data={contactorAnnuitydata}  label="Annuity" />}
                {selectedSection === 'Nabard'   && <DynamicTable data={ContractorNabarddata}  label="Nabard" />}
                {selectedSection === 'Road'     && <DynamicTable data={Contractorroaddata}    label="Road" />}
              </ScrollView>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea:           {flex: 1, backgroundColor: 'black'},
  header:             {flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, backgroundColor: 'black'},
  backButton:         {padding: 5},
  headerTitle:        {fontSize: 20, fontWeight: 'bold', color: 'white', marginLeft: 15},
  contentContainer:   {backgroundColor: 'white', flexGrow: 1, paddingBottom: 80},
  noDataText:         {fontSize: 16, color: 'black', top: 100, left: 170},
  sectionTitle:       {fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: 'black', backgroundColor: '#e0e0e0', padding: 8, borderRadius: 4},
  tableRow:           {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', alignItems: 'stretch'},
  cell:               {borderRightWidth: 1, borderColor: '#eee', paddingHorizontal: 8, paddingVertical: 6, justifyContent: 'center', alignSelf: 'stretch', backgroundColor: '#fff'},
  headerCell:         {fontSize: 12, fontWeight: 'bold', color: '#333'},
  dataCell:           {fontSize: 12, color: '#444'},
  buttonContainer:    {flexDirection: 'row', paddingHorizontal: 10},
  sectionButton:      {paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'black', borderRadius: 8, marginHorizontal: 5},
  activeButton:       {backgroundColor: '#007bff'},
  buttonText:         {color: '#fff', fontWeight: 'bold'},
  seLoadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: 'white'},
  seLoadingText:      {marginTop: 12, fontSize: 14, color: '#555'},
  sePrompt:           {alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 30},
  sePromptText:       {fontSize: 16, fontWeight: 'bold', color: '#555', marginTop: 10},
  sePromptSub:        {fontSize: 12, color: '#999', marginTop: 4, textAlign: 'center', paddingHorizontal: 30},
  seBackBar:          {flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f4ff', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#d0d9f0'},
  seBackBtn:          {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#007bff', marginRight: 12},
  seBackBtnText:      {color: '#007bff', fontWeight: 'bold', fontSize: 13, marginLeft: 2},
  seOfficeName:       {flex: 1, fontSize: 13, fontWeight: '600', color: '#333'},
});

export default ReportScreen;