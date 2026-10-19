// Prepara a imagem de fundo: reduz o tamanho e converte para JPEG,
// para caber no armazenamento do navegador (que tem só alguns megabytes).
const LIMITE = 1_600_000; // tamanho máximo do texto da imagem (data URL)

function carregar(file) {
  return new Promise((ok, erro) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); erro(new Error('Não deu para abrir essa imagem. Tente JPG, PNG ou WEBP.')); };
    img.src = url;
  });
}

export async function prepararImagem(file) {
  if (!file || !String(file.type).startsWith('image/')) throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WEBP).');
  if (file.size > 30 * 1024 * 1024) throw new Error('Imagem muito grande. Use uma com menos de 30 MB.');
  const img = await carregar(file);
  let lado = 1920;
  let qualidade = 0.82;
  let resultado = '';
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const escala = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    resultado = canvas.toDataURL('image/jpeg', qualidade);
    if (resultado.length <= LIMITE) return resultado;
    lado = Math.round(lado * 0.8);
    qualidade = Math.max(0.5, qualidade - 0.08);
  }
  return resultado;
}
