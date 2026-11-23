// 불멍 위젯: 스테인리스 화로대 + 장작 + 셰이더 불꽃. 배경은 투명.
(function () {
  'use strict';
  var W = window.widget || { setIgnore: function () {}, menu: function () {}, drag: function () {}, dragEnd: function () {}, settings: function () { return Promise.resolve({}); }, onSettings: function () {}, onWood: function () {}, shotFile: '' };
  var cv = document.getElementById('cv'), tipEl = document.getElementById('tip');
  var renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .5, 60);
  cam.position.set(0, 3.6, 10.4); cam.lookAt(0, 2.05, 0);
  function resize() { var w = window.innerWidth, h = window.innerHeight; renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  window.addEventListener('resize', resize); resize();

  // ---- 조명과 반사 환경 (스테인리스가 비칠 것)
  var envScene = new THREE.Scene(); envScene.background = new THREE.Color(0x0b0d12);
  function panel(c, w, h, x, y, z) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); }
  panel(0xdfe8f4, 9, 5, -3, 12, 2); panel(0x6c7890, 6, 9, -12, 3, 5); panel(0x30384a, 6, 9, 12, 3, 5); panel(0xffa860, 4, 4, 0, 2, 10); panel(0x8a8780, 30, 30, 0, -8, 0); panel(0xc8ccd2, 8, 3, 0, -3, 10);
  var pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(envScene, .03).texture;
  var amb = new THREE.HemisphereLight(0xdfe8ff, 0x3a322a, .35); scene.add(amb);
  var key = new THREE.DirectionalLight(0xfff4e6, .5); key.position.set(-4, 8, 6); scene.add(key);
  var fireLight = new THREE.PointLight(0xff8a3a, 3, 12, 2); fireLight.position.set(0, 1.9, .2); fireLight.castShadow = true; fireLight.shadow.mapSize.set(512, 512); fireLight.shadow.bias = -.01;

  // ---- 텍스처를 코드로 그린다
  function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
  function barkTex(seed, fresh) {
    return tex(256, 512, function (g, w, h) {
      var r = rnd(seed); g.fillStyle = fresh ? '#7a5a3c' : '#4a3423'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 520; i++) { var x = r() * w, y = r() * h, l = 30 + r() * 150, v = r(); g.strokeStyle = v < .5 ? 'rgba(22,14,8,' + (.25 + r() * .5) + ')' : 'rgba(134,100,66,' + (.12 + r() * .25) + ')'; g.lineWidth = 1 + r() * 4; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (r() - .5) * 14, y + l * .3, x + (r() - .5) * 14, y + l * .7, x + (r() - .5) * 10, y + l); g.stroke(); }
      for (var j = 0; j < 2600; j++) { g.fillStyle = 'rgba(' + (r() < .5 ? '0,0,0' : '170,130,90') + ',' + (r() * .18) + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 3); }
      if (fresh) return;
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(6,5,4,.97)'); gr.addColorStop(.3, 'rgba(10,8,6,.8)'); gr.addColorStop(.52, 'rgba(20,14,9,.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);   // 불 쪽 끝은 그을림
    });
  }
  function emberTex(seed) {
    var t = tex(256, 512, function (g, w, h) {
      var r = rnd(seed); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 150; i++) { var x = r() * w, y = Math.pow(r(), 1.8) * h * .55, l = 8 + r() * 46; g.strokeStyle = 'rgba(255,' + Math.floor(70 + r() * 120) + ',20,' + (.35 + r() * .65) + ')'; g.lineWidth = .8 + r() * 3.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 26, y + l * (r() - .3)); g.stroke(); }
      for (var j = 0; j < 40; j++) { var cx = r() * w, cy = Math.pow(r(), 2) * h * .4, rad = 6 + r() * 22, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad); gr.addColorStop(0, 'rgba(255,150,40,.7)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
    });
    return t;
  }
  var endTex = tex(128, 128, function (g, w, h) {
    g.fillStyle = '#b08a5a'; g.fillRect(0, 0, w, h);
    for (var i = 1; i < 16; i++) { g.strokeStyle = 'rgba(92,62,34,' + (.25 + (i % 3) * .14) + ')'; g.lineWidth = 1 + (i % 2); g.beginPath(); g.ellipse(w / 2 + Math.sin(i) * 3, h / 2 + Math.cos(i * 1.3) * 3, i * 4, i * 3.7, 0, 0, 6.283); g.stroke(); }
    var gr = g.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, w * .62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,12,6,.75)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var steelTex = tex(256, 256, function (g, w, h) {
    var r = rnd(7); g.fillStyle = '#b9bcc0'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 1400; i++) { g.strokeStyle = 'rgba(' + (r() < .5 ? '255,255,255' : '60,62,66') + ',' + (r() * .1) + ')'; g.lineWidth = 1; var y = r() * h, x = r() * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 90, y + (r() - .5) * 2); g.stroke(); }
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.55, 'rgba(70,40,14,.3)'); gr.addColorStop(1, 'rgba(12,9,7,.72)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);   // 아래로 갈수록 그을음과 열변색
    for (var j = 0; j < 30; j++) { var cx = r() * w, cy = h * (.35 + r() * .4), rad = 10 + r() * 30, rg = g.createRadialGradient(cx, cy, 0, cx, cy, rad); rg.addColorStop(0, 'rgba(60,70,140,.22)'); rg.addColorStop(1, 'rgba(120,70,20,0)'); g.fillStyle = rg; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
  });

  var fireG = new THREE.Group(); scene.add(fireG);   // 장작·불꽃 묶음: 화로대 모양에 따라 높이와 크기만 바뀐다
  // ---- 화로대 (역피라미드 스테인리스)
  var pit = new THREE.Group(); scene.add(pit);
  var YB = .78, PX = -1.45;   // PX: 화로대가 놓이는 가로 위치 (오른쪽은 장작 더미와 도끼 자리)
  var steel = new THREE.MeshStandardMaterial({ map: steelTex, color: 0xb4b7bc, metalness: .95, roughness: .3, envMapIntensity: 1.3 });
  var soot = new THREE.MeshStandardMaterial({ color: 0x17130f, metalness: .3, roughness: .85, side: THREE.BackSide, envMapIntensity: .2 });
  var black = new THREE.MeshStandardMaterial({ color: 0x1d1e21, metalness: .75, roughness: .48, envMapIntensity: .9 });
  var bronze = new THREE.MeshStandardMaterial({ color: 0x7a4a2c, metalness: .8, roughness: .45 });
  var rustTex = tex(256, 256, function (g, w, h) { var r = rnd(21); g.fillStyle = '#7d4526'; g.fillRect(0, 0, w, h); for (var i = 0; i < 900; i++) { var cx = r() * w, cy = r() * h, rad = 3 + r() * 22, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad); gr.addColorStop(0, 'rgba(' + (r() < .5 ? '150,84,40' : '70,36,20') + ',' + (.1 + r() * .22) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); } });
  var rust = new THREE.MeshStandardMaterial({ map: rustTex, metalness: .35, roughness: .82, envMapIntensity: .5 });
  var hot = new THREE.MeshBasicMaterial({ color: 0xff7a22, side: THREE.BackSide, toneMapped: false });   // 구멍 사이로 비치는 안쪽 불빛
  function holeTex(kind) {
    var t = tex(256, 128, function (g, w, h) {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000';
      if (kind === 'hex') { for (var r = 0; r < 2; r++) for (var c = 0; c < 5; c++) { var cx = 26 + c * 51 + (r ? 25 : 0), cy = 36 + r * 56; if (cx > w - 20) continue; g.beginPath(); for (var k = 0; k < 6; k++) { var a = k / 6 * 6.283 + .52; g.lineTo(cx + Math.cos(a) * 21, cy + Math.sin(a) * 21); } g.fill(); } }
      else if (kind === 'dot') { for (var r2 = 0; r2 < 3; r2++) for (var c2 = 0; c2 < 4; c2++) { g.beginPath(); g.arc(40 + c2 * 58 + (r2 % 2 ? 10 : -10), 26 + r2 * 38, 9, 0, 6.283); g.fill(); } }
      else { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 2.2; for (var x = 0; x <= w; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (var y = 0; y <= h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
    }); t.encoding = THREE.LinearEncoding; return t;
  }
  function holed(base, kind) { var m = base.clone(); m.alphaMap = holeTex(kind); m.side = THREE.DoubleSide; if (kind === 'mesh') { m.transparent = true; m.depthWrite = false; m.alphaMap.repeat.set(3, 5); } else m.alphaTest = .5; return m; }
  // n각 뿔대 벽 (위 반지름, 아래 반지름, 위 높이, 아래 높이)
  function wall(n, rT, rB, yT, yB, mat, rot, cap) {
    var p = [], uv = [], idx = [], ro = rot || 0;
    for (var i = 0; i < n; i++) { var a0 = i / n * 6.2832 + ro, a1 = (i + 1) / n * 6.2832 + ro, k = p.length / 3;
      p.push(Math.cos(a0) * rT, yT, Math.sin(a0) * rT, Math.cos(a1) * rT, yT, Math.sin(a1) * rT, Math.cos(a1) * rB, yB, Math.sin(a1) * rB, Math.cos(a0) * rB, yB, Math.sin(a0) * rB);
      uv.push(0, 1, 1, 1, 1, 0, 0, 0); idx.push(k, k + 1, k + 2, k, k + 2, k + 3); }
    if (cap) { var c = p.length / 3; p.push(0, yB, 0); uv.push(.5, 0); for (var j = 0; j < n; j++) { var b0 = j / n * 6.2832 + ro, b1 = (j + 1) / n * 6.2832 + ro, q = p.length / 3; p.push(Math.cos(b0) * rB, yB, Math.sin(b0) * rB, Math.cos(b1) * rB, yB, Math.sin(b1) * rB); uv.push(0, 0, 1, 0); idx.push(c, q, q + 1); } }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    var m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; pit.add(m); return m;
  }
  function bx(w, h, d, mat, x, y, z, rx, rz) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (rx) m.rotation.x = rx; if (rz) m.rotation.z = rz; m.castShadow = true; pit.add(m); return m; }
  function rod(len, r, mat, x, y, z, rx, rz, ry) { var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; pit.add(m); return m; }
  var legM = new THREE.MeshStandardMaterial({ color: 0x7d8086, metalness: .95, roughness: .35 });
  function rod2(a, b, r, mat) { var A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.position.copy(A).add(B).multiplyScalar(.5); m.castShadow = true; pit.add(m); }
  var PITS = [
    { floor: .78, scale: 1, cam: [3.6, 10.4, 2.05], build: function () {            // 접이식 육각 스테인리스
      wall(6, 1.62, .55, 1.5, .78, steel, .5236, true); wall(6, 1.6, .54, 1.49, .79, soot, .5236, true);
      for (var i = 0; i < 6; i++) { var a = i / 6 * 6.2832 + .5236, a2 = a + 1.0472, c = Math.cos(a), s = Math.sin(a); if (i % 2 === 0) rod2([c * .62, .86, s * .62], [c * 1.3, .03, s * 1.3], .032, legM); rod2([c * 1.3, .03, s * 1.3], [Math.cos(a2) * 1.3, .03, Math.sin(a2) * 1.3], .026, legM); if (i % 2 === 0) rod2([c * 1.5, 1.38, s * 1.5], [c * 1.3, .03, s * 1.3], .026, legM); }
    } },
    { floor: 1.22, scale: .95, cam: [3.7, 10.8, 2.15], build: function () {         // 타공 박스형 (코르텐)
      wall(4, 1.92, 1.92, 1.2, .22, rust, .7854); bx(2.7, .06, 2.7, rust, 0, 1.2, 0);
      wall(4, 1.74, 1.74, 1.78, 1.2, holed(rust, 'hex'), .7854); wall(4, 1.7, 1.7, 1.76, 1.2, hot, .7854);
      bx(.5, .5, .06, rust, 0, .5, 1.38);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (q) { bx(.14, .22, .14, black, q[0] * 1.15, .11, q[1] * 1.15); });
    } },
    { floor: .86, scale: 1, cam: [3.6, 10.4, 2.05], build: function () {            // 팔각 타공형 (흑색)
      wall(8, 1.58, 1.32, 1.62, .74, holed(black, 'dot'), .3927); wall(8, 1.54, 1.28, 1.6, .76, hot, .3927, true);
      wall(8, 1.32, 1.32, .76, .7, black, .3927, true);
      for (var i = 0; i < 4; i++) { var a = i / 4 * 6.2832 + .7854; bx(.09, 1.0, .3, black, Math.cos(a) * 1.3, .42, Math.sin(a) * 1.3).rotation.y = -a; }
      rod(.5, .03, black, -1.62, 1.5, 0, Math.PI / 2);
    } },
    { floor: .72, scale: .78, cam: [3.4, 10.2, 1.9], build: function () {           // 창 달린 박스형
      var w = 2.9, d = 1.5, y0 = .62, y1 = 1.72, hh = y1 - y0, yc = (y0 + y1) / 2;
      bx(w, .06, d, black, 0, y0, 0); bx(w, hh, .05, black, 0, yc, -d / 2); bx(.05, hh, d, black, -w / 2, yc, 0); bx(.05, hh, d, black, w / 2, yc, 0);
      bx(w, .22, .05, black, 0, y1 - .11, d / 2); bx(w, .2, .05, black, 0, y0 + .1, d / 2); bx(.3, hh, .05, black, -w / 2 + .15, yc, d / 2); bx(1.0, hh, .05, black, w / 2 - .5, yc, d / 2);
      var glass = new THREE.Mesh(new THREE.PlaneGeometry(1.62, hh - .4), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .16, roughness: .04, metalness: 0, envMapIntensity: 2 })); glass.position.set(-.34, yc, d / 2 + .001); glass.renderOrder = 30; pit.add(glass);
      for (var k = 0; k < 4; k++) rod(.07, .035, steel, w / 2 - .95, y0 + .3 + k * .2, d / 2 + .03, Math.PI / 2);
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) { bx(.08, .75, .34, black, q[0] * 1.05, .3, q[1] * .5, 0, q[0] * .35); });
    } },
    { floor: .8, scale: .6, cam: [3.9, 13.2, 2.25], build: function () {            // 지붕 달린 정원 난로형
      rod(.36, 1.62, black, 0, .5, 0).geometry = new THREE.CylinderGeometry(1.62, 1.62, .36, 28); rod(.1, 1.7, bronze, 0, .72, 0).geometry = new THREE.CylinderGeometry(1.7, 1.7, .08, 28); rod(.1, 1.7, bronze, 0, .3, 0).geometry = new THREE.CylinderGeometry(1.7, 1.7, .06, 28);
      for (var i = 0; i < 3; i++) { var a = i / 3 * 6.2832 + .52; bx(.5, .32, .32, black, Math.cos(a) * 1.25, .16, Math.sin(a) * 1.25).rotation.y = -a; }
      var scr = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 1.85, 28, 1, true), holed(black, 'mesh')); scr.position.y = 1.68; scr.renderOrder = 28; pit.add(scr);
      for (var j = 0; j < 4; j++) { var b = j / 4 * 6.2832 + .7854; bx(.16, 1.9, .16, black, Math.cos(b) * 1.48, 1.68, Math.sin(b) * 1.48).rotation.y = -b; }
      rod(.1, 1.56, bronze, 0, 2.62, 0).geometry = new THREE.CylinderGeometry(1.56, 1.56, .08, 28);
      var roof = new THREE.Mesh(new THREE.CylinderGeometry(.55, 2.05, .95, 28), black); roof.position.y = 3.12; roof.castShadow = true; pit.add(roof);
      var neck = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .34, 20, 1, true), holed(black, 'mesh')); neck.position.y = 3.76; neck.renderOrder = 28; pit.add(neck);
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(.12, .68, .3, 20), black); cap.position.y = 4.07; pit.add(cap);
      var fin = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), black); fin.position.y = 4.3; pit.add(fin);
    } }
  ];
  var pitIdx = -1, pitScale = 1;
  function setPit(i) {
    i = Math.max(0, Math.min(PITS.length - 1, i | 0)); if (i === pitIdx) return; pitIdx = i;
    while (pit.children.length) pit.remove(pit.children[0]);
    var P = PITS[i]; P.build(); pitScale = P.scale;
    fireG.scale.setScalar(P.scale); fireG.position.set(PX, P.floor - YB * P.scale, 0); pit.position.x = PX;
    cam.position.set(0, P.cam[0] + 3.1, P.cam[1] * 1.3); cam.lookAt(0, P.cam[2] + .75, 0);
  }

  fireG.add(fireLight);
  // ---- 장작: 더미에서 끌어다 넣고, 불이 붙고, 타서 숯이 된다
  var WOOD = {
    oak: { name: '참나무', life: 420, light: 12, spark: .5, rad: .2, tint: 0xffffff },
    pine: { name: '소나무', life: 230, light: 5, spark: 1.8, rad: .155, tint: 0xe6cfa6 }
  };
  var barkT = [barkTex(11, true), barkTex(29, true), barkTex(47, true)], emberT = [emberTex(14), emberTex(32)], logSeed = 0, LOGLEN = 1.6;
  function makeLog(type) {
    var T = WOOD[type], seed = ++logSeed, g = new THREE.CylinderGeometry(T.rad, T.rad * .92, LOGLEN, 11, 8), pos = g.attributes.position, ph = seed * 1.7;
    for (var i = 0; i < pos.count; i++) { var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x), k = 1 + Math.sin(a * 3 + ph) * .07 + Math.sin(a * 7 + y * 4 + ph) * .04 + Math.sin(y * 3 + ph) * .03; pos.setX(i, x * k); pos.setZ(i, z * k); }
    g.computeVertexNormals();
    var bark = new THREE.MeshStandardMaterial({ map: barkT[seed % 3], color: T.tint, roughness: .95, metalness: 0, emissive: 0xffffff, emissiveMap: emberT[seed % 2], emissiveIntensity: 0, envMapIntensity: .15 });
    var end = new THREE.MeshStandardMaterial({ map: endTex, color: T.tint, roughness: .9, metalness: 0, emissive: 0xff5a14, emissiveIntensity: 0, envMapIntensity: .1 });
    var m = new THREE.Mesh(g, [bark, end, end]); m.castShadow = true; m.receiveShadow = true; m.userData = { type: type, bark: bark, end: end, tint: new THREE.Color(T.tint) }; return m;
  }
  // 화로대 안 자리 (가운데로 기대어 세우는 7자리)
  var SLOTS = [], UP = new THREE.Vector3(0, 1, 0);
  for (var si0 = 0; si0 < 12; si0++) {
    var sa = si0 * 2.4 + .55, hi = Math.floor(si0 / 5), cx0 = Math.cos(sa), cz0 = Math.sin(sa);
    var SB = new THREE.Vector3(cx0 * (.5 + hi * .14), YB + .3 + hi * .22, cz0 * (.5 + hi * .14)), ST = new THREE.Vector3(-cx0 * .14 + cz0 * .1, YB + 1.72 + (si0 % 3) * .12 + hi * .14, -cz0 * .14 - cx0 * .1);
    SLOTS.push({ pos: SB.clone().add(ST).multiplyScalar(.5), q: new THREE.Quaternion().setFromUnitVectors(UP, ST.clone().sub(SB).normalize()), used: null });
  }
  var fireLogs = [], coalHeat = .25;   // 처음에는 불씨만 있다
  function freeSlot() { for (var i = 0; i < SLOTS.length; i++) if (!SLOTS[i].used) return SLOTS[i]; return null; }
  function burnLog(m, slot, startK, lit) {          // 화로대 안에 놓는다 (m의 위치는 fireG 기준)
    slot.used = m; fireG.add(m);
    var L = { m: m, slot: slot, T: WOOD[m.userData.type], age: startK * WOOD[m.userData.type].life, ign: 0, lit: !!lit, fly: lit ? 1 : 0, from: m.position.clone(), qFrom: m.quaternion.clone(), puff: 0 };
    if (lit) { m.position.copy(slot.pos); m.quaternion.copy(slot.q); }
    fireLogs.push(L); return L;
  }
  // 장작 더미
  var PILE_AT = [1.2, 0, .2], PILE_POS = [[-.43, .2, 0], [0, .2, .04], [.43, .2, -.03], [-.215, .56, .02], [.215, .56, -.02], [0, .92, 0]], pile = [];   // 장작은 단면이 앞을 보게 쌓는다
  function pileLayout() { pile.forEach(function (m, i) { var p = PILE_POS[i]; m.userData.home = new THREE.Vector3(PILE_AT[0] + p[0], p[1] - (.2 - WOOD[m.userData.type].rad) * (i < 3 ? 1 : .5), PILE_AT[2] + p[2]); m.userData.homeQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, ((i * 37) % 7 - 3) * .03)); }); }
  function pileAdd(type, from) { if (pile.length >= PILE_POS.length) return null; var m = makeLog(type); scene.add(m); pile.push(m); pileLayout(); if (from) { m.position.copy(from); m.quaternion.setFromEuler(new THREE.Euler(0, 0, .2)); } else { m.position.copy(m.userData.home); m.quaternion.copy(m.userData.homeQ); } return m; }
  function pileTake(m) { var i = pile.indexOf(m); if (i >= 0) pile.splice(i, 1); pileLayout(); }
  ['oak', 'pine', 'oak', 'oak', 'pine'].forEach(function (t) { pileAdd(t); });
  // 모탕(그루터기)과 통나무, 도끼
  var chop = new THREE.Group(); chop.position.set(2.62, 0, .7); scene.add(chop);
  var stumpM = new THREE.MeshStandardMaterial({ map: barkT[1], roughness: .95, envMapIntensity: .1 }), woodTop = new THREE.MeshStandardMaterial({ map: endTex, roughness: .9, envMapIntensity: .1 });
  var stump = new THREE.Mesh(new THREE.CylinderGeometry(.46, .5, .5, 14), [stumpM, woodTop, woodTop]); stump.position.y = .25; stump.castShadow = true; stump.receiveShadow = true; chop.add(stump);
  var roundM = new THREE.MeshStandardMaterial({ map: barkT[0], roughness: .95, envMapIntensity: .1 }), roundTop = new THREE.MeshStandardMaterial({ map: endTex, roughness: .9, envMapIntensity: .1 });
  var round = new THREE.Mesh(new THREE.CylinderGeometry(.3, .31, .8, 14), [roundM, roundTop, roundTop]); round.position.y = .9; round.castShadow = true; chop.add(round);
  var crack = new THREE.Mesh(new THREE.BoxGeometry(.56, .5, .025), new THREE.MeshBasicMaterial({ color: 0x120c07 })); crack.position.y = 1.07; crack.visible = false; chop.add(crack);
  var axe = new THREE.Group(), axeH = new THREE.Mesh(new THREE.CylinderGeometry(.035, .04, 1.25, 8), new THREE.MeshStandardMaterial({ color: 0x8a6238, roughness: .8 })); axeH.position.y = .62; axe.add(axeH);
  var axeHead = new THREE.Mesh(new THREE.BoxGeometry(.34, .2, .05), new THREE.MeshStandardMaterial({ color: 0xb4b7bc, metalness: .95, roughness: .3 })); axeHead.position.set(.12, 1.16, 0); axeHead.castShadow = true; axe.add(axeHead); chop.add(axe);
  var AXE_REST = { p: [.5, 0, .2], r: -.3 }, chopS = { hits: 0, t: -1, done: false, respawn: 0, type: 'oak' };
  function setRound(type) { chopS.type = type; roundM.color.set(WOOD[type].tint); roundTop.color.set(WOOD[type].tint); round.scale.set(type === 'pine' ? .85 : 1, 1, type === 'pine' ? .85 : 1); }
  setRound('oak');
  function doChop() {
    if (chopS.t >= 0 || !round.visible) return;
    if (pile.length > PILE_POS.length - 2) { tip('장작 더미가 가득해요. 먼저 불에 넣어 주세요'); return; }
    chopS.t = 0; chopS.done = false;
  }
  function chopHit() {
    chopS.hits++; chopSnd(chopS.hits);
    if (chopS.hits === 1) { crack.visible = true; tip('쩍! 한 번 더'); return; }
    crack.visible = false; round.visible = false; chopS.hits = 0; chopS.respawn = 1.6;
    var wp = new THREE.Vector3(); round.getWorldPosition(wp);
    pileAdd(chopS.type, wp.clone().add(new THREE.Vector3(-.2, .1, 0))); pileAdd(chopS.type, wp.clone().add(new THREE.Vector3(.2, .1, 0)));
    tip(WOOD[chopS.type].name + ' 장작 두 개가 나왔어요');
  }
  function chopUpdate(dt) {
    if (chopS.respawn > 0) { chopS.respawn -= dt; if (chopS.respawn <= 0) { setRound(chopS.type === 'oak' ? 'pine' : 'oak'); round.visible = true; round.position.y = 1.5; } }
    if (round.position.y > .9) round.position.y = Math.max(.9, round.position.y - dt * 3);
    if (chopS.t < 0) { axe.position.set(AXE_REST.p[0], AXE_REST.p[1], AXE_REST.p[2]); axe.rotation.set(0, 0, AXE_REST.r); return; }
    chopS.t += dt / .55; var t = chopS.t, sw = t < .55 ? t / .55 : t < .7 ? 1 + (t - .55) / .15 : 2;   // 들어올림 → 내려침
    var ang = sw < 1 ? -.42 + sw * .9 : sw < 2 ? .48 + (sw - 1) * 1.05 : 1.53;
    axe.position.set(-.95, .55, .02); axe.rotation.set(0, 0, -ang);
    if (t >= .7 && !chopS.done) { chopS.done = true; chopHit(); }
    if (t >= 1.15) chopS.t = -1;
  }

  // 숯불 바닥
  var coalTex = tex(256, 256, function (g, w, h) { var r = rnd(5); g.fillStyle = '#0a0705'; g.fillRect(0, 0, w, h); for (var i = 0; i < 220; i++) { var cx = r() * w, cy = r() * h, rad = 4 + r() * 16, gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad); gr.addColorStop(0, 'rgba(255,' + Math.floor(120 + r() * 100) + ',40,.95)'); gr.addColorStop(.5, 'rgba(230,70,10,.6)'); gr.addColorStop(1, 'rgba(120,20,0,0)'); g.fillStyle = gr; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); } for (var j = 0; j < 160; j++) { g.fillStyle = 'rgba(8,6,5,' + (.4 + r() * .5) + ')'; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 10, 2 + r() * 6, r() * 3, 0, 6.283); g.fill(); } });
  var coals = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: coalTex, toneMapped: false })); coals.rotation.x = -Math.PI / 2; coals.position.y = YB + .03; fireG.add(coals);
  // 바닥 그림자 (창 배경이 투명이라 직접 그린다)
  var shTex = tex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var sh = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.2), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(PX, .005, 0); scene.add(sh);
  var sh2 = sh.clone(); sh2.scale.set(.75, .6, 1); sh2.position.set(1.9, .004, .5); scene.add(sh2);

  // ---- 불꽃 셰이더
  var FRAG = [
    'precision highp float; uniform float t,power,seed; varying vec2 vUv;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}',
    'void main(){',
    ' float y=vUv.y,x=(vUv.x-.5)*2.;',
    ' x+=(fbm(vec2(y*1.6+seed*5.,t*.7))-.5)*.95*y;',                               // 바람에 휘어짐
    ' float tongue=fbm(vec2(x*2.3+seed*7.,t*.95+seed*2.));',                       // 혀처럼 솟는 봉우리들
    ' float hgt=power*(.36+1.05*tongue);',
    ' float n=fbm(vec2(x*2.4+seed*3.,y*2.7-t*2.4));',
    ' float n2=fbm(vec2(x*5.6+n*1.9+seed,y*6.2-t*4.0));',
    ' float wid=mix(.86,.14,smoothstep(0.,1.,y/max(power,.05)));',
    ' float env=1.-smoothstep(wid*.42,wid,abs(x)+(n2-.5)*.32);',
    ' float body=1.-smoothstep(hgt*.22,hgt,y+(n2-.5)*.32);',
    ' float f=env*body*(.42+n*.72+n2*.42);',
    ' float lick=smoothstep(.56,.72,n)*smoothstep(.42,.62,n2)*env*smoothstep(hgt*.45,hgt*.85,y)*(1.-smoothstep(hgt*.9,hgt*1.6+.08,y));',  // 떨어져 나가는 불꽃 조각
    ' f=clamp(f*1.16-.1+lick*.7,0.,1.);',
    ' vec3 c=mix(vec3(.5,.04,.0),vec3(.98,.3,.02),smoothstep(.06,.3,f));',
    ' c=mix(c,vec3(1.,.55,.06),smoothstep(.3,.52,f));',
    ' c=mix(c,vec3(1.,.78,.2),smoothstep(.52,.75,f));',
    ' c=mix(c,vec3(1.,.93,.55),smoothstep(.82,1.,f));',
    ' float a=smoothstep(.04,.28,f)*(.7+.3*smoothstep(.3,.8,f));',
    ' a*=smoothstep(0.,.05,y);',
    ' gl_FragColor=vec4(c,a*.9);}'
  ].join('\n');
  var flames = [];
  function flamePlane(w, hgt, x, y, z, ry, seed, pw, order) {
    var fm = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, power: { value: .8 }, seed: { value: seed } }, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader: FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    var fq = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), fm); fq.position.set(x, y, z); fq.rotation.y = ry; fq.renderOrder = order; fq.userData.pw = pw; fq.userData.sp = .9 + (seed % 1) * .35; fireG.add(fq); flames.push(fq);
  }
  for (var fi = 0; fi < 6; fi++) flamePlane(3.1, 5.2, (fi - 2.5) * .13, YB + 2.6, (fi - 2.5) * .15, (fi - 2.5) * .3, fi * 1.37 + .2, .62 + (fi % 3) * .09, 5 + fi);
  for (var bi = 0; bi < 5; bi++) { var ba = bi / 5 * 6.283 + .3; flamePlane(1.5, 2.0, Math.cos(ba) * .5, YB + .95, Math.sin(ba) * .45 + .1, 0, 9.1 + bi * 2.3, .55 + (bi % 2) * .12, 12 + bi); }   // 장작 사이에서 올라오는 작은 불
  // 불빛 번짐
  var glowTex = tex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,170,70,.55)'); gr.addColorStop(.4, 'rgba(255,110,30,.18)'); gr.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  var glow = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, toneMapped: false })); glow.position.set(0, YB + 1.3, -.6); glow.renderOrder = 1; glow.visible = false;
  var glowEl = document.getElementById('glow'), gv = new THREE.Vector3();
  // 불티
  var dotTex = tex(32, 32, function (g) { var gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,200,120,.7)'); gr.addColorStop(1, 'rgba(255,120,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  var NS = 56, sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3));
  var sparks = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffb060, size: .085, map: dotTex, transparent: true, depthWrite: false, toneMapped: false })); sparks.frustumCulled = false; sparks.renderOrder = 20; fireG.add(sparks);
  var sp = []; for (var si = 0; si < NS; si++) sp.push({ life: Math.random(), x: 0, z: 0, v: .25 + Math.random() * .5, ph: Math.random() * 6, on: true });

  // ---- 상태
  var cfg = { sound: false }, time = 0, burst = 0, level = .05, blow = 0, sparkBoost = 1, hintT = 2.5;
  function tip(s) { tipEl.textContent = s; tipEl.style.opacity = 1; clearTimeout(tip.t); tip.t = setTimeout(function () { tipEl.style.opacity = 0; }, 1900); }
  function nightFactor() { var d = new Date(), h = d.getHours() + d.getMinutes() / 60; return h < 5 ? 1 : h < 8 ? 1 - (h - 5) / 3 : h < 17 ? 0 : h < 20 ? (h - 17) / 3 : 1; }
  function burning() { var n = 0; fireLogs.forEach(function (L) { if (L.lit) n++; }); return n; }
  function dropLog(m) {             // 손에 든 장작을 화로대에 넣는다
    var slot = freeSlot(); if (!slot) { tip('더는 못 넣어요. 타서 줄어들면 넣어 주세요'); return false; }
    pileTake(m); scene.remove(m); fireG.worldToLocal(m.position); m.quaternion.setFromEuler(new THREE.Euler(0, 0, .9));
    burnLog(m, slot, 0, false); return true;
  }
  function addWood() {              // 메뉴의 '장작 넣기': 더미 맨 위 것을 자동으로 넣는다
    var m = pile[pile.length - 1] || pileAdd('oak'); if (!m) return; var p = m.position.clone(); if (!dropLog(m)) return; m.position.copy(fireG.worldToLocal(p));
  }
  function pitClick() {
    var lit = burning(), any = fireLogs.length;
    if (!lit && coalHeat < .08) { if (!any) { tip('장작을 먼저 넣어 주세요'); return; } coalHeat = .3; burst = 1; whoosh(.5); tip('토치로 불을 붙였어요'); return; }
    blow = 1; burst = Math.max(burst, .6); whoosh(1); tip('후- 후- 불이 살아나요');
  }
  function fireUpdate(dt, flick) {
    var sum = 0, sk = 0, heat = level + coalHeat * .6;
    for (var i = fireLogs.length - 1; i >= 0; i--) {
      var L = fireLogs[i], m = L.m, u = m.userData;
      if (L.fly < 1) {                                                          // 떨어지며 자리 잡는 중
        var was = L.fly; L.fly = Math.min(1, L.fly + dt / .38); var e = L.fly * L.fly;
        m.position.lerpVectors(L.from, L.slot.pos, e); m.position.y += Math.sin(L.fly * Math.PI) * .5; m.quaternion.copy(L.qFrom).slerp(L.slot.q, e);
        if (L.fly >= 1 && was < 1) { thud(); burst = 1; level *= .86; tip(L.T.name + '를 넣었어요 · 불이 옮겨붙는 중'); }
        continue;
      }
      if (!L.lit) {
        if (heat > .08) L.ign += dt * (.35 + heat) * (1 + blow * 1.5);
        if (L.ign >= L.T.light) { L.lit = true; burst = Math.max(burst, .7); tip(L.T.name + '에 불이 붙었어요'); }
      } else L.age += dt * (1 + blow * .6);
      var k = L.age / L.T.life, c = !L.lit ? 0 : k < .06 ? k / .06 : k < .7 ? 1 : Math.max(0, (1 - k) / .3);
      sum += c; sk += c * L.T.spark;
      var char = L.lit ? Math.min(1, k * 2.4 + .3) : L.ign / L.T.light * .3, dk = 1 - char * .84;
      u.bark.color.copy(u.tint).multiplyScalar(dk); u.end.color.copy(u.tint).multiplyScalar(1 - char * .9);
      u.bark.emissiveIntensity = L.lit ? (.35 + char * .9) * (.55 + level * .6) * (k > .7 ? 1.7 : 1) * (1 + Math.sin(time * 3 + i) * .18) + blow * .5 : 0;
      u.end.emissiveIntensity = L.lit ? (.25 + char * .5) * (1 + blow) : 0;
      var s = k > .6 ? 1 - (k - .6) / .4 * .5 : 1; m.scale.set(s, k > .8 ? 1 - (k - .8) * 2 : 1, s);
      m.position.copy(L.slot.pos); if (k > .7) m.position.y -= (k - .7) * 1.5;
      if (k >= 1) { fireG.remove(m); L.slot.used = null; fireLogs.splice(i, 1); coalHeat = Math.min(1, coalHeat + .3); }
    }
    if (sum > 0) coalHeat = Math.min(1, coalHeat + dt * .01 * sum); else coalHeat = Math.max(fireLogs.length ? .1 : 0, coalHeat - dt / 400);
    sparkBoost = sum > 0 ? sk / sum : .4;
    var ember = coalHeat > .05 ? .06 + coalHeat * .1 + blow * .08 : 0;                 // 장작이 없어도 불씨는 작게 탄다
    return Math.max(ember, Math.min(1.3, sum / 3.4) + blow * .18 * (sum > 0 ? 1 : 0));
  }

  // ---- 소리 (코드로 합성: 타닥거림 + 낮은 불 소리)
  var AC = null, fireGain = null;
  function audio() {
    if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    var sr = AC.sampleRate, b = AC.createBuffer(2, sr * 6, sr);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch), e = 0, lp = 0, lp2 = 0; for (var i = 0; i < d.length; i++) { if (Math.random() < .0006) e = .4 + Math.random() * .6; if (Math.random() < .00004) e = 1.4; e *= .992; var w = Math.random() * 2 - 1; lp += (w - lp) * .012; lp2 += (w - lp2) * .25; d[i] = (w - lp2) * e * .5 + lp * 1.1; } }
    var s = AC.createBufferSource(); s.buffer = b; s.loop = true; fireGain = AC.createGain(); fireGain.gain.value = 0; s.connect(fireGain); fireGain.connect(AC.destination); s.start();
  }
  function thud() { if (!AC || !cfg.sound) return; var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = 'triangle'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(60, t + .15); g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + .25); }
  function noiseHit(dur, vol, lp) { if (!AC || !cfg.sound) return; var sr = AC.sampleRate, b = AC.createBuffer(1, Math.floor(sr * dur), sr), d = b.getChannelData(0), l = 0; for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1, e = Math.sin(Math.PI * i / d.length); l += (w - l) * lp; d[i] = l * e; } var s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(AC.destination); s.start(); }
  function whoosh(v) { noiseHit(.7, .5 * v, .08); }
  function chopSnd(n) { noiseHit(.09, .6, .5); thud(); if (n === 2) noiseHit(.25, .35, .25); }
  function applyCfg(s) { cfg = s || cfg; if (cfg.sound) audio(); setPit(cfg.pit || 0); }
  W.onSettings(applyCfg); W.onWood(addWood); W.settings().then(applyCfg);

  // ---- 마우스: 장작 끌어 넣기 · 불 클릭(부채질/점화) · 통나무 클릭(장작 패기) · 빈 곳 끌기(창 이동)
  var ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.0), hitP = new THREE.Vector3();
  var down = null, moved = false, held = null, target = null, hot2 = true;
  function setRay(e) { mouse.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1); ray.setFromCamera(mouse, cam); }
  function overPit(e) { setRay(e); var p = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), p)) return false; return Math.abs(p.x - PX) < 1.9 && p.y > .2 && p.y < 5; }
  function pick(e) {
    setRay(e); var h = ray.intersectObjects(pile, false); if (h.length) return { kind: 'log', m: h[0].object };
    if (ray.intersectObjects([round, stump, axeH, axeHead], false).length) return { kind: 'chop' };
    if (overPit(e)) return { kind: 'pit' };
    return null;
  }
  cv.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return; audio && cfg.sound && audio();
    down = { x: e.screenX, y: e.screenY }; moved = false; target = pick(e);
    if (target && target.kind === 'log') { held = target.m; cv.style.cursor = 'grabbing'; }
  });
  window.addEventListener('mousemove', function (e) {
    if (!down) { var t = pick(e); cv.style.cursor = t ? (t.kind === 'log' ? 'grab' : 'pointer') : 'default'; if (!!t !== hot2) { hot2 = !!t; W.setIgnore(!hot2); } return; }
    var dx = e.screenX - down.x, dy = e.screenY - down.y; if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return; moved = true;
    if (held) { setRay(e); if (ray.ray.intersectPlane(dragPlane, hitP)) { held.userData.grab = hitP.clone(); held.userData.grab.y = Math.max(.3, hitP.y); } return; }
    W.drag(dx, dy); down = { x: e.screenX, y: e.screenY };
  });
  window.addEventListener('mouseup', function (e) {
    if (!down) return; down = null; cv.style.cursor = 'default';
    if (held) { var m = held; held = null; m.userData.grab = null; if (moved && overPit(e)) dropLog(m); else if (!moved) tip(WOOD[m.userData.type].name + ' · 끌어서 화로대에 넣어요'); return; }
    if (moved) { W.dragEnd(); return; }
    if (target && target.kind === 'chop') doChop(); else if (target && target.kind === 'pit') pitClick();
  });
  window.addEventListener('contextmenu', function (e) { e.preventDefault(); W.menu(); });
  function pileUpdate(dt) {
    var k = Math.min(1, dt * 10);
    pile.forEach(function (m) {
      var g = m.userData.grab;
      if (g) { m.position.lerp(g, Math.min(1, dt * 18)); m.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 1.0)), k); }
      else { m.position.lerp(m.userData.home, k); m.quaternion.slerp(m.userData.homeQ, k); }
    });
  }

  var last = 0, acc = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = Math.min(.1, (ts - last) / 1000 || 0); last = ts; acc += dt; if (acc < 1 / 30) return;   // 30프레임 제한
    dt = acc; acc = 0; time += dt;
    burst = Math.max(0, burst - dt * .8); blow = Math.max(0, blow - dt * .7);
    var flick0 = 1 + Math.sin(time * 11) * .09, n = nightFactor(), tgt = fireUpdate(dt, flick0);
    level += (tgt - level) * Math.min(1, dt * (tgt > level ? 1.2 : 2.5));
    pileUpdate(dt); chopUpdate(dt);
    if (hintT > 0) { hintT -= dt; if (hintT <= 0) tip('불씨가 있어요. 소나무부터 넣고 불을 클릭해 부채질해요'); }
    var flick = 1 + Math.sin(time * 11) * .09 + Math.sin(time * 23.7) * .06 + Math.sin(time * 5.3) * .07;
    flames.forEach(function (f) { f.material.uniforms.t.value = time * f.userData.sp; f.material.uniforms.power.value = Math.max(.001, Math.min(.97, level * f.userData.pw * (1 + burst * .2 + blow * .35))); f.scale.x = 1 + Math.max(0, level - 1) * .9; f.visible = level > .02; });
    amb.intensity = .5 - n * .28; key.intensity = .7 - n * .45;
    fireLight.intensity = (1.6 + n * 2.2) * level * flick + (.1 + coalHeat * .5) * (1 - Math.min(1, level));
    gv.set(0, YB + 1.3, 0); fireG.localToWorld(gv); gv.project(cam);
    var gx = (gv.x + 1) / 2 * window.innerWidth, gy = (1 - gv.y) / 2 * window.innerHeight, grx = Math.min(gx, window.innerWidth - gx), gry = Math.min(gy, window.innerHeight - gy), ga = Math.min(.5, (.1 + n * .26) * Math.min(1.2, level) * flick + coalHeat * .03);
    glowEl.style.background = 'radial-gradient(ellipse ' + grx.toFixed(0) + 'px ' + gry.toFixed(0) + 'px at ' + gx.toFixed(0) + 'px ' + gy.toFixed(0) + 'px, rgba(255,170,80,' + ga.toFixed(3) + ') 0%, rgba(255,130,50,' + (ga * .45).toFixed(3) + ') 38%, rgba(255,110,40,' + (ga * .12).toFixed(3) + ') 68%, rgba(255,100,30,0) 100%)';
    coals.material.color.setScalar(.08 + coalHeat * .55 + level * .35 + blow * .3 + Math.sin(time * 2.1) * .05);
    hot.color.setRGB(1, .42, .1).multiplyScalar((.25 + level * .8) * flick);
    var pa = sparks.geometry.attributes.position;
    sp.forEach(function (p, i) {
      p.life += dt * p.v;
      if (p.life > 1) { p.life = 0; p.x = (Math.random() - .5) * .9; p.z = (Math.random() - .5) * .7; p.on = Math.random() < level * .5 * sparkBoost + burst + blow * .6; }
      var l = p.life; if (!p.on) { pa.setXYZ(i, 0, -9, 0); return; }
      pa.setXYZ(i, p.x + Math.sin(l * 6 + p.ph) * .3 * l + l * .25, YB + .8 + l * 4.4 * (.6 + level * .5), p.z + Math.cos(l * 5 + p.ph) * .2 * l);
    });
    pa.needsUpdate = true; sparks.material.opacity = .9;
    if (fireGain) fireGain.gain.value += ((cfg.sound ? .4 * Math.min(1, level + .1) * (.7 + sparkBoost * .3) : 0) - fireGain.gain.value) * .08;
    renderer.render(scene, cam);
    if (W.shotFile) { if (time > .5 && !frame.a) { frame.a = 1; if (location.hash !== '#ember') { addWood(); addWood(); addWood(); } doChop(); } if (time > 1.3 && !frame.c) { frame.c = 1; fireLogs.forEach(function (L) { L.lit = true; L.age = L.T.life * .3; }); } if (time > 1.6 && !frame.b) { frame.b = 1; doChop(); } if (time > 4.2 && !frame.shot) { frame.shot = true; console.log('STATE ' + JSON.stringify({ pile: pile.length, fire: fireLogs.length, lit: burning(), level: +level.toFixed(2), coal: +coalHeat.toFixed(2) })); W.shot(W.shotFile); } }
  }
  setPit(0);
  requestAnimationFrame(frame);
})();
