/* ===== Starbases (R1.1) ===== */
// [R1.1A] The five starbases (Federation, Klingon, Kzinti, Gorn, Romulan). Y168 is the assumed year (SG8.2): 50 shield boxes a facing, BPV 600. The Y170 refit (+50 BPV) makes the shields 70 boxes (limited aegis, D13.4) and the Y175 refit (+25) makes them 80 (full aegis, D13.0). The SSD shows 8 extra armour boxes for each refit as well.
const SBK_=['SBF','SBK','SBZ','SBG','SBR'],isSB=k=>SBK_.includes(k);
SBK_.forEach(k=>{const [a,b]=SBR_REFITS[k];REFITS[k]=[
 {id:'y170',n:'Y170 refit: shields 70 boxes each, 8 more armour boxes, limited aegis (R1.1A)',pv:50,g:a},
 {id:'y175',n:'Y175 refit: shields 80 boxes each, 8 more armour boxes, full aegis (R1.1A)',pv:25,req:'y170',g:b}]});
// [FD3.8, E5.53, R1.1A] Type-H starbase drone racks (five magazines: 20 drone spaces here, the type-VI magazine is not modelled), ADD-30 launchers (five six-round magazines), and seeking-weapon control equal to double the sensor rating (R1.1A).
const _rfdSB=refitDef;refitDef=function(key,ids){const d=_rfdSB(key,ids);if(isSB(key)){d.rackT=Array((d.sys.Drone||0)).fill('H');d.addT=Array((d.sys.Add||0)).fill(30);d.ctl2=true;d.awr=true}return d} // [R1.1A, H4.3] the module AWR boxes are hit on APR damage and can arm photons; every power box is treated as AWR-capable here (see the backlog);
SBK_.forEach(k=>{SIL[k]=SIL.BATS}); // map token: the Battle Station silhouette stands in until a Starbase drawing is made (see the backlog)
