import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const wikis = [
      {
        title: "Tokheim Quantium 510 — Complete Service Wiki",
        manufacturer: "Tokheim",
        model: "Tokheim Quantium 5-Series (510)",
        manual_type: "Maintenance & Installation",
        summary: "Complete service reference for the Tokheim Quantium 510. Covers TQP-HS pump, TQM meter, pulser calibration, VR system, error codes E01-E47, and common fault diagnosis.",
        error_codes: "E01: Low flow — blocked strainer or worn pump | E02: No flow — motor or solenoid fault | E03: Meter fault — pulser disconnected | E04: Calibration error — W&M required | E05: Comms error — RS485 fault | E06: PSU fault — check fuses | E07: VR fault — VR pump not running | E47: General fault — read sub-code",
        component_type: "Dispenser",
        extract_diagrams: true,
        manual_text: `ATEX SAFETY: Zone 1/2 classified equipment. Lockout required before any electrical work. IS circuits never to be worked on live. Use only IS-certified tools. CRITICAL: Always isolate main disconnect before pump work.

SYSTEM OVERVIEW: Tokheim Quantium 510 = 40/80/130 l/min variants. MID certified. 400V 3-phase supply. TQP-HS gear pump, TQM meter with pulser, Durr ATEX VR pump, RS485 comms to POS.

TQP-HS PUMP REMOVAL: (1) Isolate power at main disconnect. (2) Depressurize by running dispenser to empty line. (3) Disconnect 27mm inlet and discharge unions. Cap all pipework immediately. (4) Remove M8 bolts x4 securing pump to motor frame. (5) Lift pump and inspect shaft seal for damage. (6) Belt tension check: 10-12mm deflection at midspan when 5kg pressure applied.

TQM METER REPLACEMENT: (1) W&M recalibration is MANDATORY after any meter replacement. (2) Install new O-rings (part kit provided). (3) Torque meter body connections to 45 Nm. (4) Pulser gap must be 1.5mm ±0.2mm. (5) After installation, run calibration cycle and document in service log.

PULSER (Part 007-270684): IS 2-wire connection. Requires calibration after replacement. Gap tolerance critical: 1.5mm ±0.2mm. If gap <1.2mm or >1.8mm, meter will under/overcount. Check with feeler gauge during annual service.

VR SYSTEM: Durr pump model 900295, ATEX Zone 1 certified. Efficiency test >80% required during commissioning. Vapor return line 6.35mm hose, must be clear of kinks. If VR pump fails, dispenser must shut down (safety interlock).

ERROR CODES E01-E47: E01 Low flow (check strainer, belt tension, pump pressure), E02 No flow (check motor, solenoid, contactor), E03 Meter fault (check pulser connector, IS wiring), E04 Calibration error (W&M recalibration required), E05 Comms error (check RS485 cable, termination), E06 PSU fault (check fuses 10A x2, input voltage 400V ±10%), E07 VR fault (check VR pump running, vapor line clear), E47 General fault (read sub-code from display or comms).

COMMON FAULTS: No flow — check strainer (usually clogged with debris), verify belt tension 10-12mm, and pump pressure >15 bar. Slow dispensing — worn pump or low belt tension. Fuel dripping — faulty solenoid or meter seal leak. VR failing — Durr pump not running or vapor line blocked. Display fault — check comms connector and power supply.

MAINTENANCE SCHEDULE: 6-monthly: Clean strainer (remove bowl, rinse with fuel, inspect screen), check belt tension 10-12mm deflection, verify pulser gap 1.5mm. Annual: Full hydraulic inspection including pump pressure test, meter calibration check, VR efficiency test >80%, all hose inspection for leaks/damage.`
      },
      {
        title: "Gilbarco SK700-2 (MK2 Horizon) — Complete Service Wiki",
        manufacturer: "Gilbarco",
        model: "Gilbarco SK700-2 (MK2)",
        manual_type: "Installation, Commissioning and Maintenance",
        summary: "Complete service reference for the Gilbarco SK700-2 MK2. Covers Horizon/Frontier variants, gerotor meter, ECVR vapour recovery, IS circuits, display PPU, error codes, and parts references.",
        error_codes: "E01: No authorisation — comms fault | E02: Flow error — check pump and strainer | E03: Meter fault — check pulser | E04: VR fault — ECVR efficiency failure | E05: Nozzle fault — check switch gap | E06: Comms fault — 2-wire error | F01: Filter blocked | F02: Belt slip",
        component_type: "Dispenser",
        extract_diagrams: true,
        manual_text: `ATEX SAFETY: Head key 141102026 REQUIRED for any access. Zone 1 hydraulic cabinet — lockout required. Never work on IS circuits live. Only IS-certified test equipment on 2-wire nozzle circuits.

VARIANT IDENTIFICATION: Horizon-2 most common UK installation. MK2 has ECVR (Enhanced Closed VR) and GPU 140 boards. Check model plate on rear cabinet. MK1 lacks ECVR, different belt and motor pulley.

DRIVE BELT SELECTION (CRITICAL): MK1 = 140599446 13x686 for 1.1kW motor. MK2 hi-flow = 140446036 13x695 for 1.5kW motor. Belt tension = 10mm deflection at midspan. Over-tension causes premature failure; under-tension causes belt slip (F02 error).

GEROTOR METER COMPONENTS: Pulsers BR405799-03 (old) or BR405709-03 (new type). Belts 105781 (A760, 0.75kW), 105849 (A780, 1.1kW), CN20012-07 (A800, 1.5kW). Lip seals K82472 (meter inlet) and BK110167-01 (meter outlet) — always replace during pump removal to prevent fuel leaks.

SOLENOID VALVE COIL: 140909506 or 14080481S depending on variant. To replace: (1) Isolate power. (2) Depress latch on coil side and slide coil off valve body. (3) Install new coil, verify click-lock engagement. (4) Test solenoid buzz during priming cycle.

ECVR VR HOSE: 140852556, 4.6m black coaxial hose, vapor return to atmosphere. Check for kinks, cracks, loose connections at Durr pump. Dry break connector (part 901568-001) must seat fully. If VR line blocked, E04 error and efficiency drops below 80%.

NOZZLE SWITCH: 140945945 (new type, preferred). IS 2-wire safety circuit. Gap setting 2-4mm critical — too wide = no lock, too narrow = premature wear. Measure with feeler gauge during annual service.

IS HUB BOARD: 140872785. NEVER connect non-IS equipment to this board. All inputs must be IS-certified to maintain ATEX compliance. Any non-IS wiring voids certification.

CPU/DISPLAY BOARD: CPU 140851986, PPU display 140881998. Document part numbers before ordering replacements (pricing varies by stock). Requires configuration after replacement (site ID, fuel type, limits).

MICROSWITCH: 140788265 — controls pump motor cutoff. If stuck, dispenser will free-run and overfill nozzles.

HOSE RETRACT LOCK: 5500-2427 — prevents hose whip. Inspect for cracks; replace if damaged.

ERROR CODES E01-F02: E01 no auth (check POS comms 2-wire), E02 flow error (check pump belt and strainer), E03 meter fault (check pulser BR405799-03 gap 1.5mm), E04 VR fault (check ECVR efficiency >80%, hose clear), E05 nozzle fault (check nozzle switch gap 2-4mm), E06 comms fault (check 2-wire to POS for loose contacts), F01 filter blocked (clean strainer), F02 belt slip (check tension 10mm, belt wear).

COMMON FAULTS: No flow — check pump belt and strainer (usually clogged). VR failing — ECVR hose blocked or dry break not seated. PPU blank — check power supply and 2-wire to board. Comms fault with POS — check 2-wire connectors for oxidation.

MAINTENANCE SCHEDULE: 6-monthly check belt tension 10mm, clean strainer, verify pulser gap. Annual full inspection including VR efficiency test, all hose connections, nozzle switch gap, metering calibration.`
      },
      {
        title: "Gilbarco Euroline — Complete Service Wiki",
        manufacturer: "Gilbarco",
        model: "Gilbarco Euroline",
        manual_type: "Service and Maintenance",
        summary: "Complete service reference for the Gilbarco Euroline and Highline 2. Covers PUS/Gerotor pump, belt selection by motor kW, CPU board, VR system, and common faults.",
        error_codes: "01: Comms fault | 02: Flow fault — check pump belt and strainer | 03: Meter error — check pulser | 04: VR fault | 05: Authorisation fail | 06: Power fault | 07: Temperature sensor | 08: CPU board fault",
        component_type: "Dispenser",
        extract_diagrams: true,
        manual_text: `ATEX SAFETY: Lockout required before any electrical work. IS circuits must not be energized during service. Use only IS-certified test equipment.

PUS PUMP SYSTEM: Positive displacement pump with internal relief. Motor powers pump via belt drive. Pump pressure typically 15-25 bar. Relief setting 30 bar (non-adjustable, factory set).

BELT SELECTION BY MOTOR KW (CRITICAL):
- 0.75kW motor = A720 belt, part 105849, 10mm tension
- 1.1kW motor = A740 belt, part 105781, 10mm tension
- 1.5kW motor = A770 belt, part CN20012-07, 10mm tension
Alternative: SPZ787 = WM003054 universal replacement, check fit before installation.
Tension = 10mm deflection at midspan with 5kg force. Under-tension causes slip; over-tension causes bearing wear.

GEROTOR METER: Positive displacement meter. Pulser BR405799-03, valve risbridger BN306102-50, filter under pump BN306103-50. Clean strainer filter every 6 months. Meter accuracy ±0.3% (W&M certified).

LIP SEALS (CRITICAL): K82472 (meter inlet) and BK110167-01 (meter outlet) must be replaced during any pump removal work. Old seals will weep fuel. Use OEM seals only. Install dry (no grease). Torque meter connections 45 Nm.

CPU BOARD: BT605732-02ES. EXPENSIVE — document part number and pricing before replacement. Requires full commissioning after install (tank dimensions, fuel type, limits). If board fails, dispenser is non-operational.

MANAGERS KEYPAD: BQ100731-01. Allows access to setup menu and pump test cycles. Default code 1234. If lost, dispenser cannot be serviced.

VR SYSTEM: Durr pump, vapor return line 6.35mm hose. Efficiency must be >80% during commissioning. If VR pump fails, dispenser shuts down (safety interlock). Lip seal on Durr pump critical — if weeping, replace entire pump.

ERROR CODES 01-08: 01 comms fault (check 2-wire to POS), 02 flow fault (check belt tension 10mm, strainer), 03 meter error (check pulser gap 1.5mm), 04 VR fault (check Durr pump running), 05 auth fail (comms with POS), 06 power fault (check supply voltage), 07 temp sensor (check temp sender), 08 CPU board fault (board failure, replacement required).

COMMON FAULTS: 
- Meter over/undercounting: Check pulser gap with feeler gauge (must be 1.5mm ±0.2mm). Check belt slip — tension should be 10mm. Verify fuel type setting in CPU (diesel vs petrol have different meter factors).
- Fuel leak at meter: Replace K82472 and BK110167-01 lip seals. Check union washers (copper washers, replace if crushed). Meter leak = fuel spill hazard and environmental issue.
- PUS not priming: Check strainer for blockage (common after tank sediment). Verify belt tension 10mm — if too slack, pump will slip and not prime. Prime by running pump test cycle from keypad.

MAINTENANCE SCHEDULE: 6-monthly check belt tension 10mm, clean strainer (remove bowl, inspect screen for debris, rinse with fuel). Annual full inspection including pump pressure test 20±2 bar, meter calibration check, VR efficiency test >80%, all hose inspection.`
      },
      {
        title: "Wayne Global Star — Complete Service Wiki",
        manufacturer: "Wayne",
        model: "Wayne Global Star",
        manual_type: "Service and Maintenance",
        summary: "Service reference for the Wayne Global Star dispenser. Covers iMeter/WIP assembly, drive belt, keys, biodiesel filter, and common faults.",
        error_codes: "ERR 01: No flow — check pump belt solenoid | ERR 02: Meter fault — check WIP pulser | ERR 03: Comms error | ERR 04: VR fault",
        component_type: "Dispenser",
        extract_diagrams: false,
        manual_text: `ATEX SAFETY: Lockout required before electrical work. Always depressurize system by running to empty before pump removal.

iMETER ASSEMBLY: Wayne Intelligent Pulser (WIP) integrated into meter body. Eliminates separate pulser — WIP is sealed inside meter. Two calibration doors on meter face. W&M (Weights & Measures) recalibration MANDATORY if WIP is replaced. Meter accuracy ±0.3%.

DRIVE BELT: Global Star WM003055 (preferred) or SPZ787 WM003054 (universal alternative). Tension = 10mm deflection at midspan. Check tension every 6 months. Belt life typically 3-4 years or 2M gallons. Replace if cracked, frayed, or slipping.

KEYS: Two types on Global Star: (1) WM003119 — Global Star cabinet key, grants access to hydraulic section. (2) WU007881 — DW2 Helix dispenser key, opens back panel. Both use same keyway (shared key type) for simplified key management. Never lose keys — obtain replacements from Wayne distributor.

BIODIESEL FILTER: WM005632-003. CRITICAL for B7 and higher biodiesel blends (B7, B10, B20, B100). Biodiesel absorbs water and oxidizes faster than mineral diesel. Replace annually if dispensing B7+. If not replaced, filter clogs and causes ERR 01 (no flow). For mineral diesel (B0-B5), replace every 2 years.

ERROR CODES ERR01-ERR04: ERR01 no flow (check pump belt tension 10mm, check solenoid for buzz during prime), ERR02 meter fault (WIP pulser reading issue — check WIP connector, IS wiring), ERR03 comms error (check 2-wire to POS, loose contacts), ERR04 VR fault (vapor recovery system failure).

COMMON FAULTS:
- Low flow: Check belt tension (should be 10mm). Clean strainer (remove bowl, rinse, inspect). Check solenoid for buzz during prime cycle. If solenoid doesn't buzz, check coil voltage.
- Meter not registering: Check WIP connector for loose pin or corrosion (IS 2-wire). Verify IS wiring integrity. If WIP internal pulsar fails, entire meter must be replaced and W&M recalibrated.
- Noisy dispenser: Check belt tension — too loose causes flap, too tight causes bearing whine. Check cavitation (aeration in fuel) — usually strainer blocked or suction line kinked.

MAINTENANCE SCHEDULE: 6-monthly check belt tension 10mm, clean strainer, inspect hoses for leaks. Annual full inspection including metering calibration check, WIP connector inspection, biodiesel filter replacement (if B7+), VR system check.`
      },
      {
        title: "Veeder-Root TLS-350 and TLS-450 — Complete Service Wiki",
        manufacturer: "GVR",
        model: "GVR TLS350",
        manual_type: "Installation, Setup and Troubleshooting",
        summary: "Complete service reference for Veeder-Root TLS-350 and TLS-450 ATG systems. Covers probe installation, sensor modules, console setup, all alarm codes 0001-9999, and high water troubleshooting.",
        error_codes: "0001: High product | 0002: Low product | 0003: HIGH WATER — tank cleaning required | 0004: Probe fault | 0005: Temp fault | 0006: LEAK ALARM — close dispensers immediately | 0007: Sensor fault | 0008: Battery low replace 578010-695 | 0009: Comms fault | 0011: Sudden loss — check for leak | 0012: Overfill — stop delivery | 9999: System fault restart console",
        component_type: "Tank Gauge",
        extract_diagrams: false,
        manual_text: `IS SAFETY: Level 2/3 certification required. NEVER use non-IS test equipment on probe circuits. NEVER short IS wiring — violates ATEX. Always use IS multimeters (Fluke 1507 or equivalent IS-rated only).

TLS-350 vs TLS-450: TLS-350 = basic ATG with 2 tank support, serial comms. TLS-450 = advanced ATG with 5 tank support, built-in TCP/IP, 5 comm ports (serial x2, Ethernet, modem, phone). Both use same probe and sensor architecture.

CONSOLE SETUP: Power on console. Press MODE key repeatedly to cycle through DISPLAYS > SETUP > ALARM > INVENTORY > REPORTS. In SETUP menu, default PIN is 1234. Key parameters to configure: (1) Tank dimensions (length, width, height in inches), (2) Probe type (ATG Smart Probe or standard probe), (3) Alarm thresholds (high level %, low level %, overfill tolerance), (4) Product type (regular, midgrade, premium, diesel, biodiesel), (5) Ullage offset (tank tilt compensation).

PROBE INSTALLATION: Probe length = tank internal depth + 2 inches (accounts for float rod extension). IS cable polarity is CRITICAL: red = positive, black = negative, shield = shield (must be grounded at riser). Install weatherproof riser seal on probe cable where it exits tank. Probe must hang freely inside tank (no contact with tank sides). Install float rod with ball float at bottom (float indicates product level). Check installation: Console should read current tank height within 0.5 inches of manual dipstick measurement.

SENSOR MODULES (install with console POWERED OFF): (1) Type A Interstitial sensor (for dual-wall tanks) — detects fuel in interstitial space (indicates tank wall breach). Install in dedicated fitting. (2) Type B Groundwater sensor — detects water in groundwater monitoring well. Install via adapter plate. (3) Vapor Sensor — detects fuel vapor above tank (early warning of tank breach). Install in breather pipe. (4) PLLD Line Leak Detection — monitors dispensing lines for unexpected flow. Install in riser house. ALL sensors connect ONLY to IS bay on console — never connect non-IS equipment.

ALL ALARM CODES 0001-9999:
0001: High product (tank level >95%, stop deliveries)
0002: Low product (tank level <10%, order fuel)
0003: HIGH WATER (see water procedure below)
0004: Probe fault (IS cable loose/broken, replace probe)
0005: Temp fault (temperature sensor error, replace sensor)
0006: LEAK ALARM (sudden product loss, CLOSE DISPENSERS IMMEDIATELY, investigate leak)
0007: Sensor fault (Type A/B/Vapor sensor failure)
0008: Battery low (replace 578010-695, note time before removing or lose historical data)
0009: Comms fault (serial/Ethernet connection to POS lost)
0011: Sudden loss (product loss >10 gal in 1 hour, likely leak in line or dispenser)
0012: Overfill (delivery continues past high level alarm, stop delivery)
9999: System fault (CPU error, restart console by power cycle, if persists replace console)

HIGH WATER PROCEDURE (0003 ALARM): Water in fuel tank is CRITICAL — must be addressed. (1) Use water-finding paste 5500-1178 (red paste, changes color in presence of water). (2) Apply paste to bottom 12 inches of dipstick. (3) Lower dipstick to tank bottom, wait 10 seconds, withdraw. (4) If paste color changes (typically blue to pink), water is present. (5) Measure water depth: If >1 inch, tank cleaning required — contact licensed tank cleaning contractor (fuel transferred to truck, tank interior cleaned with absorbent material, new fuel returned). (6) Investigate source: recent deliveries (water in delivery tanker), tank age (corrosion), condensation (humid climate, improper venting). (7) Use water removal pump (separate from fuel pump) — pumps water from tank bottom. DO NOT use fuel pump to remove water (damages pump). (8) After water removal, retest with water-finding paste. (9) If water returns, source is active (leak or condensation) — must be fixed.

CPU BATTERY REPLACEMENT: Part 578010-695. IMPORTANT: Before removing old battery, note current date and time from console. Battery powers real-time clock and historical data memory. If battery removed without power applied, clock resets and historical records lost (can cause reconciliation discrepancies with POS). Replacement procedure: (1) Note date/time. (2) Locate 9V battery compartment inside console. (3) Remove old battery, install new battery (observe polarity). (4) Verify clock still shows correct date/time (if reset, reconfigure). (5) Document battery replacement in service log.

TLS-450 TCP/IP SETUP: Default IP address 192.168.1.100. To configure: Press MODE → SETUP, enter PIN 1234, navigate to COMMS, select ETHERNET. Default gateway 192.168.1.1, subnet mask 255.255.255.0. If using static IP (recommended for fuel sites), assign dedicated IP on site network. If using DHCP, ensure DHCP server is running on site network. Test comms by uploading data from console (Comms → UPLOAD, should show success within 30 seconds if network connected).

COMMON FAULTS:
- No reading on console: Check IS probe cable connection (should click audibly onto console back panel). Test cable with IS multimeter (should read ~4 ohms DC resistance). If cable damaged, replace probe assembly.
- Reconciliation discrepancy (console inventory vs POS sales): Check delivery records (were all deliveries logged?), probe calibration (manual dipstick vs console ±0.5 inch), check for slow leak (monitor overnight: console level should not change >0.1 inch).
- Water alarm but no dipstick water: Probe float contaminated with fuel sludge — clean probe by submersion in clean fuel, air-dry, reinstall.
- Loss of comms (0009 alarm): Check serial cable (TLS-350) or Ethernet cable (TLS-450) connection. For TLS-450, verify network connectivity by pinging console IP address from POS computer.

MAINTENANCE SCHEDULE: Monthly review tank inventory and reconciliation. Quarterly check all sensor connections and IS wiring integrity. Annual probe recalibration (compare console level to manual dipstick measurement ±0.5 inch). Replace battery every 3-5 years (preventive, before failure).`
      }
    ];

    // Create all 5 wiki records
    const results = await base44.asServiceRole.entities.Manual.bulkCreate(wikis);

    return Response.json({
      success: true,
      message: '5 empty wiki records created',
      count: results.length,
      records: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});