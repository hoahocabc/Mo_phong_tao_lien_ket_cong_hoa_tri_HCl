// Mô phỏng liên kết cộng hóa trị của phân tử HCl
// Tác giả: Gemini

let fontRegular;
let playButton, resetButton, instructionsButton, overlapButton, sphereButton, labelButton, spinButton;
let titleDiv, footerDiv, instructionsPopup;
let atoms = [];
let state = "idle";
let progress = 0;
let bondingProgress = 0;
let cloudRotationAngle = 0;
const slowSpinSpeed = 0.025;
const fastSpinSpeed = 0.3;
const sphereRotationSpeed = 0.02;
let hSphereRotation = 0;
let clSphereRotation = 0;
let showLabels = true;
let isSphereVisible = false;
let isElectronSpinning = true;

const hOuterRadius = 60;
const clOuterRadius = 50 + 2 * 40;

const initialShellGap = 200;
const bondedShellOverlap = 18;
const bondDistance = (hOuterRadius + clOuterRadius) - bondedShellOverlap;

const sharedElectronSeparation = 18;
const initialDistance = hOuterRadius + initialShellGap + clOuterRadius;

let panX = 0;
let panY = 0;

function preload() {
  fontRegular = loadFont('https://fonts.gstatic.com/s/opensans/v27/mem8YaGs126MiZpBA-UFVZ0e.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  background(0);
  perspective(PI / 3, width / height, 0.1, 4000);

  smooth();
  textFont(fontRegular);
  textAlign(CENTER, CENTER);
  noStroke();

  titleDiv = createDiv("MÔ PHỎNG LIÊN KẾT CỘNG HOÁ TRÊN PHÂN TỬ HCl");
  titleDiv.style("position", "absolute");
  titleDiv.style("top", "10px");
  titleDiv.style("width", "100%");
  titleDiv.style("text-align", "center");
  titleDiv.style("font-size", "18px");
  titleDiv.style("color", "#fff");
  titleDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
  titleDiv.style("font-family", "Arial");

  footerDiv = createDiv("© HÓA HỌC ABC");
  footerDiv.style("position", "absolute");
  footerDiv.style("bottom", "10px");
  footerDiv.style("width", "100%");
  footerDiv.style("text-align", "center");
  footerDiv.style("font-size", "16px");
  footerDiv.style("color", "#fff");
  footerDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
  footerDiv.style("font-family", "Arial");

  createUI();
  resetSimulation();
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function createUI() {
  playButton = createButton("▶ Play");
  styleButton(playButton);
  playButton.mousePressed(() => {
    if (state === "idle") {
      state = "animating";
    }
  });

  spinButton = createButton("Tắt quay electron");
  styleButton(spinButton);
  spinButton.mousePressed(() => {
    isElectronSpinning = !isElectronSpinning;
    if (isElectronSpinning) {
      spinButton.html("Tắt quay electron");
    } else {
      spinButton.html("Bật quay electron");
    }
  });

  resetButton = createButton("↺ Reset");
  styleButton(resetButton);
  resetButton.mousePressed(() => {
    window.location.reload();
  });

  overlapButton = createButton("Bật xen phủ");
  styleButton(overlapButton);
  overlapButton.mousePressed(() => {
    if (state === "done" || state === "overlap_spinning") {
      if (isSphereVisible) {
        isSphereVisible = false;
        sphereButton.html("Bật lớp cầu");
      }
      state = (state === "overlap_spinning") ? "done" : "overlap_spinning";
      overlapButton.html(state === "overlap_spinning" ? "Tắt xen phủ" : "Bật xen phủ");
    }
  });

  sphereButton = createButton("Bật lớp cầu");
  styleButton(sphereButton);
  sphereButton.mousePressed(() => {
    if (state === "overlap_spinning") {
      state = "done";
      overlapButton.html("Bật xen phủ");
    }
    isSphereVisible = !isSphereVisible;
    if (isSphereVisible) {
      sphereButton.html("Tắt lớp cầu");
    } else {
      sphereButton.html("Bật lớp cầu");
    }
  });

  labelButton = createButton("Tắt nhãn");
  styleButton(labelButton);
  labelButton.mousePressed(() => {
    showLabels = !showLabels;
    labelButton.html(showLabels ? "Tắt nhãn" : "Bật nhãn");
  });

  instructionsButton = createButton("Hướng dẫn");
  styleButton(instructionsButton, true);
  instructionsButton.mousePressed(() => {
    instructionsPopup.style('display', 'block');
  });

  instructionsPopup = createDiv();
  instructionsPopup.id('instructions-popup');
  instructionsPopup.style('position', 'fixed');
  instructionsPopup.style('top', '50%');
  instructionsPopup.style('left', '50%');
  instructionsPopup.style('transform', 'translate(-50%, -50%)');
  instructionsPopup.style('background-color', 'rgba(0, 0, 0, 0.85)');
  instructionsPopup.style('border-radius', '12px');
  instructionsPopup.style('padding', '20px');
  instructionsPopup.style('color', '#fff');
  instructionsPopup.style('font-family', 'Arial');
  instructionsPopup.style('z-index', '1000');
  instructionsPopup.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.2)');
  instructionsPopup.style('display', 'none');

  let popupContent = `
    <h2 style="font-size: 24px; margin-bottom: 15px; text-align: center;">Hướng dẫn sử dụng</h2>
    <ul style="list-style-type: none; padding: 0;">
      <li style="margin-bottom: 10px;">• Nhấn nút "Play" để bắt đầu quá trình mô phỏng liên kết cộng hóa trị.</li>
      <li style="margin-bottom: 10px;">• Sau khi mô phỏng hoàn tất, bạn có thể sử dụng chuột để xoay và xem mô hình từ các góc khác nhau.</li>
      <li style="margin-bottom: 10px;">• Giữ phím **Ctrl** và kéo chuột trái để di chuyển toàn bộ mô hình trên màn hình.</li>
      <li style="margin-bottom: 10px;">• Sử dụng con lăn chuột để phóng to hoặc thu nhỏ.</li>
      <li style="margin-bottom: 10px;">• Nhấn nút "Reset" để quay lại trạng thái ban đầu.</li>
      <li style="margin-bottom: 10px;">• Nhấn nút "Bật xen phủ" để hiển thị đám mây electron liên kết.</li>
      <li style="margin-bottom: 10px;">• Nhấn nút "Bật lớp cầu" để hiển thị lớp electron hóa trị dưới dạng mặt cầu.</li>
      <li style="margin-bottom: 10px;">• Nhấn nút **"Bật/Tắt quay electron"** để dừng hoặc tiếp tục chuyển động quay của các electron.</li>
      <li style="margin-bottom: 10px;">• Nhấn nút "Bật/Tắt nhãn" để hiển thị hoặc ẩn nhãn tên nguyên tử.</li>
    </ul>
    <button id="closePopup" style="display: block; width: 100%; padding: 10px; margin-top: 20px; font-size: 16px; border: none; border-radius: 6px; background-color: #36d1dc; color: #fff; cursor: pointer;">Đóng</button>
  `;
  instructionsPopup.html(popupContent);

  document.getElementById('closePopup').addEventListener('click', () => {
    instructionsPopup.style('display', 'none');
  });

  positionButtons();
}

function styleButton(btn, isTransparent = false) {
  btn.style("width", "120px");
  btn.style("height", "30px");
  btn.style("padding", "0px");
  btn.style("font-size", "12px");
  btn.style("border-radius", "6px");
  btn.style("color", "#fff");
  btn.style("cursor", "pointer");
  btn.style("transition", "all 0.2s ease-in-out");
  btn.style("font-family", "Arial");
  btn.style("transform", "scale(1)");
  btn.style("box-shadow", "none");

  if (isTransparent) {
    btn.style("background", "rgba(0,0,0,0)");
    btn.style("border", "1px solid #fff");
  } else {
    const defaultGradient = "linear-gradient(145deg, #6a82fb, #fc5c7d)";
    const hoverGradient = "linear-gradient(145deg, #fc5c7d, #6a82fb)";
    const pressGradient = "linear-gradient(145deg, #8a2be2, #00ffff)";

    btn.style("border", "none");
    btn.style("background", defaultGradient);
    btn.style("box-shadow", "3px 3px 6px rgba(0,0,0,0.4)");

    btn.mouseOver(() => {
      btn.style("background", hoverGradient);
    });

    btn.mouseOut(() => {
      btn.style("background", defaultGradient);
    });

    btn.mousePressed(() => {
      btn.style("background", pressGradient);
    });

    btn.mouseReleased(() => {
      btn.style("background", hoverGradient);
    });
  }
}

function positionButtons() {
  playButton.position(20, 20);
  spinButton.position(20, 60);
  overlapButton.position(20, 100);
  sphereButton.position(20, 140);
  labelButton.position(20, 180);
  resetButton.position(20, 220);
  instructionsButton.position(20, 260);
}

function resetSimulation() {
  atoms = [];
  atoms.push(new Atom(-initialDistance / 2, 0, "H", 1, [1], color(255, 255, 255)));
  atoms.push(new Atom(initialDistance / 2, 0, "Cl", 17, [2, 8, 7], color(0, 255, 0)));
  
  state = "idle";
  progress = 0;
  bondingProgress = 0;
  cloudRotationAngle = 0;
  hSphereRotation = 0;
  clSphereRotation = 0;
  panX = 0;
  panY = 0;
  isSphereVisible = false;
  showLabels = true;
  isElectronSpinning = true;

  overlapButton.html("Bật xen phủ");
  sphereButton.html("Bật lớp cầu");
  labelButton.html("Tắt nhãn");
  spinButton.html("Tắt quay electron");
}

function drawBillboardText(textStr, x, y, z, size) {
  push();
  translate(x, y, z);
  textSize(size);
  text(textStr, 0, 0);
  pop();
}

function drawLabels() {
  if (!showLabels) {
    return;
  }

  const hAtom = atoms.find(a => a.label === "H");
  const clAtom = atoms.find(a => a.label === "Cl");

  push();
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);

  const hLabelY = hAtom.pos.y + hOuterRadius + 30;
  const clLabelY = clAtom.pos.y + clOuterRadius + 30;

  push();
  translate(hAtom.pos.x, hLabelY, 0);
  rotateX(PI);
  text("H", 0, 0);
  pop();

  push();
  translate(clAtom.pos.x, clLabelY, 0);
  rotateX(PI);
  text("Cl", 0, 0);
  pop();

  pop();
}

