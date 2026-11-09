module.exports = async (H) => {
  const { pg } = H;
  const box = async () => pg.$('#hf-q');
  let i = await box();
  if (i) { await i.fill('phone'); await i.dispatchEvent('input'); await H.wait(600); } // before ack
  await H.monkey(1);
  for (const q of ['', 'zzqxv', '85', '8517', '851712', 'cotton shirt', 'parts of pump', 'rice', 'gold jewellery', 'tea']) {
    i = await box(); if (!i) break;
    await i.fill(q); await i.dispatchEvent('input'); await H.wait(700);
    const chips = await pg.$$('main .hf-chs button:visible, main .hf-chip:visible');
    for (const c of chips.slice(0, 40)) { try { await c.click({ timeout: 400 }); await H.wait(150); } catch (e) {} }
  }
  i = await box(); await i.fill(''); await i.dispatchEvent('input'); await H.wait(500);
  const n = (await pg.$$('main .hf-chs button')).length;
  for (let k = 0; k < n; k++) {
    const bs = await pg.$$('main .hf-chs button'); if (!bs[k]) break;
    try { await bs[k].click({ timeout: 400 }); await H.wait(150); } catch (e) {}
    i = await box(); await i.fill(''); await i.dispatchEvent('input'); await H.wait(200);
  }
};
