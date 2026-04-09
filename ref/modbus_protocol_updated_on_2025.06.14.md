# Lux Power Tek Modbus RTU Protocol (Full)
**Document Version:** V16 (2025/01/09)
**Applies to:** Hybrid / Energy Storage Inverters
**Interface:** RS-485, 19200bps, 8N1

---

## 1. Change Log (Summary of Key Protocol Changes)

| Ver | Date | Key Changes |
| :--- | :--- | :--- |
| V00-V03 | 2024.02-05 | First version; Added DryContactorMultiplex, AC couple power S/T phase. |
| V04 | 2024.06.05 | Added WattNode meter CT ratio/direction (Hold 248-251); NEC120% Rule (Hold 252). |
| V05 | 2024.06.28 | Added Hold 110 CTSampleRatio, PVCTSampleRatio. |
| V06 | 2024.07.05 | Added Hold 233 Bit10: EN50549 F-stop logic. |
| V07 | 2024.08.26 | Added Hold 253 (DeltaSOC), 254 (DeltaVolt). |
| V08 | 2024.09.11 | Added Hold 120 Bit8 (SeparateZeroExportEn); Added Rules 24, 25. |
| V09 | 2024.10.16 | Added Hold 255 Bit3-7 (Read WattNode frequency). |
| V10-V11| 2024.11.16 | Added LCD Machine Model Code (Hold 224). |
| V12 | 2024.12.13 | Added Input 214-216 (Temps), 217-231 (PV4-PV6 data). |
| V13 | 2024.12.16 | Added Hold 120 Bit 1-3 (12K AC charge logic); Hold 256-259 (Gen Timer). |
| V14 | 2024.12.17 | Added Input 232 (Smart load power), 210 (1-click charge remaining). |
| V15 | 2025.01.06 | 12K: Merged CTSampleRatio bits in Hold 110 to 4-bit. |
| V16 | 2025.01.09 | Input 77: Added Bit 3 & 4 (SmartLoad logic), Bit 5-7 (EPS/Grid load flags). |
| V17-V23| 2025.02-06 | Added Hold 260 (Bus OVP); Input 176-178 (Exception History); Hold 261 (Recovery discharge); Hold 251 Bit0-2 (Ext CT direction); US/EU/Brazil grid codes. |

---

## 2. Register Mapping Table

### 2.1 Input Registers (Read Only: 0x04)