function draw() {
  background(0);

  if (keyIsDown(17) && mouseIsPressed) {
    panX += (mouseX - pmouseX);
    panY += (mouseY - pmouseY);
  } else {
    orbitControl();
  }

  translate(panX, panY);

  ambientLight(80);
  pointLight(255, 255, 255, 0, 0, 300);

  if (state === "animating") {
    progress += 0.01;
    let t_move = easeInOutQuad(progress);
    let currentDist = lerp(initialDistance, bondDistance, t_move);

    if (progress >= 1) {
      progress = 1;
      state = "bonding";
    }

    let hX = -currentDist * (clOuterRadius / (hOuterRadius + clOuterRadius));
    let clX = currentDist * (hOuterRadius / (hOuterRadius + clOuterRadius));

    atoms.forEach(atom => {
      if (atom.label === "H") {
        atom.pos.x = hX;
      } else if (atom.label === "Cl") {
        atom.pos.x = clX;
      }
    });

  } else if (state === "bonding") {
    bondingProgress += 0.02;
    if (bondingProgress >= 1) {
      bondingProgress = 1;
      state = "done";
    }
    let hX = -bondDistance * (clOuterRadius / (hOuterRadius + clOuterRadius));
    let clX = bondDistance * (hOuterRadius / (hOuterRadius + clOuterRadius));
    atoms.forEach(atom => {
      if (atom.label === "H") {
        atom.pos.x = hX;
      } else if (atom.label === "Cl") {
        atom.pos.x = clX;
      }
    });
  } else if (state === "overlap_spinning") {
    let hX = -bondDistance * (clOuterRadius / (hOuterRadius + clOuterRadius));
    let clX = bondDistance * (hOuterRadius / (hOuterRadius + clOuterRadius));
    atoms.forEach(atom => {
      if (atom.label === "H") {
        atom.pos.x = hX;
      } else if (atom.label === "Cl") {
        atom.pos.x = clX;
      }
    });
    cloudRotationAngle += fastSpinSpeed * (isElectronSpinning ? 1 : 0);
  } else if (state === "done") {
    let hX = -bondDistance * (clOuterRadius / (hOuterRadius + clOuterRadius));
    let clX = bondDistance * (hOuterRadius / (hOuterRadius + clOuterRadius));
    atoms.forEach(atom => {
      if (atom.label === "H") {
        atom.pos.x = hX;
      } else if (atom.label === "Cl") {
        atom.pos.x = clX;
      }
    });
  } else if (state === "idle") {
    let hX = -initialDistance * (clOuterRadius / (hOuterRadius + clOuterRadius));
    let clX = initialDistance * (hOuterRadius / (hOuterRadius + clOuterRadius));
    atoms.forEach(atom => {
      if (atom.label === "H") {
        atom.pos.x = hX;
      } else if (atom.label === "Cl") {
        atom.pos.x = clX;
      }
    });
  }

  for (let atom of atoms) {
    push();
    translate(atom.pos.x, atom.pos.y, 0);
    atom.show(bondingProgress, state);
    pop();
  }

  if (isSphereVisible) {
    drawElectronSpheres();
    hSphereRotation += sphereRotationSpeed * (isElectronSpinning ? 1 : 0);
    clSphereRotation += sphereRotationSpeed * (isElectronSpinning ? 1 : 0);
  } else if (state === "overlap_spinning") {
    drawElectronClouds();
  }

  drawLabels();
}

