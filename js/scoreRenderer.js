const ScoreRenderer = this.ScoreRenderer = function () {
  const renderer = this;

  // Interface
  renderer.init = init;
  renderer.update = update;
  renderer.onBackingScaleChanged = onBackingScaleChanged;

  let widthInCells;
  let heightInCells;

  let canvasWidth;
  let canvasHeight;

  let xRange;
  let xRangeBeats;
  let yRange;

  let mScore;
  let mCanvas;
  let mNoteColor;
  let mShowPianoNotes;

  return renderer;

  function drawGrid(ctx) {
    ctx.globalAlpha = 1;
    const widthOfOneSixteenth = xRange(1);
    const heightOfOneLane = yRange(1);

    for (let bar = 0; bar < 4; bar++) {
      ctx.fillStyle = bar % 2 == 0 ? 'rgb(55,55,55)' : 'rgb(65,65,65)';
      ctx.fillRect(xRange(bar * 16), 0, widthOfOneSixteenth * 16, yRange(heightInCells));
    }

    for (let beat = 0; beat < 16; beat++) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(xRange(beat * 4), 0, 2, yRange(heightInCells));
    }

    for (let sixteenth = 0; sixteenth < widthInCells; sixteenth++) {
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(xRange(sixteenth), 0, 2, yRange(heightInCells));
    }

    if (mShowPianoNotes) {
      const blacknotes = [1, 3, 6, 8, 10];

      for (var lane = 0; lane < heightInCells; lane++) {
        if (blacknotes.includes(lane % 12)) {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(0, yRange((heightInCells - 1) - lane) + 1, xRange(widthInCells), heightOfOneLane);
        }
      }
    } else {
      for (var lane = 0; lane < heightInCells; lane++) {
        if (lane % 2 == 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(0, yRange(lane), xRange(widthInCells), heightOfOneLane);
        }
      }
    }
  }

  function getNoteColor() {
    return mScore.isMuted()
      ? '#aaa'
      : mNoteColor;
  }

  function drawNotes(ctx) {
    const heightOfOneLane = yRange(1);

    const notes = mScore.notes();

    const BS = backingScale();
    ctx.save();

    notes.forEach((note) => {
      const start = Math.round(xRangeBeats(note.time));
      const end = Math.round(xRangeBeats(note.time + note.length));
      const top = Math.round(yRange((heightInCells - 1) - note.row) + 1);
      const height = Math.round(Math.max(heightOfOneLane - 2, 1));

      ctx.globalAlpha = note.vol;
      ctx.fillStyle = getNoteColor();
      ctx.fillRect(start, top, end - start, height);

      ctx.globalAlpha = 1;
      ctx.fillStyle = '#333';
      ctx.fillRect(start, top, 1 * BS, height);
      ctx.fillRect(end, top, 1 * BS, height);
    });

    if (mScore.laneLabels() && canvasWidth > 400) {
      ctx.globalAlpha = 1;
      ctx.font = `700 ${11 * backingScale()}px Voltaire`;
      ctx.textAlign = 'left';
      ctx.fillStyle = mScore.isMuted() ? getNoteColor() : '#968740';
      mScore.laneLabels().forEach((label, i) => {
        ctx.fillText(`${i} ${label}`, 4 * backingScale(), yRange((heightInCells) - i) - (7 * backingScale()));
      });
    }

    if (mScore.isMuted() && canvasWidth < 400) {
      ctx.globalAlpha = 1;
      ctx.font = `${14 * backingScale()}px Voltaire`;
      ctx.fillStyle = getNoteColor();
      ctx.textAlign = 'center';
      ctx.fillText('LOOP IS MUTED', xRangeBeats(8), yRange(heightInCells / 1.8));
    }

    ctx.restore();
  }

  function update() {
    if (!mCanvas) { return; }
    const ctx = mCanvas.getContext('2d');
    drawGrid(ctx);
    drawNotes(ctx);
  }

  function onBackingScaleChanged() {
    xRange = d3.scale.linear()
      .range([0, canvasWidth * backingScale()])
      .domain([0, widthInCells]);

    xRangeBeats = d3.scale.linear()
      .range([0, canvasWidth * backingScale()])
      .domain([0, 16]);

    yRange = d3.scale.linear()
      .range([canvasHeight * backingScale(), 0])
      .domain([heightInCells, 0]);

    update();
  }

  function init(score, widthInPx, heightInPx, noteColor, showPianoNotes, canvas) {
    mCanvas = canvas;
    mScore = score;
    mNoteColor = noteColor;
    mShowPianoNotes = showPianoNotes;

    mScore.bind('change', update);

    widthInCells = 64;
    heightInCells = score.laneCount();

    canvasWidth = widthInPx;
    canvasHeight = heightInPx;

    onBackingScaleChanged();
  }
};