| Addr | Item | Unit | Range | Note / Bit Definitions |
|:---|:---|:---|:---|:---|
| 0 | State | | 0-65535 | See "Operational Mode" in Appendix |
| 1 | Vpv1 | 0.1V | 0-65535 | PV1 voltage |
| 2 | Vpv2 | 0.1V | 0-65535 | PV2 voltage |
| 3 | Vpv3 | 0.1V | 0-65536 | PV3 voltage |
| 4 | Vbat | 0.1V | 0-65535 | Battery voltage |
| 5 | SOC / SOH | % | 0-100 | Battery capacity / State of Health |
| 6 | Internal Fault | | 0-65535 | See "Fault Code" file |
| 7 | Ppv1 | W | 0-65535 | PV1 power |
| 8 | Ppv2 | W | 0-65535 | PV2 power |
| 9 | Ppv3 | W | 0-65536 | Total PV power (PV1+PV2+PV3) |
| 10 | Pcharge | W | 0-65535 | Power flowing into battery |
| 11 | Pdischarge | W | 0-65535 | Power flowing out of battery |
| 12 | VacR | 0.1V | 0-65535 | R-phase utility grid voltage |
| 13 | VacS | 0.1V | 0-65535 | S-phase utility grid voltage |
| 14 | VacT | 0.1V | 0-65535 | T-phase utility grid voltage |
| 15 | Fac | 0.01Hz| 0-65535 | Utility grid frequency |
| 16 | Pinv | W | 0-65535 | On-grid inverter power (R phase) |
| 17 | Prec | W | 0-65535 | AC charging rectification power (R phase) |
| 18 | IinvRMS | 0.01A | 0-65535 | Inverter RMS current output (R phase) |
| 19 | PF | 0.001 | 0-2000 | Power factor. Range (0,1000] -> x/1000; (1000,2000) -> (1000-x)/1000 |
| 20 | VepsR | 0.1V | 0-65535 | R phase off-grid output voltage |
| 21 | VepsS | 0.1V | 0-65535 | S phase off-grid output voltage |
| 22 | VepsT | 0.1V | 0-65535 | T phase off-grid output voltage |
| 23 | Feps | 0.01Hz| 0-65535 | Off-grid output frequency |
| 24 | Peps | W | 0-65535 | Off-grid inverter power (R phase) |
| 25 | Seps | VA | 0-65535 | Off-grid apparent power (R phase) |
| 26 | Ptogrid | W | 0-65535 | User on-grid power (R phase) |
| 27 | Ptouser | W | 0-65535 | Grid power capacity (R phase) |
| 28 | Epv1_day | 0.1kWh| 0-65535 | PV1 power generation today |
| 29 | Epv2_day | 0.1kWh| 0-65535 | PV2 power generation today |
| 30 | Epv3_day | 0.1kWh| 0-65535 | Total PV generation today (PV1+2+3) |
| 31 | Einv_day | 0.1kWh| 0-65535 | Today's on-grid inverter output energy |
| 32 | Erec_day | 0.1kWh| 0-65535 | Today's AC charging rectifier energy |
| 33 | Echg_day | 0.1kWh| 0-65535 | Energy Charge today |
| 34 | Edischg_day | 0.1kWh| 0-65535 | Energy Discharge today |
| 35 | Eeps_day | 0.1kWh| 0-65535 | Today's off-grid output energy |
| 36 | Etogrid_day | 0.1kWh| 0-65535 | Today's export to grid energy |
| 37 | Etouser_day | 0.1kWh| 0-65535 | Electricity supplied to user from grid today |
| 38 | Vbus1 | 0.1V | 0-65535 | Voltage of Bus 1 |
| 39 | Vbus2 | 0.1V | 0-65535 | Voltage of Bus 2 |
| 40 | Epv1_all L | 0.1kWh| | PV1 cumulative power (Low byte) |
| 41 | Epv1_all H | 0.1kWh| | PV1 cumulative power (High byte) |
| 42 | Epv2_all L | 0.1kWh| | PV2 cumulative power (Low byte) |
| 43 | Epv2_all H | 0.1kWh| | PV2 cumulative power (High byte) |
| 44 | Epv3_all L | 0.1kWh| | Total PV cumulative power (Low byte) |
| 45 | Epv3_all H | 0.1kWh| | Total PV cumulative power (High byte) |
| 46 | Einv_all L | 0.1kWh| | Inverter output accumulated power (Low byte) |
| 47 | Einv_all H | 0.1kWh| | Inverter output accumulated power (High byte) |
| 48 | Erec_all L | 0.1kWh| | AC charging accumulated power (Low byte) |
| 49 | Erec_all H | 0.1kWh| | AC charging accumulated power (High byte) |
| 50 | Echg_all L | 0.1kWh| | Cumulative charge energy (Low byte) |
| 51 | Echg_all H | 0.1kWh| | Cumulative charge energy (High byte) |
| 52 | Edischg_all L | 0.1kWh| | Cumulative discharge energy (Low byte) |
| 53 | Edischg_all H | 0.1kWh| | Cumulative discharge energy (High byte) |
| 54 | Eeps_all L | 0.1kWh| | Cumulative off-grid output energy (Low byte) |
| 55 | Eeps_all H | 0.1kWh| | Cumulative off-grid output energy (High byte) |
| 56 | Etogrid_all L | 0.1kWh| | Accumulate export energy (Low byte) |
| 57 | Etogrid_all H | 0.1kWh| | Accumulate export energy (High byte) |
| 58 | Etouser_all L | 0.1kWh| | Cumulative import energy (Low byte) |
| 59 | Etouser_all H | 0.1kWh| | Cumulative import energy (High byte) |
| 60 | FaultCode L | | | Fault code (Low) |
| 61 | FaultCode H | | | Fault code (High) |
| 62 | WarningCode L| | | Warning code (Low) |
| 63 | WarningCode H| | | Warning code (High) |
| 64 | Tinner | °C | 0-65535 | Internal temperature |
| 65 | Tradiator1 | °C | 0-65535 | Radiator temperature 1 |
| 66 | Tradiator2 | °C | 0-65535 | Radiator temperature 2 |
| 67 | Tbat | °C | 0-65535 | Battery temperature |
| 69 | RunningTime L| sec | | Runtime duration |
| 70 | RunningTime H| sec | | Runtime duration |
| 71 | AutoTestStatus| | | Bit0-3: Start (0:Not, 1:Start); Bit4-7: Status (0:Wait, 1:Test, 2:Fail, 3:V OK, 4:F OK, 5:Pass); Bit8-11: Step |
| 72 | wAutoTestLimit| 0.1V/0.01Hz| | Voltage limit (Step 1,2,5,6) or Freq limit (Step 3,4,7,8) |
| 73 | uwAutoTestDefTime| ms | | Default Time |
| 74 | uwAutoTestTripVal| 0.1V/0.01Hz| | Trip Value |
| 75 | uwAutoTestTripTime| ms | | Trip Time |
| 77 | ACInputType | BitMap | | **Bit0:** 0-Grid, 1-Gen(12K); **Bit1:** AC Couple Inv Flow (0-No, 1-Show); **Bit2:** AC Couple En; **Bit3:** SmartLoadFlow (0-No, 1-Show); **Bit4:** SmartLoadEnOn (1:Enable); **Bit5:** EPSLoadPowerShow; **Bit6:** GridLoadPowerShow; **Bit7:** PloadPowerShow |
| 80 | BatType/Com | | 0/1 | BatType (See file); BatComType (0-CAN, 1-485) |
| 81 | MaxChgCurr | 0.01A | | Max charge current (BMS limit) |
| 82 | MaxDischgCurr| 0.01A | | Max discharge current (BMS limit) |
| 83 | ChargeVoltRef| 0.1V | | Recommends charging voltage (BMS) |
| 84 | DischgCutVolt| 0.1V | | Recommends discharging cut-off voltage (BMS) |
| 85 | BatStatus0 | | | BMS Status Info 0 |
| 86 | BatStatus1 | | | BMS Status Info 1 |
| 87 | BatStatus2 | | | BMS Status Info 2 |
| 88 | BatStatus3 | | | BMS Status Info 3 |
| 89 | BatStatus4 | | | BMS Status Info 4 |
| 90 | BatStatus5 | | | BMS Status Info 5 |
| 91 | BatStatus6 | | | BMS Status Info 6 |
| 92 | BatStatus7 | | | BMS Status Info 7 |
| 93 | BatStatus8 | | | BMS Status Info 8 |
| 94 | BatStatus9 | | | BMS Status Info 9 |
| 95 | BatStatus_INV| | | Inverter aggregated battery status |
| 96 | BatParallelNum| | | Number of batteries in parallel |
| 97 | BatCapacity | Ah | | Battery capacity |
| 98 | BatCurrent | 0.01A | | Battery current (Signed) |
| 99 | FaultCode_BMS| | | BMS Fault Code |
| 100 | WarningCode_BMS| | | BMS Warning Code |
| 101 | MaxCellVolt | 0.001V | | Max cell voltage |
| 102 | MinCellVolt | 0.001V | | Min cell voltage |
| 103 | MaxCellTemp | 0.1°C | | Max cell temp (Signed) |
| 104 | MinCellTemp | 0.1°C | | Min cell temp (Signed) |
| 105 | BMS Update/Dry| | | Bit0-2: Update State; Bit3: RSVD; Bit4: GenDryContactState (0-Off, 1-On, 12K only) |
| 106 | CycleCnt_BMS | | | Charge/Discharge cycles |
| 107 | BatVoltSample| 0.1V | | Inverter sampled battery voltage |
| 108 | T1 | 0.1°C | | BT temperature for 12k |
| 109-112| T2-T5 | | | Reserved |
| 113 | Master/Slave | BitMap | | **Bit0-1:** 1:Master, 2:Slave; **Bit2-3:** Phase (1:R, 2:S, 3:T); **Bit4-5:** Order; **Bit8-16:** Parallel Num |
| 114 | OnGridLoadPwr| W | | Load power of 12k inverter when NOT off-grid |
| 115 | SN[0]-Year | ASCII | | '0'-'9', 'A'-'Z' |
| 116 | SN[1]-Week | ASCII | | |
| 116 | SN[2]-Week | ASCII | | (Note: Overlap in source PDF, check Index) |
| 116 | SN[3]-Factory| ASCII | | |
| 117 | SN[4]-Prod | ASCII | | Product Code |
| 117 | SN[5]-Prod | ASCII | | Product Code |
| 118 | SN[6]-Serial | ASCII | | Serial Number |
| 118 | SN[7]-Serial | ASCII | | Serial Number |
| 119 | SN[8]-Serial | ASCII | | Serial Number |
| 119 | SN[9]-Serial | ASCII | | Serial Number |
| 120 | VBusP | 0.1V | | Half BUS voltage |
| 121 | GenVolt | 0.1V | | Generator voltage (R phase) |
| 122 | GenFreq | 0.01Hz | | Generator frequency |
| 123 | GenPower | W | | Generator Power (R phase) |
| 124 | Egen_day | 0.1kWh| | Generator energy today |
| 125 | Egen_all L | 0.1kWh| | Total generator energy (Low) |
| 126 | Egen_all H | 0.1kWh| | Total generator energy (High) |
| 127 | EPSVoltL1N | 0.1V | | EPS L1N / Gen S phase Voltage |
| 128 | EPSVoltL2N | 0.1V | | EPS L2N / Gen T phase Voltage |
| 129 | Peps_L1N | W | | Active Power EPS L1N / Off-grid S Phase |
| 130 | Peps_L2N | W | | Active Power EPS L2N / Off-grid T Phase |
| 131 | Seps_L1N | VA | | Apparent Power EPS L1N / Off-grid S Phase |
| 132 | Seps_L2N | VA | | Apparent Power EPS L2N / Off-grid T Phase |
| 133 | EepsL1N_day | 0.1kWh| | Daily energy EPS L1N / Off-grid S Phase |
| 134 | EepsL2N_day | 0.1kWh| | Daily energy EPS L2N / Off-grid T Phase |
| 135 | EepsL1N_all L| 0.1kWh| | Total energy EPS L1N (Low) |
| 136 | EepsL1N_all H| 0.1kWh| | Total energy EPS L1N (High) |
| 137 | EepsL2N_all L| 0.1kWh| | Total energy EPS L2N (Low) |
| 138 | EepsL2N_all H| 0.1kWh| | Total energy EPS L2N (High) |
| 139 | Qinv | Var | | Reactive power |
| 140 | AFCI_CurrCH1 | mA | | AFCI Current CH1 |
| 141 | AFCI_CurrCH2 | mA | | AFCI Current CH2 |
| 142 | AFCI_CurrCH3 | mA | | AFCI Current CH3 |
| 143 | AFCI_CurrCH4 | mA | | AFCI Current CH4 |
| 144 | AFCIFlag | BitMap | | Bit0-3: ArcAlarm CH1-4 (0-Norm, 1-Alarm); Bit4-7: SelfTest CH1-4 (0-Norm, 1-Fail) |
| 145 | AFCI_ArcCH1 | | | Real time arc CH1 |
| 146 | AFCI_ArcCH2 | | | Real time arc CH2 |
| 147 | AFCI_ArcCH3 | | | Real time arc CH3 |
| 148 | AFCI_ArcCH4 | | | Real time arc CH4 |
| 149 | AFCI_MaxArcCH1| | | Max arc CH1 |
| 150 | AFCI_MaxArcCH2| | | Max arc CH2 |
| 151 | AFCI_MaxArcCH3| | | Max arc CH3 |
| 152 | AFCI_MaxArcCH4| | | Max arc CH4 |
| 153 | ACCouplePower| W | | AC Coupled inverter power |
| 154 | AutoTestTripVal[0]| | | |
| ... | ... | ... | ... | (155-160 implicit in range) |
| 161 | AutoTestTripVal[7]| | | |
| 162 | AutoTestTripTime[0]| ms| | |
| ... | ... | ... | ... | |
| 169 | AutoTestTripTime[7]| ms| | |
| 170 | Pload | W | | Load consumption (On-grid mode) |
| 171 | Eload_day | 0.1kWh| | Load energy today |
| 172 | Eload_allL | 0.1kWh| | Load energy total (High byte - *Note PDF says High*) |
| 173 | Eload_allH | 0.1kWh| | Load energy total (Low byte - *Note PDF says Low*) |
| 174 | SwitchState | BitMap | | Bit0-4: DIP Safety Switch; Bit8: EPS Sw; Bit9: Gen Dry Contact; Bit10: Gen Quick Start; Bit15: SwRegUsed |
| 175 | EPS Ovl Ctrl | s | | Connect in xx S after triggering EPS overload |
| 176 | ExceptionReason1| BitMap | | Bit0-3: PVGridOn Exit; Bit4-7: PVChgGridOn Exit; Bit8-11: BatGridOn Exit; Bit12-15: PVBatGridOn Exit |
| 177 | ExceptionReason2| BitMap | | Bit0-3: PVCharge Exit; Bit4-7: ACCharge Exit; Bit8-11: PVACCharge Exit; Bit12-15: EPS Exit |
| 178 | ChgDischgDisable| BitMap | | Bit0-7: Charge Exit Reason; Bit8-15: Discharge Exit Reason |
| 180 | Pinv_S | W | | On grid inverter power (S phase) |
| 181 | Pinv_T | W | | On grid inverter power (T phase) |
| 182 | Prec_S | W | | Charging rectification power (S phase) |
| 183 | Prec_T | W | | Charging rectification power (T phase) |
| 184 | Ptogrid_S | W | | User on-grid power (S phase) |
| 185 | Ptogrid_T | W | | User on-grid power (T phase) |
| 186 | Ptouser_S | W | | Grid supply power (S phase) |
| 187 | Ptouser_T | W | | Grid supply power (T phase) |
| 188 | GenPower_S | W | | Generator power (S phase) |
| 189 | GenPower_T | W | | Generator power (T phase) |
| 190 | IinvRMS_S | 0.01 | | Effective inverter current (S phase) |
| 191 | IinvRMS_T | 0.01 | | Effective inverter current (T phase) |
| 192 | PF_S | 0.001 | | Power factor S phase |
| 193 | GridVoltL1N | 0.1V | | US Model |
| 194 | GridVoltL2N | 0.1V | | US Model |
| 195 | GenVoltL1N | 0.1V | | US Model |
| 196 | GenVoltL2N | 0.1V | | US Model |
| 197 | PinvL1N | W | | US Model |
| 198 | PinvL2N | W | | US Model |
| 199 | PrecL1N | W | | US Model |
| 200 | PrecL2N | W | | US Model |
| 201 | Ptogrid_L1N | W | | US Model |
| 202 | Ptogrid_L2N | W | | US Model |
| 203 | Ptouser_L1N | W | | US Model |
| 204 | Ptouser_L2N | W | | US Model |
| 205 | PF_T | 0.001 | | Power factor T phase |
| 206 | ACCouplePwr_S | W | | AC Couple Inv Power S |
| 207 | ACCouplePwr_T | W | | AC Couple Inv Power T |
| 208 | OnGridLoadPwrS| W | | Trip6-20k S phase load |
| 209 | OnGridLoadPwrT| W | | Trip6-20k T phase load |
| 210 | RemainingSecs | s | | Remaining seconds of one click charging |
| 214 | uwNTCForINDC | °C | | Internal temperature |
| 215 | uwNTCForDCDCL | °C | | Radiator temperature 1 |
| 216 | uwNTCForDCDCH | °C | | Radiator temperature 2 |
| 217 | Vpv4 | 0.1V | | PV4 Voltage |
| 218 | Vpv5 | 0.1V | | PV5 Voltage |
| 219 | Vpv6 | 0.1V | | PV6 Voltage |
| 220 | Ppv4 | W | | PV4 Power |
| 221 | Ppv5 | W | | PV5 Power |
| 222 | Ppv6 | W | | PV6 Power |
| 223 | Epv4_day | 0.1kWh| | PV4 Energy Today |
| 224 | Epv4_all L | 0.1kWh| | PV4 Total Energy (Low) |
| 225 | Epv4_all H | 0.1kWh| | PV4 Total Energy (High) |
| 226 | Epv5_day | 0.1kWh| | PV5 Energy Today |
| 227 | Epv5_all L | 0.1kWh| | PV5 Total Energy (Low) |
| 228 | Epv5_all H | 0.1kWh| | PV5 Total Energy (High) |
| 229 | Epv6_day | 0.1kWh| | PV6 Energy Today |
| 230 | Epv6_all L | 0.1kWh| | PV6 Total Energy (Low) |
| 231 | Epv6_all H | 0.1kWh| | PV6 Total Energy (High) |
| 232 | SmartLoadPwr | W | | Smart Load output power |