function drawElectronClouds() {
  const hAtom = atoms.find(a => a.label === "H");
  const clAtom = atoms.find(a => a.label === "Cl");

  const hOrbitalRadius = hOuterRadius - 4;
  const clOrbitalRadius = clOuterRadius - 4;
  const orbitalWidth = 11;

  let hColor = atoms.find(a => a.label === "H").electronCol;
  let clColor = atoms.find(a => a.label === "Cl").electronCol;
  let blendedColor = lerpColor(hColor, clColor, 0.5);
  blendedColor.setAlpha(255);

  push();
  translate(hAtom.pos.x, hAtom.pos.y, 0);
  rotateZ(cloudRotationAngle);
  noStroke();
  fill(blendedColor);
  torus(hOrbitalRadius, orbitalWidth, 12, 12);
  pop();

  push();
  translate(clAtom.pos.x, clAtom.pos.y, 0);
  rotateZ(cloudRotationAngle);
  noStroke();
  fill(blendedColor);
  torus(clOrbitalRadius, orbitalWidth, 12, 12);
  pop();
}

function drawElectronSpheres() {
  const hAtom = atoms.find(a => a.label === "H");
  const clAtom = atoms.find(a => a.label === "Cl");

  let hColor = atoms.find(a => a.label === "H").electronCol;
  let clColor = atoms.find(a => a.label === "Cl").electronCol;

  const hOrbitalRadius = hOuterRadius + 6;
  const clOrbitalRadius = clOuterRadius + 6;

  const sphereDetail = 40;

  push();
  translate(hAtom.pos.x, hAtom.pos.y, 0);
  rotateY(hSphereRotation);
  noStroke();
  fill(hColor);
  sphere(hOrbitalRadius, sphereDetail, sphereDetail);
  pop();

  push();
  translate(clAtom.pos.x, clAtom.pos.y, 0);
  rotateY(clSphereRotation);
  noStroke();
  fill(clColor);
  sphere(clOrbitalRadius, sphereDetail, sphereDetail);
  pop();
}

