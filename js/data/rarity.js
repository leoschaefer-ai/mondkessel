// Seltenheiten & Währungen – gelten für ALLES Sammelbare
window.PF = window.PF || {};

PF.RARITY = [
  { id: 'common',    name: 'Gewöhnlich',   color: '#c3c7cc', glow: 'rgba(200,205,210,0.55)', weight: 60, bonus: 0.05, mult: 1 },
  { id: 'uncommon',  name: 'Ungewöhnlich', color: '#5fe39a', glow: 'rgba(80,230,140,0.6)',  weight: 25, bonus: 0.10, mult: 1.6 },
  { id: 'rare',      name: 'Selten',       color: '#5fb0ff', glow: 'rgba(80,160,255,0.65)', weight: 10, bonus: 0.18, mult: 2.6 },
  { id: 'epic',      name: 'Episch',       color: '#c47bff', glow: 'rgba(190,110,255,0.7)', weight: 4,  bonus: 0.30, mult: 4.5 },
  { id: 'legendary', name: 'Legendär',     color: '#ffbf3f', glow: 'rgba(255,190,60,0.8)',  weight: 1,  bonus: 0.50, mult: 8 },
];

PF.CURRENCIES = {
  gold:      { name: 'Gold',        icon: 'currency/0_0', color: '#ffd36b', desc: 'Aus Trankverkäufen. Für Maschinen, Bänder, Beete.' },
  moonstone: { name: 'Mondsteine',  icon: 'currency/1_0', color: '#c47bff', desc: 'Premium. Truhen, epische & legendäre Ausrüstung, Skins.' },
  stardust:  { name: 'Sternenstaub', icon: 'currency/2_0', color: '#7fc4ff', desc: 'Aus seltenen Tränken. Für Forschung & Rezepte.' },
  soul:      { name: 'Seelenessenz', icon: 'currency/3_0', color: '#6dffa8', desc: 'Durch Wiedergeburt. Dauerhafter Bonus auf alles.' },
  bossSeal:  { name: 'Boss-Siegel', icon: 'currency/4_0', color: '#ff5a5a', desc: 'Nur von Boss-Kunden. Für den Boss-Laden.' },
};
PF.CURRENCY_ORDER = ['gold', 'moonstone', 'stardust', 'soul', 'bossSeal'];