---

### 2.2 Hold Registers (Read/Write: 0x03/0x06/0x10)

| Addr | Item | Unit | Range | Note / Bit Definitions |
|:---|:---|:---|:---|:---|
| 7 | FWCode0/1 | ASCII | 'A'-'Z' | Model code / Derived model |
| 8 | FWCode2/3 | ASCII | 'A'-'Z' | ODM code / Region code |
| 9 | Slave/Com Ver | | 0-255 | Redundant CPU / Communication CPU Ver |
| 10 | Cntl/FW Ver | | 0-255 | Control CPU / External Software Ver |
| 11 | ResetSetting | BitMap| 0/1 | **Bit1:** Restore Default; **Bit7:** Restart Inverter; Others: Retain |
| 12 | Time_Year/Month| | | Year (17-255), Month (1-12) |
| 13 | Time_Day/Hour | | | Day (1-31), Hour (0-23) |
| 14 | Time_Min/Sec | | | Minute (0-59), Second (0-59) |
| 15 | Com Addr | | 0-150 | Modbus Address |
| 16 | Language | | 0-1 | 0:English, 1:German |
| 19 | DTC:Device Type | | 0-31 | 0:Default, 3:XOLTA |
| 20 | PVInputModel | | | **12KHybrid:** 0-NoPV, 1-PV1, 2-PV2, 3-PV3, 4-PV1&2, 5-PV1&3, 6-PV2&3, 7-All. <br> **TriP 6-20k:** 0-All Indep, 1-PV1&2Par, 2-PV1&3Par, 3-PV2&3Par, 4-All Par. |
| 21 | FuncEn | BitMap| | **Bit0:** EPS En; **Bit1:** OVF Load Derate En; **Bit2:** DRMS En; **Bit3:** LVRT En; **Bit4:** AntiIsland En; **Bit5:** NeutralDetect En; **Bit6:** GridOnPowerSS En; **Bit7:** ACCharge En; **Bit8:** SWSeamlessly En; **Bit9:** Standby; **Bit10:** ForcedDischg En; **Bit11:** ForcedChg En; **Bit12:** ISO En; **Bit13:** GFCI En; **Bit14:** DCI En; **Bit15:** FeedInGrid En |
| 22 | StartPVVolt | 0.1V | 900-5000| PV start-up voltage |
| 23 | ConnectTime | s | 30-600 | Waiting time of on-grid |
| 24 | ReconnectTime | s | 0-900 | Waiting time of Reconnect on-gird |
| 25 | GridVoltConnLow | 0.1V | | Lower limit allowed on-grid |
| 26 | GridVoltConnHigh| 0.1V | | Upper limit allowed on-grid |
| 27 | GridFreqConnLow | 0.01Hz| | Lower limit frequency |
| 28 | GridFreqConnHigh| 0.01Hz| | Upper limit frequency |
| 29 | GridVoltLimit1Low| 0.1V | | Level 1 undervoltage protection |
| 30 | GridVoltLimit1High| 0.1V | | Level 1 overvoltage protection |
| 31 | GridVoltLimit1LowTime| | | Level 1 undervoltage time |
| 32 | GridVoltLimit1HighTime| | | Level 1 overvoltage time |
| 33 | GridVoltLimit2Low| 0.1V | | Level 2 undervoltage protection |
| 34 | GridVoltLimit2High| 0.1V | | Level 2 overvoltage protection |
| 35 | GridVoltLimit2LowTime| | | Level 2 undervoltage time |
| 36 | GridVoltLimit2HighTime| | | Level 2 overvoltage time |
| 37 | GridVoltLimit3Low| 0.1V | | Level 3 undervoltage protection |
| 38 | GridVoltLimit3High| 0.1V | | Level 3 overvoltage protection |
| 39 | GridVoltLimit3LowTime| | | Level 3 undervoltage time |
| 40 | GridVoltLimit3HighTime| | | Level 3 overvoltage time |
| 41 | GridVoltMovAvgHigh| 0.1V | | Sliding average overvoltage point |
| 42 | GridFreqLimit1Low| 0.01Hz| | Freq Level 1 underfrequency point |
| 43 | GridFreqLimit1High| 0.01Hz| | Freq Level 1 overfrequency point |
| 44 | GridFreqLimit1LowTime| | | Freq Level 1 underfrequency time |
| 45 | GridFreqLimit1HighTime| | | Freq Level 1 overfrequency time |
| 46 | GridFreqLimit2Low| 0.01Hz| | Freq Level 2 underfrequency point |
| 47 | GridFreqLimit2High| 0.01Hz| | Freq Level 2 overfrequency point |
| 48 | GridFreqLimit2LowTime| | | Freq Level 2 underfrequency time |
| 49 | GridFreqLimit2HighTime| | | Freq Level 2 overfrequency time |
| 50 | GridFreqLimit3Low| 0.01Hz| | Freq Level 3 underfrequency point |
| 51 | GridFreqLimit3High| 0.01Hz| | Freq Level 3 overfrequency point |
| 52 | GridFreqLimit3LowTime| | | Freq Level 3 underfrequency time |
| 53 | GridFreqLimit3HighTime| | | Freq Level 3 overfrequency time |
| 54 | MaxQPercentForQV| % | | Max % reactive power for Q(V) |
| 55 | V2L | 0.1V | | Q(V) curve undervoltage 2 |
| 56 | V1L | 0.1V | | Q(V) curve undervoltage 1 |
| 57 | V1H | 0.1V | | Q(V) curve overvoltage 1 |
| 58 | V2H | 0.1V | | Q(V) curve overvoltage 2 |
| 59 | ReactivePowerCMD| 0-7 | | 0:Unit PF; 1:Fixed PF; 2:Default Q(P); 3:Custom PF; 4:Capacitive; 5:Inductive; 6:QV; 7:QV_Dynamic |
| 60 | ActivePower%CMD | % | 0-100 | Active power percentage |
| 61 | ReactivePower%CMD| % | 0-60 | Reactive power percentage |
| 62 | PFCMD | 0.001 | | 750-1000 (under), 1750-2000 (over) |
| 63 | PowerSoftStart | %o/min| 1-4000 | Loading rate |
| 64 | ChargePower%CMD | % | 0-100 | Charging power percentage |
| 65 | DischgPower%CMD | % | 0-100 | Discharging power percentage |
| 66 | ACChgPowerCMD | % | 0-100 | AC charge percentage |
| 67 | ACChgSOCLimit | % | 0-100 | SOC limit for AC charging |
| 68 | ACChgStartTime | | 0-23/0-59| Start Hour/Minute |
| 69 | ACChgEndTime | | 0-23/0-59| End Hour/Minute |
| 70 | ACChgStart1 | | | Start Hour/Minute 1 |
| 71 | ACChgEnd1 | | | End Hour/Minute 1 |
| 72 | ACChgStart2 | | | Start Hour/Minute 2 |
| 73 | ACChgEnd2 | | | End Hour/Minute 2 |
| 74 | ChgFirstPowerCMD| % | 0-100 | Charge priority percentage |
| 75 | ChgFirstSOCLimit| % | | Charge priority SOC limit |
| 76 | ChgFirstStart | | | Start Hour/Minute |
| 77 | ChgFirstEnd | | | End Hour/Minute |
| 78 | ChgFirstStart1 | | | Start Hour/Minute 1 |
| 79 | ChgFirstEnd1 | | | End Hour/Minute 1 |
| 80 | ChgFirstStart2 | | | Start Hour/Minute 2 |
| 81 | ChgFirstEnd2 | | | End Hour/Minute 2 |
| 82 | ForcedDischgPwr | % | 0-100 | Forced discharge percentage |
| 83 | ForcedDischgSOC | % | 0-100 | Forced discharge SOC limit |
| 84 | ForcedDischgStart| | | Start Hour/Minute |
| 85 | ForcedDischgEnd | | | End Hour/Minute |
| 86 | ForcedDischgStart1| | | Start Hour/Minute 1 |
| 87 | ForcedDischgEnd1| | | End Hour/Minute 1 |
| 88 | ForcedDischgStart2| | | Start Hour/Minute 2 |
| 89 | ForcedDischgEnd2| | | End Hour/Minute 2 |
| 90 | EPSVoltageSet | 1V | | 230, 240, 277, 208, 220 |
| 91 | EPSFreqSet | 1Hz | 50,60 | Off-grid frequency |
| 92 | LockInGridVForPFCurve| 0.1V | | cosphi(P) lock in voltage |
| 93 | LockOutGridVForPFCurve| 0.1V | | cosphi(P) lock out voltage |
| 94 | LockInPowerForQVCurve| % | 0-100 | Q(V) lock in power |
| 95 | LockOutPowerForQVCurve| % | 0-100 | Q(V) lock out power |
| 96 | DelayTimeForQVCurve| | 0-2000 | Q(V) delay |
| 97 | DelayTimeOverFDerate| | 0-1000 | Overfrequency load reduction delay |
| 99 | ChargeVoltRef | 0.1V | 500-590 | Lead-acid charge voltage |
| 100 | CutVoltForDischg| 0.1V | 400-520 | Lead-acid discharge cut-off |
| 101 | ChargeRate | A | 0-140 | Charging current |
| 102 | DischgRate | A | 0-140 | Discharging current |
| 103 | MaxBackFlow | % | 0-100 | Feed-in grid power setting |
| 105 | EOD | % | 10-90% | Cut SOC for discharging |
| 106 | TempLowLimDischg| 0.1°C | | Lead-acid Temp Low Limit (Dischg) |
| 107 | TempHighLimDischg| 0.1°C | | Lead-acid Temp High Limit (Dischg) |
| 108 | TempLowLimChg | 0.1°C | | Lead-acid Temp Low Limit (Chg) |
| 109 | TempHighLimChg | 0.1°C | | Lead-acid Temp High Limit (Chg) |
| 110 | FunctionEn1 | BitMap| | **Bit0:** AC Storage En; **Bit1:** FastZeroExport; **Bit2:** MicroGrid En; **Bit3:** BatShared; **Bit4:** ChgLastEn; **Bit5-6:** CTSampleRatio (12K: L2/H2 bits); **Bit7:** BuzzerEn (12K: DryContactor); **Bit8-9:** PVCTSampleType (ACS3600 vs 12K); **Bit10:** TakeLoadTogether; **Bit11:** OnGridWorkingMode; **Bit12-13:** PVCTSampleRatio (Ext); **Bit14:** GreenMode; **Bit15:** EcoMode |
| 112 | SetSystemType | 0-4 | | 0:NoPar, 1:SinglePar, 2:Secondary, 3:3-PhaseMaster, 4:2*208 Master |
| 113 | SetComposedPhase| | | Write Only. 0:Clear; 1-3:Set R/S/T. Read: Bit0-7 Offgrid phase, Bit8-15 Ongrid phase. |
| 114 | ClearFunction | | 1 | Parallel Alarm clear |
| 115 | OVFDerateStart | 0.01Hz| 5000-5200| Over-frequency load reduction start |
| 116 | PtoUserStartDischg| 1W | 50W | Device starts discharging when Ptouser > Value |
| 117 | PtoUserStartChg | 1W | -50W | Device starts charging when Ptouser < Value |
| 118 | VbatStartDerating| 0.1V | | Lead-acid curve decrease start |
| 119 | wCT_PowerOffset | 1W | +/-1000 | Signed CT Power compensation |
| 120 | stSysEnable | BitMap| | **Bit0:** HalfHourACChg; **Bit1-3:** ACChargeType (0-Dis, 1-Time, 2-Volt, 3-SOC, 4-V&T, 5-SOC&T); **Bit4-5:** DischgCtrlType (0-Volt, 1-SOC, 2-Both); **Bit6:** OnGridEODType; **Bit7:** GenChargeType; **Bit8:** SeparateZeroExportEn |
| 124 | OVFDerateEnd | 0.01Hz| 5000-5200| Over-frequency load reduction end |
| 125 | SOCLowLimitEPS | % | | SOC low limit for EPS discharge |
| 126 | OptimalChgDischg0-1| 2Bits | 0-2 | Bits 0-1 (00:00-00:30) to Bits 14-15 (03:30-04:00). 0:Def, 1:ACChg, 2:PVChg, 3:Dischg |
| 127 | OptimalChgDischg2-3| | | 04:00 - 08:00 |
| 128 | OptimalChgDischg4-5| | | 08:00 - 12:00 |
| 129 | OptimalChgDischg6-7| | | 12:00 - 16:00 |
| 130 | OptimalChgDischg8-9| | | 16:00 - 20:00 |
| 131 | OptimalChgDischg10-11| | | 20:00 - 24:00 |
| 132 | BatCellVoltLow/High| 0.1V | 0-200 | Battery cell voltage limits |
| 133 | BatCellSerial/Para| | 0-200 | Number of cells in series/parallel |
| 134 | UVFDerateStart | 0.01Hz| | Underfrequency load reduction start |
| 135 | UVFDerateEnd | 0.01Hz| | Underfrequency load reduction end |
| 136 | OVFDerateRatio | % | 1-100 | Underfrequency load ramp rate |
| 137 | SpecLoadCompensate| W | | Compensation for specific load |
| 138 | ChargePower%CMD | 0.1% | 0-1000 | Charging power percentage |
| 139 | DischgPower%CMD | 0.1% | 0-1000 | Discharging power percentage |
| 140 | ACChgPowerCMD | 0.1% | 0-1000 | AC Charge percentage |
| 141 | ChgFirstPowerCMD| 0.1% | 0-1000 | Charging priority percentage |
| 142 | ForcedDischgPwr | 0.1% | 0-1000 | Forced discharge percentage |
| 143 | ActivePower%CMD | 0.1% | 0-1000 | Inverse active percentage |
| 144 | FloatChargeVolt | 0.1V | 500-560 | Float charge voltage |
| 145 | OutputPrioConfig| 0-3 | | 0:BatFirst, 1:PVFirst, 2:ACFirst |
| 146 | LineMode | 0-2 | | 0:APL, 1:UPS, 2:GEN |
| 147 | BatteryCapacity | Ah | 0-10000 | Unmatched battery capacity |
| 148 | BatteryNominalVolt| 0.1V | 400-590 | Unmatched battery voltage |
| 149 | EqualizationVolt| | 500-590 | |
| 150 | EqualizationInterval| Day | 0-365 | |
| 151 | EqualizationTime| Hour | 0-24 | |
| 152 | ACFirstStart | | | Start Hour/Minute |
| 153 | ACFirstEnd | | | End Hour/Minute |
| 154 | ACFirstStart1 | | | Start Hour/Minute 1 |
| 155 | ACFirstEnd1 | | | End Hour/Minute 1 |
| 156 | ACFirstStart2 | | | Start Hour/Minute 2 |
| 157 | ACFirstEnd2 | | | End Hour/Minute 2 |
| 158 | ACChgStartVolt | 0.1V | 385-520 | Battery voltage to start AC charge |
| 159 | ACChgEndVolt | 0.1V | 480-590 | Battery voltage to end AC charge |
| 160 | ACChgStartSOC | % | 0-90 | SOC to start AC charge |
| 162 | BatLowVoltage | 0.1V | 400-500 | Alarm point (Valid based on DisChgCtrl) |
| 163 | BatLowBackVolt | 0.1V | 420-520 | Recovery point |
| 164 | BatLowSOC | % | 0-90 | Alarm point SOC |
| 165 | BatLowBackSOC | % | 20-100 | Recovery point SOC |
| 166 | BatLowToUtilityV| 0.1V | 444-514 | Transfer to grid voltage point |
| 167 | BatLowToUtilitySOC| % | 0-100 | Transfer to grid SOC point |
| 168 | ACChargeBatCurr | A | 0-140 | Charge current from AC |
| 169 | OngridEOD_Volt | 0.1V | 400-560 | On-grid end of discharge voltage |
| 171 | SOCCurve_BatVolt1| 0.1V | | Point 1 calibration |
| 172 | SOCCurve_BatVolt2| 0.1V | | Point 2 calibration |
| 173 | SOCCurve_SOC1 | 1% | | SOC Point 1 |
| 174 | SOCCurve_SOC2 | 1% | | SOC Point 2 |
| 175 | SOCCurve_InnerRes| mΩ | | Inner resistance |
| 176 | MaxGridInputPower| W | | Grid import limit |
| 177 | GenRatePower | W | | Generator rated power |
| 179 | uFunctionEn2 | BitMap| | **Bit0:** ACCTDir; **Bit1:** PVCTDir; **Bit2:** AFCIAlarmClr; **Bit3:** BatWakeup PV Sell First; **Bit4:** VoltWattEn; **Bit5:** TripTimeUnit; **Bit6:** ActPowerCMDEn; **Bit7:** GridPeakShav; **Bit8:** GenPeakShav; **Bit9:** BatChgCtrl (SOC/Volt); **Bit10:** BatDischgCtrl; **Bit11:** ACcoupling; **Bit12:** PVArcEn; **Bit13:** SmartLoadEn; **Bit14:** RSDDisable; **Bit15:** OnGridAlwaysOn |
| 180 | AFCIArcThreshold| | | |
| 181 | VoltWatt_V1 | 0.1V | | Default 1.06Vn |
| 182 | VoltWatt_V2 | 0.1V | | Default 1.1Vn |
| 183 | VoltWatt_Delay | ms | | Default 10000ms |
| 184 | VoltWatt_P2 | % | 0-200 | |
| 185 | Vref_QV | 0.1V | | |
| 186 | Vref_filtertime | s | | |
| 187 | Q3_QV | % | | |
| 188 | Q4_QV | % | | |
| 189 | P1_QP | % | | |
| 190 | P2_QP | % | | |
| 191 | P3_QP | % | | |
| 192 | P4_QP | % | | |
| 193 | UVFIncreaseRatio| % | 1-100 | Underfrequency load ramp rate |
| 194 | GenChgStartVolt | 0.1V | 384-520 | Gen charge start voltage |
| 195 | GenChgEndVolt | 0.1V | 480-590 | Gen charge end voltage |
| 196 | GenChgStartSOC | % | 0-90 | Gen charge start SOC |
| 197 | GenChgEndSOC | % | 20-100 | Gen charge end SOC |
| 198 | MaxGenChgBatCurr| A | 0-4000 | Max charge current from Gen |
| 199 | OverTempDerate | 0.1°C | 600-900 | |
| 201 | ChgFirstEndVolt | 0.1V | 480-590 | Charge priority voltage limit |
| 202 | ForceDichgEndVolt| 0.1V | 400-560 | Forced discharge voltage limit |
| 203 | GridRegulation | | | Settings |
| 204 | LeadCapacity | Ah | 50-5000 | |
| 205 | GridType | | | 0:Split240/120, 1:3ph 208/120, 2:Single240, 3:Single230, 4:Split200/100. (See Doc for 3-Phase list) |
| 206 | GridPeakShavPower| 0.1kW| 0-255 | |
| 207 | GridPeakShavSOC | % | 0-100 | |
| 208 | GridPeakShavVolt| 0.1V | 480-590 | |
| 209 | PeakShavStart | | | Start Hour/Minute |
| 210 | PeakShavEnd | | | End Hour/Minute |
| 211 | PeakShavStart1 | | | Start Hour/Minute 1 |
| 212 | PeakShavEnd1 | | | End Hour/Minute 1 |
| 213 | SmartLoadOnVolt | 0.1V | 480-590 | |
| 214 | SmartLoadOffVolt| 0.1V | 400-520 | |
| 215 | SmartLoadOnSOC | % | 0-100 | |
| 216 | SmartLoadOffSOC | % | 0-100 | |
| 217 | StartPVpower | 0.1kW| 0-120 | |
| 218 | GridPeakShavSOC1| % | 0-100 | |
| 219 | GridPeakShavVolt1| 0.1V | 480-590 | |
| 220 | ACCoupleStartSOC| % | 0-100 | |
| 221 | ACCoupleEndSOC | % | 0-255 | |
| 222 | ACCoupleStartVolt| 0.1V | 400-595 | |
| 223 | ACCoupleEndVolt | 0.1V | 420-800 | |
| 224 | LCDVersion/Type/ODM| | | Bit0-7:Ver, Bit8:Type, Bit9-15:ODM |
| 225 | LCDPassword | | 0-65535 | |
| 227 | BatStopChgSOC | % | 10-101 | Stop charging SOC |
| 228 | BatStopChgVolt | 0.1V | 400-595 | Stop charging Volt |
| 230 | unMeterCfg | BitMap| | Bit0-3: Num; Bit8: MeasureType; Bit9-10: InstallPhase |
| 231 | unResetRecord | | | Bit0: G100 Reset |
| 232 | GridPeakShavPwr1| 0.1kW| 0-255 | |
| 233 | uFunction4En | BitMap| | **Bit0:** QuickChgStart; **Bit1:** BattBackup; **Bit2:** Maintenance; **Bit3:** WorkingMode; **Bit4-7:** DryContactorMultiplex (1:RSD, 2:DarkStart, 3:SmartLoad, 4:NonCrit); **Bit8-9:** ubExCTPosition; **Bit10:** OverFreq_fstop |
| 234 | QuickChgTime | min | | |
| 235 | uwNoFullChgDay | | | Bit0-7: Counter; Bit8-15: Set |
| 236 | FloatChgThreshold| 0.01C| | |
| 237 | GenCoolDownTime | 0.1min| | |
| 241 | PermitService | | | 0-disable, non0-enable |
| 242 | uwNPEThreshold | 0.1V | | Zero ground detection |
| 244 | Bootloader_Ver | | | Bit0-7 Ver; Bit8-15 Flag |
| 245 | FlashSize | | | |
| 248 | WattNode_CtAmps1| A | 0-6000 | CT1 Ratio |
| 249 | WattNode_CtAmps2| A | 0-6000 | CT2 Ratio |
| 250 | WattNode_CtAmps3| A | 0-6000 | CT3 Ratio |
| 251 | WattNode_Dir | BitMap| | Bit0-2: Directions CT1/2/3; Bit3-5: UpdateFreq |
| 252 | NEC120BusBarLimit| A | | |
| 253 | DeltaSOC | % | 5-80 | Hysteresis SOC |
| 254 | DeltaVolt | 0.1V | 20-100 | Hysteresis Volt |
| 256 | GenStart | | | Start Hour/Minute |
| 257 | GenEnd | | | End Hour/Minute |
| 258 | GenStart1 | | | Start Hour/Minute 1 |
| 259 | GenEnd1 | | | End Hour/Minute 1 |
| 260 | uwBusVoltHighSet| 1V | 550-595 | |
| 261 | bDisRecovThresh | | | Battery Discharge Recovery (SOC/Volt) |