class Atom {
  constructor(x, y, label, protons, shellCounts, electronCol) {
    this.pos = createVector(x, y, 0);
    this.label = label;
    this.protons = protons;
    this.shells = [];
    this.shellRadii = [];
    let baseR = (label === "H") ? hOuterRadius : 50;
    let increment = 40;

    this.nonBondingPairAngles = [PI / 2, 3 * PI / 2, (x < 0) ? PI : 0];

    this.electronCol = electronCol;
    this.otherElectronCol = (electronCol.levels ? (electronCol.levels.toString() === [255, 255, 255, 255].toString() ? color(0, 255, 0) : color(255, 255, 255)) : color(0, 255, 0));

    for (let i = 0; i < shellCounts.length; i++) {
      let radius = baseR + i * increment;
      if (label === "H") {
        radius = baseR;
      }
      this.shellRadii.push(radius);
      let shellElectrons = [];
      for (let j = 0; j < shellCounts.at(i); j++) {
        shellElectrons.push({
          angle: (TWO_PI / shellCounts.at(i)) * j,
          col: electronCol,
          isShared: false
        });
      }
      this.shells.push(shellElectrons);
    }

    const outerShell = this.shells.at(-1);

    if (this.label === "H") {
      outerShell.at(0).isShared = true;
    } else {
      let sharedIndex = outerShell.reduce((bestIndex, e, currentIndex) => {
        if (abs(e.angle - PI) < abs(outerShell.at(bestIndex).angle - PI)) {
          return currentIndex;
        }
        return bestIndex;
      }, 0);
      outerShell.at(sharedIndex).isShared = true;
    }
  }

