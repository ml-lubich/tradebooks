import { StarterTemplate } from '@/types';

const hvacTemplate: StarterTemplate = {
  name: 'HVAC Starter Pricebook',
  categories: [
    {
      name: 'AC Repair',
      parts: [
        { name: 'Capacitor Replacement', cost: 15, labor_minutes: 45 },
        { name: 'Contactor Replacement', cost: 25, labor_minutes: 30 },
        { name: 'Condensate Drain Cleaning', cost: 5, labor_minutes: 30 },
        { name: 'Refrigerant Recharge (per lb)', cost: 50, labor_minutes: 60 },
        { name: 'Thermostat Wire Repair', cost: 10, labor_minutes: 45 },
      ],
    },
    {
      name: 'Furnace Repair',
      parts: [
        { name: 'Igniter Replacement', cost: 35, labor_minutes: 45 },
        { name: 'Flame Sensor Cleaning', cost: 5, labor_minutes: 30 },
        { name: 'Blower Motor Replacement', cost: 250, labor_minutes: 120 },
        { name: 'Gas Valve Replacement', cost: 200, labor_minutes: 90 },
        { name: 'Heat Exchanger Inspection', cost: 0, labor_minutes: 60 },
      ],
    },
    {
      name: 'Ductwork',
      parts: [
        { name: 'Duct Sealing (per joint)', cost: 5, labor_minutes: 20 },
        { name: 'Flex Duct Replacement (per run)', cost: 30, labor_minutes: 60 },
        { name: 'Register/Grille Replacement', cost: 15, labor_minutes: 20 },
        { name: 'Duct Insulation (per linear ft)', cost: 3, labor_minutes: 15 },
      ],
    },
    {
      name: 'Thermostats',
      parts: [
        { name: 'Basic Thermostat Install', cost: 30, labor_minutes: 45 },
        { name: 'Programmable Thermostat Install', cost: 75, labor_minutes: 60 },
        { name: 'Smart Thermostat Install', cost: 200, labor_minutes: 90 },
        { name: 'Thermostat Relocation', cost: 40, labor_minutes: 120 },
      ],
    },
    {
      name: 'Maintenance',
      parts: [
        { name: 'AC Tune-Up', cost: 10, labor_minutes: 60 },
        { name: 'Furnace Tune-Up', cost: 10, labor_minutes: 60 },
        { name: 'Filter Replacement', cost: 15, labor_minutes: 15 },
        { name: 'Coil Cleaning', cost: 20, labor_minutes: 45 },
        { name: 'Full System Inspection', cost: 0, labor_minutes: 90 },
      ],
    },
  ],
};

const plumbingTemplate: StarterTemplate = {
  name: 'Plumbing Starter Pricebook',
  categories: [
    {
      name: 'Water Heaters',
      parts: [
        { name: 'Tank Water Heater Install (40 gal)', cost: 400, labor_minutes: 180 },
        { name: 'Tankless Water Heater Install', cost: 800, labor_minutes: 240 },
        { name: 'Anode Rod Replacement', cost: 30, labor_minutes: 60 },
        { name: 'T&P Valve Replacement', cost: 20, labor_minutes: 45 },
        { name: 'Water Heater Flush', cost: 0, labor_minutes: 45 },
      ],
    },
    {
      name: 'Drain Cleaning',
      parts: [
        { name: 'Drain Snake (main line)', cost: 10, labor_minutes: 60 },
        { name: 'Drain Snake (secondary)', cost: 5, labor_minutes: 45 },
        { name: 'Hydro Jetting', cost: 50, labor_minutes: 90 },
        { name: 'Clean-Out Installation', cost: 30, labor_minutes: 60 },
        { name: 'Camera Inspection', cost: 0, labor_minutes: 45 },
      ],
    },
    {
      name: 'Fixtures',
      parts: [
        { name: 'Faucet Installation', cost: 80, labor_minutes: 60 },
        { name: 'Toilet Installation', cost: 150, labor_minutes: 90 },
        { name: 'Garbage Disposal Install', cost: 120, labor_minutes: 60 },
        { name: 'Shower Valve Replacement', cost: 60, labor_minutes: 120 },
        { name: 'Hose Bib Replacement', cost: 20, labor_minutes: 45 },
      ],
    },
    {
      name: 'Pipe Repair',
      parts: [
        { name: 'Copper Pipe Repair (per joint)', cost: 15, labor_minutes: 45 },
        { name: 'PEX Repipe (per fixture)', cost: 30, labor_minutes: 60 },
        { name: 'Pipe Insulation (per linear ft)', cost: 3, labor_minutes: 15 },
        { name: 'Shut-Off Valve Replacement', cost: 20, labor_minutes: 30 },
        { name: 'Sump Pump Install', cost: 200, labor_minutes: 120 },
      ],
    },
  ],
};

const electricalTemplate: StarterTemplate = {
  name: 'Electrical Starter Pricebook',
  categories: [
    {
      name: 'Outlets & Switches',
      parts: [
        { name: 'Outlet Replacement', cost: 5, labor_minutes: 30 },
        { name: 'GFCI Outlet Install', cost: 15, labor_minutes: 45 },
        { name: 'Dimmer Switch Install', cost: 25, labor_minutes: 30 },
        { name: 'USB Outlet Install', cost: 20, labor_minutes: 35 },
        { name: 'Whole House Surge Protector', cost: 80, labor_minutes: 60 },
      ],
    },
    {
      name: 'Panels',
      parts: [
        { name: 'Breaker Replacement', cost: 15, labor_minutes: 30 },
        { name: 'Panel Inspection', cost: 0, labor_minutes: 60 },
        { name: 'Sub-Panel Install', cost: 200, labor_minutes: 180 },
        { name: '200 Amp Panel Upgrade', cost: 500, labor_minutes: 480 },
        { name: 'AFCI Breaker Install', cost: 40, labor_minutes: 45 },
      ],
    },
    {
      name: 'Wiring',
      parts: [
        { name: 'New Circuit Run', cost: 30, labor_minutes: 120 },
        { name: 'Junction Box Install', cost: 10, labor_minutes: 45 },
        { name: 'Wire Splice Repair', cost: 5, labor_minutes: 30 },
        { name: 'Dedicated Appliance Circuit', cost: 40, labor_minutes: 90 },
        { name: 'Attic/Crawl Wire Run', cost: 50, labor_minutes: 150 },
      ],
    },
    {
      name: 'Lighting',
      parts: [
        { name: 'Light Fixture Install', cost: 30, labor_minutes: 45 },
        { name: 'Recessed Light Install', cost: 40, labor_minutes: 60 },
        { name: 'Ceiling Fan Install', cost: 80, labor_minutes: 75 },
        { name: 'Under-Cabinet Lighting', cost: 60, labor_minutes: 90 },
        { name: 'Outdoor Light Install', cost: 50, labor_minutes: 60 },
      ],
    },
    {
      name: 'Generators',
      parts: [
        { name: 'Portable Generator Hookup', cost: 100, labor_minutes: 120 },
        { name: 'Transfer Switch Install', cost: 300, labor_minutes: 240 },
        { name: 'Whole House Generator Install', cost: 5000, labor_minutes: 480 },
        { name: 'Generator Maintenance', cost: 20, labor_minutes: 60 },
      ],
    },
  ],
};

const templates: Record<string, StarterTemplate> = {
  hvac: hvacTemplate,
  plumbing: plumbingTemplate,
  electrical: electricalTemplate,
};

export function getTemplateForTrade(trade: string): StarterTemplate | null {
  return templates[trade] ?? null;
}
