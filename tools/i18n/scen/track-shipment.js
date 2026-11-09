const NUMS = ['MSKU1234565', 'MSKU1234566', 'MSKU 123456 5', '176-12345675', '17612345676', '020-12345675', '235-11111111', '999-12345675', 'MAEU123456789', 'MEDUAB123456', 'HLCUBO1234567', 'ONEYDELA12345600', 'COSU6123456780', 'EGLV123456789012', 'CMDU1234567', 'ABC', '12345', 'ZZZZ99999999', 'OOLU1234567890', 'ZIMUNYC123456'];
module.exports = async (H) => {
  const { pg } = H;
  for (const n of NUMS) {
    try {
      await pg.fill('#tk-q', n); await pg.click('#tk-go'); await H.wait(900);
      const bs = await pg.$$('#tk-res button:visible');
      for (const b of bs.slice(0, 12)) { try { await b.click({ timeout: 400, noWaitAfter: true }); await H.wait(150); } catch (e) {} }
    } catch (e) { console.error(n, e.message); }
  }
  await H.monkey(1);
};
