/* Shared branding for every PDF the site's tools create (jsPDF, mm units). The PDFs promote CargoKit
   (www.CargoKit.ai) only: no YAM contacts or sales pitch, so other forwarders and agents can use them freely.
   YAMBrand.ready() loads the logo and QR code; header()/footer() draw the bands; finish() adds page numbers. */
(function (G) {
  'use strict';
  var B = G.YAMBrand = {
    name: 'CargoKit',
    tag: 'Free container load planner and shipping tools',
    web: 'www.CargoKit.ai',
    contacts: 'Free tools for shippers, forwarders and agents. No sign-up. On the web and on Android.',
    by: 'Made free with CargoKit',
    HEAD: 22, FOOT: 15
  };
  var P = null;
  function load(src, w, ratio) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () {
        var nw = im.naturalWidth || w, nh = im.naturalHeight || w * ratio;
        var c = document.createElement('canvas'); c.width = w; c.height = Math.round(w * nh / nw);
        var x = c.getContext('2d'); x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        res({ d: c.toDataURL('image/png'), r: c.height / c.width });
      };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }
  B.ready = function () {
    if (!P) P = Promise.all([load((B.base || '') + 'cargokit-logo.svg', 512, 1), load((B.base || '') + 'cargokit-qr.png', 420, 1)]).then(function (a) { B.logo = a[0]; B.qr = a[1]; return B; });
    return P;
  };
  function size(doc) { var s = doc.internal.pageSize; return { W: s.getWidth(), H: s.getHeight() }; }

  // Top band: big logo, company name, tagline; document title and website on the right.
  B.header = function (doc, title, sub) {
    var z = size(doc), M = 10, h = B.HEAD;
    doc.setFillColor(255, 255, 255); doc.rect(0, 0, z.W, h, 'F');
    var lw = 0;
    if (B.logo) { var lh = 15; lw = lh / B.logo.r; doc.addImage(B.logo.d, 'PNG', M, 3.5, lw, lh); }
    var tx = M + lw + 4;
    doc.setTextColor(11, 42, 74); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(B.name, tx, 10.2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(94, 120, 145); doc.text(B.tag, tx, 15);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(10, 108, 194); doc.text(B.web, tx, 19.2);
    if (title) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(10, 108, 194);
      doc.text(String(title), z.W - M, 10, { align: 'right' });
    }
    if (sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(94, 120, 145); doc.text(String(sub), z.W - M, 15, { align: 'right' }); }
    doc.setFillColor(10, 108, 194); doc.rect(0, h, z.W, 1.1, 'F');
    doc.setFillColor(255, 201, 60); doc.rect(0, h + 1.1, z.W, 0.6, 'F');
    doc.setTextColor(11, 42, 74); doc.setFont('helvetica', 'normal');
  };

  // Bottom band: navy strip with contacts, website and a QR code to the site.
  B.footer = function (doc, note) {
    var z = size(doc), M = 10, h = B.FOOT, y0 = z.H - h;
    if (note) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(94, 120, 145); doc.text(String(note), M, y0 - 2); }
    doc.setFillColor(11, 42, 74); doc.rect(0, y0, z.W, h, 'F');
    doc.setFillColor(255, 201, 60); doc.rect(0, y0, z.W, 0.6, 'F');
    var qx = z.W - M - 12;
    if (B.qr) { doc.setFillColor(255, 255, 255); doc.rect(qx - 0.6, y0 + 1.4, 13.2, 13.2, 'F'); doc.addImage(B.qr.d, 'PNG', qx, y0 + 2, 12, 12); }
    doc.setTextColor(255, 201, 60); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(B.web, M, y0 + 6.6);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(B.contacts, M, y0 + 11.6);
    doc.setFontSize(7); doc.setTextColor(200, 214, 230); doc.text(B.by, qx - 3, y0 + 6.6, { align: 'right' });
    doc.text('Scan for more free tools and tracking', qx - 3, y0 + 10, { align: 'right' });
    doc.link(0, y0, z.W, h, { url: 'https://cargokit.ai/' });
    doc.setTextColor(11, 42, 74);
  };

  // Call-to-action panel for spare space on a page. Returns the height used.
  B.promo = function (doc, x, y, w) {
    var h = 30;
    doc.setFillColor(234, 243, 252); doc.roundedRect(x, y, w, h, 2, 2, 'F');
    doc.setFillColor(10, 108, 194); doc.rect(x, y, 1.6, h, 'F');
    doc.setTextColor(11, 42, 74); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('More free tools on CargoKit', x + 7, y + 8.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(43, 66, 92);
    doc.text('3D container and truck load planner, pallet and CBM calculator, HSN code finder, import duty calculator,', x + 7, y + 15);
    doc.text('B/L and AWB draft maker, invoice and packing list maker, DG and lithium battery checks, and tracking.', x + 7, y + 20);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 108, 194);
    doc.text('Free, no sign-up: www.CargoKit.ai   |   on the web and on Android', x + 7, y + 26);
    doc.link(x, y, w, h, { url: 'https://cargokit.ai/' });
    doc.setTextColor(11, 42, 74); doc.setFont('helvetica', 'normal');
    return h;
  };

  // Page numbers in the top band of every page.
  B.finish = function (doc) {
    var n = doc.getNumberOfPages(), z = size(doc);
    for (var i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(94, 120, 145);
      doc.text('Page ' + i + ' of ' + n, z.W - 10, 19.2, { align: 'right' });
    }
    doc.setProperties({ author: B.by, creator: B.name + ' (' + B.web + ')' });
  };
})(window);