  show(bondingProgress, state) {
    push();
    fill(255, 0, 0);
    let nucleusSize = (this.label === "H") ? 20 : 20;
    sphere(nucleusSize);

    push();
    fill(255, 255, 0);
    textSize(16);

    let offsetX = 0;
    if (this.label === "H") {
      offsetX = 5;
    } else if (this.label === "Cl") {
      offsetX = -5;
    }

    translate(offsetX, 0, nucleusSize + 1);

    text("+" + this.protons, 0, 0);
    pop();
    pop();

    for (let i = 0; i < this.shells.length; i++) {
      noFill();
      stroke(255);
      strokeWeight(1);

      let radius = this.shellRadii.at(i);
      push();
      if (i < this.shells.length - 1 || (!isSphereVisible && state !== "overlap_spinning")) {
        drawSmoothCircle(radius);
      }
      pop();
    }
    noStroke();

    const electronSize = 6;
    const hAtom = atoms.find(a => a.label === "H");
    const clAtom = atoms.find(a => a.label === "Cl");

    for (let i = 0; i < this.shells.length; i++) {
      let radius = this.shellRadii.at(i);

      if (isSphereVisible && i === this.shells.length - 1 || state === "overlap_spinning" && i === this.shells.length - 1) {
        continue;
      }

      for (let j = 0; j < this.shells.at(i).length; j++) {
        let e = this.shells.at(i).at(j);
        let ex, ey;

        if (state === "idle" || state === "animating") {
          e.angle += slowSpinSpeed * (isElectronSpinning ? 1 : 0);
          ex = cos(e.angle) * radius;
          ey = sin(e.angle) * radius;
        } else if (state === "bonding" || state === "done") {
          if (i < this.shells.length - 1 && this.label === "Cl") {
            e.angle += slowSpinSpeed * (isElectronSpinning ? 1 : 0);
            ex = cos(e.angle) * radius;
            ey = sin(e.angle) * radius;
          } else {
            let t_bonding = easeInOutQuad(bondingProgress);
            let initialAngle = e.angle;
            let initialX = cos(initialAngle) * radius;
            let initialY = sin(initialAngle) * radius;

            if (e.isShared) {
              const hShellRight = hAtom.pos.x + hOuterRadius;
              const clShellLeft = clAtom.pos.x - clOuterRadius;
              const midPointOverlapX = (hShellRight + clShellLeft) / 2;

              let finalX = lerp(initialX, midPointOverlapX - this.pos.x, t_bonding);
              let finalY = lerp(initialY, (this.pos.x < 0) ? -sharedElectronSeparation / 2 : sharedElectronSeparation / 2, t_bonding);
              ex = finalX;
              ey = finalY;
            } else {
              const nonBondingPairAngles = [PI / 2, 3 * PI / 2, 0];
              let nonSharedCount = this.shells.at(-1).filter(e => !e.isShared).indexOf(e);
              const pairAngleOffset = radians(5);
              const pairIndex = floor(nonSharedCount / 2);
              const isSecondElectron = (nonSharedCount % 2) === 1;

              let finalAngle = nonBondingPairAngles.at(pairIndex) + (isSecondElectron ? -pairAngleOffset : pairAngleOffset);
              let finalX = cos(finalAngle) * radius;
              let finalY = sin(finalAngle) * radius;

              ex = lerp(initialX, finalX, t_bonding);
              ey = lerp(initialY, finalY, t_bonding);
            }
          }
        } else if (state === "overlap_spinning" || isSphereVisible) {
          e.angle += slowSpinSpeed * (isElectronSpinning ? 1 : 0);
          ex = cos(e.angle) * radius;
          ey = sin(e.angle) * radius;
        }

        push();
        translate(ex, ey, 0);
        fill(e.col);
        sphere(electronSize);

        if (state !== "overlap_spinning" && !isSphereVisible) {
          push();
          fill(255);
          drawBillboardText("-", 0, -electronSize * 2, 0, 10);
          pop();
        }
        pop();
      }
    }
  }
}

function drawSmoothCircle(radius) {
  let numPoints = 200;
  beginShape();
  for (let i = 0; i < numPoints; i++) {
    let angle = map(i, 0, numPoints, 0, TWO_PI);
    let x = radius * cos(angle);
    let y = radius * sin(angle);
    vertex(x, y);
  }
  endShape(CLOSE);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  perspective(PI / 3, windowWidth / windowHeight, 0.1, 4000);
  positionButtons();
}