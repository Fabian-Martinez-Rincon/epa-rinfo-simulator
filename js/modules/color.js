// Utilidades de color para las caras/sombras de los dibujos en canvas.
// Resuelve cualquier color CSS valido (hex, hsl(), color-mix(), etc.) a RGB
// pintando un pixel de 1x1 y leyendolo, asi no hace falta parsear cada
// formato a mano.

var shadeCanvas = null, shadeCtx = null;

export function resolveColorRGB(colorStr) {
  if (!shadeCanvas) {
    shadeCanvas = document.createElement('canvas');
    shadeCanvas.width = shadeCanvas.height = 1;
    shadeCtx = shadeCanvas.getContext('2d');
  }
  shadeCtx.clearRect(0, 0, 1, 1);
  shadeCtx.fillStyle = colorStr;
  shadeCtx.fillRect(0, 0, 1, 1);
  var d = shadeCtx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

// amount > 0 aclara hacia blanco, amount < 0 oscurece hacia negro.
export function shade(colorStr, amount) {
  var rgb = resolveColorRGB(colorStr);
  var target = amount < 0 ? 0 : 255;
  var k = Math.min(1, Math.abs(amount));
  var r = Math.round(rgb[0] + (target - rgb[0]) * k);
  var g = Math.round(rgb[1] + (target - rgb[1]) * k);
  var b = Math.round(rgb[2] + (target - rgb[2]) * k);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