---

## 3. Appendices

### 3.1 Operational Modes (Input Reg 0)
*   **0x00:** Standby
*   **0x01:** Fault
*   **0x02:** Programming
*   **0x04:** PV connected to grid (No AC storage var)
*   **0x08:** PV charging (No AC storage var)
*   **0x0C:** PV charge + grid (No AC storage var)
*   **0x10:** Battery grid discharge
*   **0x14:** PV+Battery grid discharge
*   **0x20:** AC charging
*   **0x28:** PV+AC charging
*   **0x40:** Battery off-grid
*   **0x60:** Off-grid + battery charging
*   **0x80:** PV off-grid
*   **0xC0:** PV+Battery off-grid
*   **0x88:** PV charging + off-grid

### 3.2 Fault Codes (Reg 60/61)
| Code | Description | Code | Description |
|:---|:---|:---|:---|
| E000 | Internal comms 1 | E017 | Internal comms 2 |
| E001 | Model fault | E018 | Internal comms 3 |
| E002-E007 | Reserved | E019 | Bus Overvoltage |
| E008 | Parallel CAN fail | E020 | EPS Connection fault |
| E009 | Host missing | E021 | PV Overvoltage |
| E010 | Power inconsistent | E022 | Overcurrent |
| E011 | Parallel settings incon. | E023 | Neutral fault |
| E012 | UPS Short Circuit | E024 | PV Short |
| E013 | UPS Backfilling | E025 | Heatsink Temp |
| E014 | BUS Short Circuit | E026 | Internal failure |
| E015 | Phase abnormal | E027 | Consistency failure |
| E016 | Relay fault | E028 | Parallel Sync loss |
| | | E031 | Internal comms 4 |

### 3.3 Warning Codes (Reg 62/63)
*   **W000:** Battery comms failed
*   **W001:** AFCI comms failed
*   **W002:** Bat Low Temp / AFCI High
*   **W003:** Meter comms failed
*   **W004:** Battery failure
*   **W005:** AutoTest failure
*   **W007:** LCD comms failure
*   **W008:** Software mismatch
*   **W009:** Fan Stuck
*   **W010:** Same para address / Grid Overload (Trip6-20k)
*   **W011:** Secondary overflow
*   **W012:** BatOnMos / Phase Loss
*   **W013:** Overtemp / No Primary
*   **W014:** Multi-Primary set
*   **W015:** Battery Reverse
*   **W016:** No AC Connection
*   **W017:** AC Voltage out of range
*   **W018:** AC Freq out of range
*   **W019:** AC Inconsistent
*   **W020:** PV Isolation low
*   **W021:** Leakage I high
*   **W022:** DC Injection high
*   **W023:** PV Short circuit
*   **W025:** Bat Volt High
*   **W026:** Bat Volt Low
*   **W027:** Bat Open
*   **W028:** EPS Overload
*   **W029:** EPS Voltage High
*   **W030:** Meter Reversed
*   **W031:** EPS DCV High / DCV Exceeded
