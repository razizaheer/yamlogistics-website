const NUMS = ['MSKU1234565', '176-12345675', 'MAEU123456789', 'MSKU1234566', 'XYZ'];
module.exports = async (H) => {
  const { pg } = H;
  await H.monkey(1);
  for (const n of NUMS) {
    try {
      await pg.fill('#ms-n', n); await pg.fill('#ms-l', 'Order 4521'); await pg.fill('#ms-t', 'note'); await pg.fill('#ms-e', '2026-12-01');
      await pg.click('#ms-add'); await H.wait(700);
    } catch (e) { console.error(n, e.message); }
  }
  await H.monkey(2);
  await pg.reload(); await H.wait(1500);
  await H.monkey(1);
};
