// --- CLAVE SECRETA ---
// Pon aquí una contraseña larga y secreta.
// Deberás poner LA MISMA en Cloudflare (Paso 5).
const MI_CLAVE_SECRETA = "tu-contraseña-super-segura-aqui-12345";

// --- Parte 1: Configuración del QR ---
const qrCode = new QRCodeStyling({
  width: 300,
  height: 300,
  data: "https://wayne.com.mx", // Empezará con un placeholder
  image: "img/logo.png", // Asegúrate que tu logo esté en la misma carpeta
  imageOptions: { crossOrigin: "anonymous", margin: 10 },
  dotsOptions: { color: "#4A148C", type: "rounded" },
  backgroundOptions: { color: "#FFFFFF" },
  qrOptions: { errorCorrectionLevel: "H" }
});

// Adjuntamos el QR al canvas al cargar la página
qrCode.append(document.getElementById("canvas-qr"));


// --- Parte 2: Lógica de acortar y generar ---
const generateBtn = document.getElementById("generate-btn");
const longUrlInput = document.getElementById("long-url-input");
const customSlugInput = document.getElementById("custom-slug-input");
const resultArea = document.getElementById("result-area");
const shortUrlOutput = document.getElementById("short-url-output");

generateBtn.addEventListener("click", handleGeneration);

async function handleGeneration() {
  const longUrl = longUrlInput.value;
  let customSlug = customSlugInput.value;

  if (!longUrl) {
    alert("Por favor, introduce una URL larga.");
    return;
  }
  
  // Limpia el slug (quita / y espacios)
  if (customSlug) {
    customSlug = customSlug.replace(/^\//, "").trim();
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Creando link...";

  try {
    // --- LLAMADA AL API (Back-End) ---
    const response = await fetch("/api/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MI_CLAVE_SECRETA // Así nos autenticamos
      },
      body: JSON.stringify({
        longUrl: longUrl,
        slug: customSlug // Envía el slug (puede ser vacío)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "El link ya existe o es inválido");
    }

    const result = await response.json();
    const newShortUrl = result.shortUrl; // ej: https://mi-link.com/google-form

    // --- ¡ÉXITO! Ahora actualizamos el QR ---
    shortUrlOutput.value = newShortUrl;
    resultArea.classList.remove("hidden");

    // Actualiza el QR con el nuevo link corto
    qrCode.update({
      data: newShortUrl
    });

  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "1. Acortar Link y 2. Generar QR";
  }
}