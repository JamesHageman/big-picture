import Canvas, { Image } from 'canvas'

export default function crop({
  buf,
  x,
  y,
  size
}, cb) {
  const canvas = new Canvas(size, size);
  const ctx = canvas.getContext('2d');
  const img = new Image;

  img.src = buf;

  ctx.drawImage(img, -x, -y, img.width, img.width);

  canvas.toBuffer((err, newBuf) => {
    cb(err, newBuf);
  })
}
