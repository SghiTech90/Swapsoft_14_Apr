import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');
const CARD_MARGIN = 10;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - 30 * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const BoxSociogram = ({onFocusChange}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const data = [
    {
      label: 'सा. बां.  विभाग, अकोला',
      value: 'P_W_Division_Akola',
      color: '#A066FF',
    },
    {
      label: 'सा. बां. विभाग, अकोट',
      value: 'P_W_Division_WBAkola',
      color: '#2EC4B6',
    },
    {
      label: 'सा. बां. विभाग, वाशिम',
      value: 'P_W_Division_Washim',
      color: '#FF6B6B',
    },
    {
      label: 'सा. बां. विभाग, बुलढाणा',
      value: 'P_W_Division_Buldhana',
      color: '#FFD93D',
    },
    {
      label: 'सा. बां.  विभाग, खामगांव',
      value: 'P_W_Division_Khamgaon',
      color: '#00A8E8',
    },
    {
      label: 'सा. बां. मंडळ, अकोला',
      value: 'P_W_Circle_Akola',
      color: '#FF9F1C',
    },
  ];

  useEffect(() => {
    if (onFocusChange && data[selectedIndex]) {
      onFocusChange(data[selectedIndex].value);
    }
  }, [selectedIndex]);

  const handlePress = index => {
    setSelectedIndex(index);
  };

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>सार्वजनिक बांधकाम मंडळ अकोला</Text>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={item.value}
              activeOpacity={0.8}
              onPress={() => handlePress(index)}
              style={[
                styles.card,
                {backgroundColor: item.color},
                isSelected && styles.cardSelected,
              ]}>
              {isSelected && <View style={styles.selectedIndicator} />}
              <Text style={styles.cardText} numberOfLines={3}>
                {item.label}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  headerText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: 80,
    borderRadius: 10,
    padding: 12,
    marginBottom: CARD_MARGIN,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 5,
    borderColor: '#fff',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 16,
    transform: [{scale: 1.15}],
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default BoxSociogram;